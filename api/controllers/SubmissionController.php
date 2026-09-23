<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../helpers/Auth.php';
require_once __DIR__ . '/../helpers/Validator.php';
require_once __DIR__ . '/../helpers/Logger.php';
require_once __DIR__ . '/StockController.php';
require_once __DIR__ . '/SettingsController.php';

class SubmissionController {
    // ----------------- PUBLIC ENDPOINTS -----------------

    public static function submitCorporateRequirement(): void {
        date_default_timezone_set('Asia/Dhaka');
        $db = Database::getConnection();

        // Check maintenance mode
        $settings = SettingsController::getSettings();
        if (!empty($settings['maintenanceMode'])) {
            $maintMsg = !empty($settings['maintenanceMessage']) ? $settings['maintenanceMessage'] : 'সাময়িক রক্ষণাবেক্ষণের জন্য আমাদের ক্রয়-বিক্রয় কার্যক্রম বর্তমানে বন্ধ রয়েছে। অনুগ্রহ করে কিছুক্ষণ পরে আবার চেষ্টা করুন।';
            Response::error($maintMsg, 503);
        }

        $data = Validator::getJsonBody();

        $companyName = !empty($data['companyName']) ? trim($data['companyName']) : (!empty($data['contactPerson']) ? trim($data['contactPerson']) : (!empty($data['name']) ? trim($data['name']) : ''));
        $contactPerson = !empty($data['contactPerson']) ? trim($data['contactPerson']) : (!empty($data['name']) ? trim($data['name']) : $companyName);
        $productName = trim($data['productName'] ?? '');
        $rawPhone = trim($data['phone'] ?? '');

        if (empty($companyName)) {
            Response::error('আপনার নাম অথবা প্রতিষ্ঠানের নাম আবশ্যক।', 422);
        }
        if (empty($productName)) {
            Response::error('কাঙ্ক্ষিত মাছের নাম উল্লেখ করুন।', 422);
        }
        if (empty($rawPhone)) {
            Response::error('যোগাযোগের মোবাইল নম্বর প্রদান করুন।', 422);
        }

        $phone = Validator::normalizeDigits($rawPhone);
        if (!preg_match('/^01[3-9]\d{8}$/', $phone)) {
            Response::error('অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 01712345678)।', 422);
        }

        $quantity = (float)($data['quantity'] ?? 0);
        if ($quantity <= 0) {
            Response::error('মাছের পরিমাণ ১ বা তার বেশি হতে হবে।', 422);
        }

        // Duplicate protection: prevent double submission within 60 seconds
        $dupCheck = $db->prepare("
            SELECT id FROM buyer_orders 
            WHERE phone = :phone AND product_name = :product_name AND created_at > DATE_SUB(NOW(), INTERVAL 60 SECOND)
            LIMIT 1
        ");
        $dupCheck->execute([
            ':phone' => $phone,
            ':product_name' => Validator::sanitize($productName)
        ]);
        if ($existing = $dupCheck->fetch()) {
            Response::success([
                'requirementId' => $existing['id'],
                'id' => $existing['id'],
                'message' => 'আপনার চাহিদাপত্রটি ইতোমধ্যে গৃহীত হয়েছে। আমাদের প্রতিনিধি দ্রুত যোগাযোগ করবে।'
            ]);
            return;
        }

        $id = 'REQ-' . time() . '-' . rand(100, 999);
        $nowDhaka = date('Y-m-d H:i:s');

        $stockId = trim($data['stockId'] ?? '');
        $productNameTrim = trim($productName);
        $unitPrice = null;
        $totalEstimatedValue = null;
        $matchedStock = null;

        if (!empty($stockId)) {
            $stkStmt = $db->prepare("SELECT id, product_name, bangla_name, price, unit FROM stocks WHERE id = :id OR slug = :slug LIMIT 1");
            $stkStmt->execute([':id' => $stockId, ':slug' => $stockId]);
            $matchedStock = $stkStmt->fetch();
        }

        if (!$matchedStock && !empty($productNameTrim)) {
            $stkStmt = $db->prepare("SELECT id, product_name, bangla_name, price, unit FROM stocks WHERE bangla_name = :p OR product_name = :p LIMIT 1");
            $stkStmt->execute([':p' => $productNameTrim]);
            $matchedStock = $stkStmt->fetch();
        }

        if ($matchedStock && isset($matchedStock['price']) && (float)$matchedStock['price'] > 0) {
            $unitPrice = (float)$matchedStock['price'];
            $totalEstimatedValue = round($unitPrice * $quantity, 2);
        }

        $orderStatus = ($unitPrice !== null) ? 'quoted' : 'pending';
        $statusNote = ($unitPrice !== null)
            ? "সিস্টেম স্বয়ংক্রিয় দর নির্ধারণ: ৳{$unitPrice}/কেজি, মোট: ৳{$totalEstimatedValue}"
            : "চাহিদা জানান ফর্ম জমা";

        $statusHistory = [
            [
                'status' => $orderStatus,
                'timestamp' => date('Y-m-dTH:i:sZ'),
                'updatedBy' => 'অনলাইন সিস্টেম',
                'note' => $statusNote
            ]
        ];

        $matchedStockId = $matchedStock ? $matchedStock['id'] : (!empty($stockId) ? $stockId : null);

        $stmt = $db->prepare("
            INSERT INTO buyer_orders (
                id, company_name, contact_person, phone, email, stock_id, product_name, quantity, unit,
                required_date, delivery_location, specification, notes, status, order_status,
                quoted_price_per_unit, total_estimated_value,
                status_history, internal_notes,
                created_at, updated_at
            ) VALUES (
                :id, :company_name, :contact_person, :phone, :email, :stock_id, :product_name, :quantity, :unit,
                :required_date, :delivery_location, :specification, :notes, :status, :order_status,
                :quoted_price_per_unit, :total_estimated_value,
                :status_history, '[]',
                :created_at, :updated_at
            )
        ");

        $stmt->execute([
            ':id' => $id,
            ':company_name' => Validator::sanitize($companyName),
            ':contact_person' => Validator::sanitize($contactPerson),
            ':phone' => $phone,
            ':email' => trim($data['email'] ?? ''),
            ':stock_id' => $matchedStockId,
            ':product_name' => Validator::sanitize($productName),
            ':quantity' => $quantity,
            ':unit' => $data['unit'] ?? 'কেজি (KG)',
            ':required_date' => !empty($data['requiredDate']) ? $data['requiredDate'] : date('Y-m-d'),
            ':delivery_location' => Validator::sanitize($data['deliveryLocation'] ?? 'বাংলাদেশ'),
            ':specification' => Validator::sanitize($data['specification'] ?? ''),
            ':notes' => Validator::sanitize($data['notes'] ?? ''),
            ':status' => $orderStatus,
            ':order_status' => $orderStatus,
            ':quoted_price_per_unit' => $unitPrice,
            ':total_estimated_value' => $totalEstimatedValue,
            ':status_history' => json_encode($statusHistory, JSON_UNESCAPED_UNICODE),
            ':created_at' => $nowDhaka,
            ':updated_at' => $nowDhaka
        ]);

        $logDesc = "পণ্য: {$productName} ({$quantity} {$data['unit']})";
        if ($totalEstimatedValue !== null) {
            $logDesc .= " [মোট: ৳{$totalEstimatedValue}]";
        }
        Logger::log('নতুন চাহিদা জমা', 'order', $companyName, $logDesc, 'পাবলিক বায়ার');

        Response::success([
            'requirementId' => $id,
            'id' => $id,
            'unitPrice' => $unitPrice,
            'totalEstimatedValue' => $totalEstimatedValue,
            'message' => 'আপনার চাহিদাপত্র সফলভাবে গৃহীত হয়েছে। আমাদের সাপ্লাই টিম দ্রুত যোগাযোগ করবে।'
        ]);
    }

    public static function submitFarmerStock(): void {
        $settings = SettingsController::getSettings();
        if (!empty($settings['maintenanceMode'])) {
            $maintMsg = !empty($settings['maintenanceMessage']) ? $settings['maintenanceMessage'] : 'সাময়িক রক্ষণাবেক্ষণের জন্য আমাদের ক্রয়-বিক্রয় কার্যক্রম বর্তমানে বন্ধ রয়েছে। অনুগ্রহ করে কিছুক্ষণ পরে আবার চেষ্টা করুন।';
            Response::error($maintMsg, 503);
        }
        if (isset($settings['allowPublicSellerSubmissions']) && !$settings['allowPublicSellerSubmissions']) {
            Response::error('বর্তমানে ঘাট ও ঘের থেকে সরাসরি নতুন মাছের লট জমা নেওয়া সাময়িকভাবে স্থগিত রয়েছে। জরুরি প্রয়োজনে আমাদের সাপ্লাই টিমে সরাসরি যোগাযোগ করুন।', 403);
        }

        $data = Validator::getJsonBody();
        if (empty($data['farmerName']) || empty($data['productName']) || empty($data['phone'])) {
            Response::error('কৃষক/ঘাটের নাম, মাছের ধরন ও ফোন নম্বর আবশ্যক।', 422);
        }

        $db = Database::getConnection();
        $id = 'LOT-' . time() . '-' . rand(100, 999);

        $stmt = $db->prepare("
            INSERT INTO seller_lots (
                id, farmer_name, phone, district, product_name, stock_type, quantity, unit,
                location, availability_date, expected_price, description, images, status, verification_status
            ) VALUES (
                :id, :farmer_name, :phone, :district, :product_name, :stock_type, :quantity, :unit,
                :location, :availability_date, :expected_price, :description, :images, 'submitted', 'pending'
            )
        ");

        $stmt->execute([
            ':id' => $id,
            ':farmer_name' => Validator::sanitize($data['farmerName']),
            ':phone' => Validator::normalizeDigits(trim($data['phone'])),
            ':district' => Validator::sanitize($data['district'] ?? ''),
            ':product_name' => Validator::sanitize($data['productName']),
            ':stock_type' => $data['stockType'] ?? 'current',
            ':quantity' => (float)($data['quantity'] ?? 0),
            ':unit' => $data['unit'] ?? 'কেজি (KG)',
            ':location' => Validator::sanitize($data['location'] ?? ''),
            ':availability_date' => $data['availabilityDate'] ?? 'আজকের তাজা আহরণ',
            ':expected_price' => !empty($data['expectedPrice']) ? (float)$data['expectedPrice'] : null,
            ':description' => Validator::sanitize($data['description'] ?? ''),
            ':images' => json_encode($data['images'] ?? [], JSON_UNESCAPED_UNICODE)
        ]);

        Logger::log('ঘাট লট জমা', 'seller_lot', "{$data['farmerName']} ({$data['productName']})", "পরিমাণ: {$data['quantity']} {$data['unit']}", 'খামারি/ঘাট');

        Response::success([
            'submissionId' => $id,
            'message' => 'আপনার পণ্যের তথ্য সফলভাবে জমা হয়েছে। Gangchill টিম দ্রুত আপনার সাথে যোগাযোগ করবে।'
        ]);
    }

    public static function submitInvestorInterest(): void {
        $settings = SettingsController::getSettings();
        if (!empty($settings['maintenanceMode'])) {
            $maintMsg = !empty($settings['maintenanceMessage']) ? $settings['maintenanceMessage'] : 'সাময়িক রক্ষণাবেক্ষণের জন্য আমাদের ক্রয়-বিক্রয় কার্যক্রম বর্তমানে বন্ধ রয়েছে। অনুগ্রহ করে কিছুক্ষণ পরে আবার চেষ্টা করুন।';
            Response::error($maintMsg, 503);
        }
        if (isset($settings['allowPublicInvestorInterest']) && !$settings['allowPublicInvestorInterest']) {
            Response::error('বর্তমানে মৎস্য তহবিল প্রকল্পে নতুন বিনিয়োগ আবেদন সাময়িকভাবে বন্ধ রয়েছে। জরুরি প্রয়োজনে আমাদের ইনভেস্টমেন্ট ডেস্কে যোগাযোগ করুন।', 403);
        }

        $data = Validator::getJsonBody();
        if (empty($data['investorName']) || empty($data['phone']) || empty($data['interestedAmount'])) {
            Response::error('বিনিয়োগকারীর নাম, ফোন নম্বর ও অর্থের পরিমাণ আবশ্যক।', 422);
        }

        $db = Database::getConnection();
        $id = 'INV-INT-' . time() . '-' . rand(100, 999);

        $stmt = $db->prepare("
            INSERT INTO investor_interests (
                id, opportunity_id, opportunity_title, investor_name, phone, email,
                interested_amount, expected_profit, notes, status, created_at
            ) VALUES (
                :id, :opportunity_id, :opportunity_title, :investor_name, :phone, :email,
                :interested_amount, :expected_profit, :notes, 'pending', NOW()
            )
        ");

        $stmt->execute([
            ':id' => $id,
            ':opportunity_id' => $data['opportunityId'] ?? 'general',
            ':opportunity_title' => $data['opportunityTitle'] ?? 'সাধারণ প্রকিউরমেন্ট ফান্ড',
            ':investor_name' => Validator::sanitize($data['investorName']),
            ':phone' => Validator::normalizeDigits(trim($data['phone'])),
            ':email' => trim($data['email'] ?? ''),
            ':interested_amount' => (float)$data['interestedAmount'],
            ':expected_profit' => !empty($data['expectedProfit']) ? (float)$data['expectedProfit'] : null,
            ':notes' => Validator::sanitize($data['notes'] ?? '')
        ]);

        Logger::log('বিনিয়োগ আগ্রহ জমা', 'investment', $data['investorName'], "তহবিল: {$data['opportunityTitle']} (৳{$data['interestedAmount']})", 'বিনিয়োগকারী');

        Response::success([
            'interestId' => $id,
            'message' => 'বিনিয়োগের আগ্রহ প্রকাশের জন্য ধন্যবাদ। আমাদের প্রতিনিধি আপনার সাথে শীঘ্রই যোগাযোগ করবেন।'
        ]);
    }

    public static function submitContactMessage(): void {
        $data = Validator::getJsonBody();
        if (empty($data['name']) || empty($data['phone']) || empty($data['message'])) {
            Response::error('নাম, ফোন নম্বর এবং বার্তা অবশ্যই পূরণ করতে হবে।', 422);
        }

        $db = Database::getConnection();
        $id = 'MSG-' . time() . '-' . rand(100, 999);

        $stmt = $db->prepare("INSERT INTO contact_messages (id, name, phone, message) VALUES (:id, :n, :p, :m)");
        $stmt->execute([
            ':id' => $id,
            ':n' => Validator::sanitize($data['name']),
            ':p' => Validator::normalizeDigits(trim($data['phone'])),
            ':m' => Validator::sanitize($data['message'])
        ]);

        Response::success(['messageId' => $id], 'বার্তা সফলভাবে পাঠানো হয়েছে।');
    }

    // ----------------- ADMIN ENDPOINTS -----------------

    public static function formatSellerLotRow(array $row): array {
        return [
            'id' => $row['id'],
            'farmerName' => $row['farmer_name'],
            'phone' => $row['phone'],
            'district' => $row['district'],
            'productName' => $row['product_name'],
            'stockType' => $row['stock_type'],
            'quantity' => (float)$row['quantity'],
            'unit' => $row['unit'],
            'location' => $row['location'],
            'availabilityDate' => $row['availability_date'],
            'expectedPrice' => $row['expected_price'] !== null ? (float)$row['expected_price'] : null,
            'description' => $row['description'],
            'images' => !empty($row['images']) ? json_decode($row['images'], true) : [],
            'status' => $row['status'],
            'verificationStatus' => $row['verification_status'],
            'fieldInspectorName' => $row['field_inspector_name'],
            'inspectionNotes' => $row['inspection_notes'],
            'approvedWholesalePrice' => $row['approved_wholesale_price'] !== null ? (float)$row['approved_wholesale_price'] : null,
            'convertedStockId' => $row['converted_stock_id'],
            'stockDeletedAt' => $row['stock_deleted_at'] ?? null,
            'stockDeletedName' => $row['stock_deleted_name'] ?? null,
            'isStockDeleted' => !empty($row['stock_deleted_at']),
            'createdAt' => $row['created_at'],
            'updatedAt' => $row['updated_at']
        ];
    }

    public static function listSellerLots(): void {
        Auth::requireAuth();
        $db = Database::getConnection();
        $stmt = $db->query("SELECT * FROM seller_lots ORDER BY created_at DESC");
        $rows = $stmt->fetchAll();
        $lots = array_map([self::class, 'formatSellerLotRow'], $rows);
        Response::success($lots);
    }

    public static function getSellerLot(string $id): void {
        Auth::requireAuth();
        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT * FROM seller_lots WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();
        if (!$row) Response::notFound('লটের তথ্য পাওয়া যায়নি।');
        Response::success(self::formatSellerLotRow($row));
    }

    public static function updateSellerLotStatus(string $id): void {
        $admin = Auth::requireAuth();
        $data = Validator::getJsonBody();
        $status = $data['status'] ?? 'pending';
        $notes = $data['notes'] ?? '';

        $db = Database::getConnection();
        $stmt = $db->prepare("UPDATE seller_lots SET verification_status = :st, inspection_notes = :notes WHERE id = :id");
        $stmt->execute([':st' => $status, ':notes' => $notes, ':id' => $id]);

        Logger::log('ঘাট লট স্ট্যাটাস আপডেট', 'seller_lot', "Lot ID: $id", "স্ট্যাটাস: $status", $admin['name']);
        self::getSellerLot($id);
    }

    public static function convertLotToStock(string $id): void {
        $admin = Auth::requireAuth();
        $data = Validator::getJsonBody();

        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT * FROM seller_lots WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $lot = $stmt->fetch();

        if (!$lot) {
            Response::notFound('লট পাওয়া যায়নি।');
        }

        $stockId = 'fish-' . time() . '-' . rand(10, 99);
        $slug = Validator::slugify($lot['product_name']) . '-' . rand(100, 999);
        $images = !empty($lot['images']) ? json_decode($lot['images'], true) : [];
        if (empty($images)) {
            $images = ['/hero-fishermen-boat.png'];
        }

        $insertStock = $db->prepare("
            INSERT INTO stocks (
                id, slug, product_name, bangla_name, category, status, quantity, unit,
                location, district, division, grade, availability_date, packaging,
                minimum_order, price, price_type, description, images, specifications, featured
            ) VALUES (
                :id, :slug, :pname, :bname, 'দেশি মাছ', :status, :qty, :unit,
                :loc, :dist, 'বিভাগ', 'ফিল্ড ভেরিফাইড গ্রেড A', :av_date, 'ইনসুলেটেড আইস ক্রেট',
                50, :price, 'fixed', :desc, :images, '[]', 0
            )
        ");

        $insertStock->execute([
            ':id' => $stockId,
            ':slug' => $slug,
            ':pname' => $lot['product_name'],
            ':bname' => $lot['product_name'],
            ':status' => ($lot['stock_type'] === 'current' ? 'live' : 'upcoming'),
            ':qty' => (float)$lot['quantity'],
            ':unit' => $lot['unit'],
            ':loc' => $lot['location'],
            ':dist' => $lot['district'],
            ':av_date' => $lot['availability_date'] ?: 'আজকের তাজা সংগ্রহ',
            ':price' => $lot['expected_price'] ? (float)$lot['expected_price'] : 0,
            ':desc' => $lot['description'] ?: "{$lot['district']} অঞ্চল থেকে সরাসরি সংগৃহীত।",
            ':images' => json_encode($images, JSON_UNESCAPED_UNICODE)
        ]);

        // Update lot
        $db->prepare("UPDATE seller_lots SET verification_status = 'approved', converted_stock_id = :sid WHERE id = :id")->execute([
            ':sid' => $stockId,
            ':id' => $id
        ]);

        Logger::log('সরবরাহ লট থেকে স্টক তৈরি', 'stock', $lot['product_name'], "লট $id হতে স্টক $stockId তৈরি হয়েছে", $admin['name']);

        StockController::get($stockId);
    }

    public static function listInvestorInterests(): void {
        Auth::requireAuth();
        $db = Database::getConnection();
        $stmt = $db->query("SELECT * FROM investor_interests ORDER BY created_at DESC");
        $rows = $stmt->fetchAll();

        $formatted = array_map(function($r) {
            return [
                'id' => $r['id'],
                'opportunityId' => $r['opportunity_id'],
                'opportunityTitle' => $r['opportunity_title'],
                'investorName' => $r['investor_name'],
                'phone' => $r['phone'],
                'email' => $r['email'],
                'interestedAmount' => (float)$r['interested_amount'],
                'expectedProfit' => $r['expected_profit'] !== null ? (float)$r['expected_profit'] : null,
                'notes' => $r['notes'],
                'status' => $r['status'] ?? 'pending',
                'createdAt' => $r['created_at']
            ];
        }, $rows);

        Response::success($formatted);
    }

    public static function updateInvestorInterestStatus(string $id): void {
        $admin = Auth::requireAuth();
        $data = Validator::getJsonBody();
        $status = $data['status'] ?? 'pending';

        $db = Database::getConnection();
        $stmt = $db->prepare("UPDATE investor_interests SET status = :st WHERE id = :id");
        $stmt->execute([':st' => $status, ':id' => $id]);

        Logger::log('বিনিয়োগ আবেদন স্ট্যাটাস আপডেট', 'investment', "আবেদন ID: $id", "নতুন স্ট্যাটাস: $status", $admin['name']);

        $fetchStmt = $db->prepare("SELECT * FROM investor_interests WHERE id = :id LIMIT 1");
        $fetchStmt->execute([':id' => $id]);
        $r = $fetchStmt->fetch();
        if (!$r) {
            Response::notFound('আবেদন পাওয়া যায়নি।');
        }

        Response::success([
            'id' => $r['id'],
            'opportunityId' => $r['opportunity_id'],
            'opportunityTitle' => $r['opportunity_title'],
            'investorName' => $r['investor_name'],
            'phone' => $r['phone'],
            'email' => $r['email'],
            'interestedAmount' => (float)$r['interested_amount'],
            'expectedProfit' => $r['expected_profit'] !== null ? (float)$r['expected_profit'] : null,
            'notes' => $r['notes'],
            'status' => $r['status'] ?? 'pending',
            'createdAt' => $r['created_at']
        ], 'বিনিয়োগ আবেদনের অবস্থা সফলভাবে হালনাগাদ করা হয়েছে।');
    }

    public static function deleteInvestorInterest(string $id): void {
        $admin = Auth::requireAuth();
        $db = Database::getConnection();
        $db->prepare("DELETE FROM investor_interests WHERE id = :id")->execute([':id' => $id]);
        Logger::log('বিনিয়োগ আবেদন মুছে ফেলা', 'investment', "ID: $id", '', $admin['name']);
        Response::success(null, 'আবেদন মুছে ফেলা হয়েছে।');
    }
}
