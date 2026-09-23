const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const apiDir = path.join(root, 'api');

function writeFile(relPath, content) {
  const fullPath = path.join(apiDir, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log(`Wrote: ${relPath}`);
}

// ============================================================
// 1. Logger Helper (activity_logs)
// ============================================================
writeFile('helpers/Logger.php', `<?php
require_once __DIR__ . '/../config/database.php';

class Logger {
    public static function log(string $action, string $targetType, string $targetTitle, ?string $details = null, string $actor = 'MD Admin'): void {
        try {
            $db = Database::getConnection();
            $id = 'act-' . time() . '-' . rand(100, 999);
            $stmt = $db->prepare("
                INSERT INTO activity_logs (id, action, target_type, target_title, actor, details, timestamp)
                VALUES (:id, :action, :target_type, :target_title, :actor, :details, NOW())
            ");
            $stmt->execute([
                ':id' => $id,
                ':action' => $action,
                ':target_type' => $targetType,
                ':target_title' => $targetTitle,
                ':actor' => $actor,
                ':details' => $details
            ]);
        } catch (Exception $e) {
            // Non-blocking
        }
    }
}
`);

// ============================================================
// 2. Updated Database Init / Seeder
// ============================================================
writeFile('database/init.php', `<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/Auth.php';

try {
    $db = Database::getConnection();
    echo "Connected to database successfully.\\n";

    // 1. Seed Admin User
    $stmt = $db->prepare("SELECT COUNT(*) FROM admins WHERE email = 'admin@gangchill.com'");
    $stmt->execute();
    if ((int)$stmt->fetchColumn() === 0) {
        $adminId = 'adm-001';
        $passHash = Auth::hashPassword('admin123');
        $insertAdmin = $db->prepare("
            INSERT INTO admins (id, name, email, password_hash, role, designation, avatar, phone)
            VALUES (:id, :name, :email, :password_hash, :role, :designation, :avatar, :phone)
        ");
        $insertAdmin->execute([
            ':id' => $adminId,
            ':name' => 'MD Admin',
            ':email' => 'admin@gangchill.com',
            ':password_hash' => $passHash,
            ':role' => 'superadmin',
            ':designation' => 'ম্যানেজিং ডিরেক্টর ও অ্যাডমিন',
            ':avatar' => 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
            ':phone' => '01712-345678'
        ]);
        echo "Superadmin seeded: admin@gangchill.com / admin123\\n";
    }

    // 2. Seed Platform Settings
    $stmt = $db->prepare("SELECT COUNT(*) FROM platform_settings WHERE id = 1");
    $stmt->execute();
    if ((int)$stmt->fetchColumn() === 0) {
        $defaultSettings = [
            'platformName' => 'Gangchill B2B Hub',
            'tagline' => 'জাতীয় সামুদ্রিক ও নদীর মাছের পাইকারি সরবরাহ নেটওয়ার্ক',
            'supportEmail' => 'supply@gangchill.com',
            'emergencyHotline' => '+880 1712-345678',
            'businessHours' => 'শনিবার - বৃহস্পতিবার: সকাল ৮টা - রাত ১০টা',
            'headOfficeAddress' => 'হাউস ১২, রোড ৯, ব্লক-সি, গুলশান-১, ঢাকা ১২১২, বাংলাদেশ',
            'hubLocations' => 'চাঁদপুর বড়স্টেশন, কক্সবাজার ফিশারি ঘাট, খুলনা রূপসা, নাটোর চলনবিল, ভৈরব মেঘনা ঘাট',
            'defaultMoqKg' => 50,
            'coldChainEnabled' => true,
            'allowPublicSellerSubmissions' => true,
            'allowPublicInvestorInterest' => true,
            'maintenanceMode' => false,
            'notifyOnNewOrder' => true,
            'notifyOnNewLot' => true,
            'notifyOnNewInvestmentInterest' => true
        ];
        $insertSettings = $db->prepare("
            INSERT INTO platform_settings (id, settings_json, updated_by)
            VALUES (1, :json, 'MD Admin')
        ");
        $insertSettings->execute([
            ':json' => json_encode($defaultSettings, JSON_UNESCAPED_UNICODE)
        ]);
        echo "Platform default settings seeded.\\n";
    }

    // 3. Seed Seed Data from JSON
    $jsonFile = __DIR__ . '/seed_data.json';
    if (file_exists($jsonFile)) {
        $data = json_decode(file_get_contents($jsonFile), true);

        // Stocks
        if (!empty($data['stocks'])) {
            $stmt = $db->prepare("SELECT COUNT(*) FROM stocks");
            $stmt->execute();
            if ((int)$stmt->fetchColumn() === 0) {
                $insertStock = $db->prepare("
                    INSERT INTO stocks (
                        id, slug, product_name, bangla_name, category, status, quantity, unit,
                        location, district, division, grade, harvest_date, packaging, minimum_order,
                        price, price_type, description, images, specifications, origin_details, logistics, featured
                    ) VALUES (
                        :id, :slug, :product_name, :bangla_name, :category, :status, :quantity, :unit,
                        :location, :district, :division, :grade, :harvest_date, :packaging, :minimum_order,
                        :price, :price_type, :description, :images, :specifications, :origin_details, :logistics, :featured
                    )
                ");

                foreach ($data['stocks'] as $s) {
                    $insertStock->execute([
                        ':id' => $s['id'],
                        ':slug' => $s['slug'],
                        ':product_name' => $s['productName'],
                        ':bangla_name' => $s['banglaName'],
                        ':category' => $s['category'],
                        ':status' => $s['status'],
                        ':quantity' => $s['quantity'],
                        ':unit' => $s['unit'],
                        ':location' => $s['location'],
                        ':district' => $s['district'],
                        ':division' => $s['division'],
                        ':grade' => $s['grade'],
                        ':harvest_date' => $s['harvestDate'] ?? ($s['availabilityDate'] ?? null),
                        ':packaging' => $s['packaging'],
                        ':minimum_order' => $s['minimumOrder'] ?? 50,
                        ':price' => $s['price'],
                        ':price_type' => $s['priceType'] ?? 'fixed',
                        ':description' => $s['description'],
                        ':images' => json_encode($s['images'] ?? [], JSON_UNESCAPED_UNICODE),
                        ':specifications' => json_encode($s['specifications'] ?? [], JSON_UNESCAPED_UNICODE),
                        ':origin_details' => json_encode($s['originDetails'] ?? null, JSON_UNESCAPED_UNICODE),
                        ':logistics' => json_encode($s['logistics'] ?? null, JSON_UNESCAPED_UNICODE),
                        ':featured' => !empty($s['featured']) ? 1 : 0
                    ]);
                }
                echo "Seeded " . count($data['stocks']) . " fish stocks.\\n";
            }
        }

        // Investments
        if (!empty($data['investments'])) {
            $stmt = $db->prepare("SELECT COUNT(*) FROM investments");
            $stmt->execute();
            if ((int)$stmt->fetchColumn() === 0) {
                $insertInv = $db->prepare("
                    INSERT INTO investments (
                        id, slug, stock_id, title, product_name, category, location,
                        required_capital, raised_capital, minimum_investment, profit_percentage,
                        duration_days, start_date, settlement_date, status, description,
                        procurement_plan, timeline, risks, security_and_compliance, images, investor_count
                    ) VALUES (
                        :id, :slug, :stock_id, :title, :product_name, :category, :location,
                        :required_capital, :raised_capital, :minimum_investment, :profit_percentage,
                        :duration_days, :start_date, :settlement_date, :status, :description,
                        :procurement_plan, :timeline, :risks, :security_and_compliance, :images, :investor_count
                    )
                ");

                foreach ($data['investments'] as $inv) {
                    $insertInv->execute([
                        ':id' => $inv['id'],
                        ':slug' => $inv['slug'],
                        ':stock_id' => $inv['stockId'] ?? null,
                        ':title' => $inv['title'],
                        ':product_name' => $inv['productName'],
                        ':category' => $inv['category'],
                        ':location' => $inv['location'],
                        ':required_capital' => $inv['requiredCapital'],
                        ':raised_capital' => $inv['raisedCapital'],
                        ':minimum_investment' => $inv['minimumInvestment'],
                        ':profit_percentage' => $inv['profitPercentage'],
                        ':duration_days' => $inv['durationDays'],
                        ':start_date' => $inv['startDate'] ?? null,
                        ':settlement_date' => $inv['settlementDate'] ?? null,
                        ':status' => $inv['status'],
                        ':description' => $inv['description'],
                        ':procurement_plan' => json_encode($inv['procurementPlan'] ?? [], JSON_UNESCAPED_UNICODE),
                        ':timeline' => json_encode($inv['timeline'] ?? [], JSON_UNESCAPED_UNICODE),
                        ':risks' => json_encode($inv['risks'] ?? [], JSON_UNESCAPED_UNICODE),
                        ':security_and_compliance' => json_encode($inv['securityAndCompliance'] ?? [], JSON_UNESCAPED_UNICODE),
                        ':images' => json_encode($inv['images'] ?? [], JSON_UNESCAPED_UNICODE),
                        ':investor_count' => $inv['investorCount'] ?? 0
                    ]);
                }
                echo "Seeded " . count($data['investments']) . " investment projects.\\n";
            }
        }

        // Blog Posts
        if (!empty($data['blogPosts'])) {
            $stmt = $db->prepare("SELECT COUNT(*) FROM blog_posts");
            $stmt->execute();
            if ((int)$stmt->fetchColumn() === 0) {
                $insertBlog = $db->prepare("
                    INSERT INTO blog_posts (
                        slug, title, excerpt, content, category, featured_image, image_alt,
                        author, published_at, reading_time, seo_title, seo_description, keywords, featured
                    ) VALUES (
                        :slug, :title, :excerpt, :content, :category, :featured_image, :image_alt,
                        :author, :published_at, :reading_time, :seo_title, :seo_description, :keywords, :featured
                    )
                ");

                foreach ($data['blogPosts'] as $bp) {
                    $insertBlog->execute([
                        ':slug' => $bp['slug'],
                        ':title' => $bp['title'],
                        ':excerpt' => $bp['excerpt'],
                        ':content' => $bp['content'],
                        ':category' => $bp['category'],
                        ':featured_image' => $bp['featuredImage'] ?? null,
                        ':image_alt' => $bp['imageAlt'] ?? null,
                        ':author' => $bp['author'] ?? 'Gangchill Editorial Team',
                        ':published_at' => $bp['publishedAt'] ?? date('Y-m-d'),
                        ':reading_time' => $bp['readingTime'] ?? '৫ মিনিট পড়া',
                        ':seo_title' => $bp['seoTitle'] ?? null,
                        ':seo_description' => $bp['seoDescription'] ?? null,
                        ':keywords' => json_encode($bp['keywords'] ?? [], JSON_UNESCAPED_UNICODE),
                        ':featured' => !empty($bp['featured']) ? 1 : 0
                    ]);
                }
                echo "Seeded " . count($data['blogPosts']) . " blog posts.\\n";
            }
        }
    }

    // 4. Seed Initial Buyer Orders
    $stmt = $db->prepare("SELECT COUNT(*) FROM buyer_orders");
    $stmt->execute();
    if ((int)$stmt->fetchColumn() === 0) {
        $insertOrder = $db->prepare("
            INSERT INTO buyer_orders (
                id, company_name, contact_person, phone, email, product_name, quantity, unit,
                required_date, delivery_location, specification, notes, status, order_status,
                quoted_price_per_unit, total_estimated_value, assigned_staff, status_history, internal_notes
            ) VALUES (
                :id, :company_name, :contact_person, :phone, :email, :product_name, :quantity, :unit,
                :required_date, :delivery_location, :specification, :notes, :status, :order_status,
                :quoted_price_per_unit, :total_estimated_value, :assigned_staff, :status_history, :internal_notes
            )
        ");

        $demoOrders = [
            [
                'id' => 'REQ-1726001001',
                'company_name' => 'ইউনিমার্ট সুপারশপ (গুলশান ২ ব্রাঞ্চ)',
                'contact_person' => 'তানভীর আহমেদ',
                'phone' => '01711-223344',
                'email' => 'procurement@unimart.com.bd',
                'product_name' => 'চাঁদপুরের পদ্মার রূপালী ইলিশ',
                'quantity' => 350,
                'unit' => 'কেজি (KG)',
                'required_date' => '2026-09-20',
                'delivery_location' => 'গুলশান ২, ঢাকা',
                'specification' => '১ কেজি+ সাইজ গ্রেড, তাজা বরফ প্যাক, নো ফরমালিন সার্টিফিকেট আবশ্যক',
                'notes' => 'সকাল ৮টার মধ্যে আনলোড নিশ্চিত করতে হবে',
                'status' => 'pending',
                'order_status' => 'under_review',
                'quoted_price_per_unit' => 1620,
                'total_estimated_value' => 567000,
                'assigned_staff' => 'MD Admin',
                'status_history' => [
                    ['status' => 'pending', 'timestamp' => '2026-09-14T08:30:00Z', 'updatedBy' => 'সিস্টেম (ওয়েব ফর্ম)', 'note' => 'ক্রেতা কর্তৃক চাহিদাপত্র জমা'],
                    ['status' => 'under_review', 'timestamp' => '2026-09-14T10:15:00Z', 'updatedBy' => 'MD Admin', 'note' => 'চাঁদপুর বড়স্টেশন ঘাটে লট বরাদ্দ যাচাই চলছে']
                ],
                'internal_notes' => []
            ],
            [
                'id' => 'REQ-1726001002',
                'company_name' => 'রেডিসন ব্লু ঢাকা ওয়াটার গার্ডেন',
                'contact_person' => 'শেফ মাহবুবুল আলম',
                'phone' => '01819-887766',
                'email' => 'executive.chef@radissondhaka.com',
                'product_name' => 'খুলনা ও সাতক্ষীরার বাগদা চিংড়ি',
                'quantity' => 150,
                'unit' => 'কেজি (KG)',
                'required_date' => '2026-09-18',
                'delivery_location' => 'বিমানবন্দর রোড, ঢাকা',
                'specification' => '১৬/২০ কাউন্ট এক্সপোর্ট গ্রেড, হেড-অন শেল-অন (HOSO), সম্পূর্ণ ফ্রেশ',
                'notes' => 'রেফার ভ্যানে তাপমাত্রা -২° সে.-এ রাখা দরকার',
                'status' => 'reviewed',
                'order_status' => 'confirmed',
                'quoted_price_per_unit' => 980,
                'total_estimated_value' => 147000,
                'assigned_staff' => 'MD Admin',
                'status_history' => [
                    ['status' => 'pending', 'timestamp' => '2026-09-13T14:20:00Z', 'updatedBy' => 'সিস্টেম'],
                    ['status' => 'confirmed', 'timestamp' => '2026-09-14T11:00:00Z', 'updatedBy' => 'MD Admin', 'note' => 'অফিশিয়াল পারচেজ অর্ডার কনফার্মড']
                ],
                'internal_notes' => []
            ]
        ];

        foreach ($demoOrders as $ord) {
            $insertOrder->execute([
                ':id' => $ord['id'],
                ':company_name' => $ord['company_name'],
                ':contact_person' => $ord['contact_person'],
                ':phone' => $ord['phone'],
                ':email' => $ord['email'],
                ':product_name' => $ord['product_name'],
                ':quantity' => $ord['quantity'],
                ':unit' => $ord['unit'],
                ':required_date' => $ord['required_date'],
                ':delivery_location' => $ord['delivery_location'],
                ':specification' => $ord['specification'],
                ':notes' => $ord['notes'],
                ':status' => $ord['status'],
                ':order_status' => $ord['order_status'],
                ':quoted_price_per_unit' => $ord['quoted_price_per_unit'],
                ':total_estimated_value' => $ord['total_estimated_value'],
                ':assigned_staff' => $ord['assigned_staff'],
                ':status_history' => json_encode($ord['status_history'], JSON_UNESCAPED_UNICODE),
                ':internal_notes' => json_encode($ord['internal_notes'], JSON_UNESCAPED_UNICODE)
            ]);
        }
        echo "Seeded demo buyer orders.\\n";
    }

    // 5. Seed Initial Seller Lots
    $stmt = $db->prepare("SELECT COUNT(*) FROM seller_lots");
    $stmt->execute();
    if ((int)$stmt->fetchColumn() === 0) {
        $insertLot = $db->prepare("
            INSERT INTO seller_lots (
                id, farmer_name, phone, district, product_name, stock_type, quantity, unit,
                location, availability_date, expected_price, description, images, status,
                verification_status, field_inspector_name, inspection_notes, approved_wholesale_price
            ) VALUES (
                :id, :farmer_name, :phone, :district, :product_name, :stock_type, :quantity, :unit,
                :location, :availability_date, :expected_price, :description, :images, :status,
                :verification_status, :field_inspector_name, :inspection_notes, :approved_wholesale_price
            )
        ");

        $demoLots = [
            [
                'id' => 'LOT-1726002001',
                'farmer_name' => 'মো: মোশাররফ হোসেন',
                'phone' => '01715-998877',
                'district' => 'চাঁদপুর',
                'product_name' => 'পদ্মার রূপালী ইলিশ (তাজা লট)',
                'stock_type' => 'current',
                'quantity' => 850,
                'unit' => 'কেজি (KG)',
                'location' => 'বড়স্টেশন মোহনা ঘাট, চাঁদপুর',
                'availability_date' => 'আজ ভোরের আহরণ',
                'expected_price' => 1550,
                'description' => 'মেঘনা-পদ্মার সঙ্গমস্থল থেকে আহরিত খাঁটি চকচকে ইলিশ। সরাসরি বরফ প্যাকেজে রেডি।',
                'images' => ['https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80'],
                'status' => 'submitted',
                'verification_status' => 'verified',
                'field_inspector_name' => 'MD Admin',
                'inspection_notes' => 'ঘাট পয়েন্টে কোয়ালিটি অডিট সফল। কোনো ফরমালিনের অস্তিত্ব পাওয়া যায়নি।',
                'approved_wholesale_price' => 1550
            ],
            [
                'id' => 'LOT-1726002002',
                'farmer_name' => 'হাজী সামসুল হক (ট্রলার মালিক)',
                'phone' => '01814-332211',
                'district' => 'কক্সবাজার',
                'product_name' => 'সাদা রূপচাঁদা ও ব্ল্যাক পমফ্রেট',
                'stock_type' => 'upcoming',
                'quantity' => 1200,
                'unit' => 'কেজি (KG)',
                'location' => 'ফিশারি ঘাট টার্মিনাল, কক্সবাজার',
                'availability_date' => 'আগামী পরশু সকাল',
                'expected_price' => 1100,
                'description' => 'বঙ্গোপসাগরের গভীর জলের ট্রলার আহরণ। ৩০০-৪০০ গ্রাম ওজনের প্রতিটি চাঁদা মাছ।',
                'images' => ['https://images.unsplash.com/photo-1534943441045-1089b75eb353?auto=format&fit=crop&w=800&q=80'],
                'status' => 'submitted',
                'verification_status' => 'pending',
                'field_inspector_name' => null,
                'inspection_notes' => 'ট্রলার ঘাটে ভিড়ার পর ফিজিক্যাল ইন্সপেকশন সম্পন্ন হবে।',
                'approved_wholesale_price' => null
            ]
        ];

        foreach ($demoLots as $lot) {
            $insertLot->execute([
                ':id' => $lot['id'],
                ':farmer_name' => $lot['farmer_name'],
                ':phone' => $lot['phone'],
                ':district' => $lot['district'],
                ':product_name' => $lot['product_name'],
                ':stock_type' => $lot['stock_type'],
                ':quantity' => $lot['quantity'],
                ':unit' => $lot['unit'],
                ':location' => $lot['location'],
                ':availability_date' => $lot['availability_date'],
                ':expected_price' => $lot['expected_price'],
                ':description' => $lot['description'],
                ':images' => json_encode($lot['images'], JSON_UNESCAPED_UNICODE),
                ':status' => $lot['status'],
                ':verification_status' => $lot['verification_status'],
                ':field_inspector_name' => $lot['field_inspector_name'],
                ':inspection_notes' => $lot['inspection_notes'],
                ':approved_wholesale_price' => $lot['approved_wholesale_price']
            ]);
        }
        echo "Seeded demo seller lots.\\n";
    }

    // 6. Seed Customers & Suppliers
    $stmt = $db->prepare("SELECT COUNT(*) FROM customers");
    $stmt->execute();
    if ((int)$stmt->fetchColumn() === 0) {
        $insertCust = $db->prepare("
            INSERT INTO customers (
                id, company_name, business_type, contact_person, phone, email, delivery_location,
                tier, total_orders_count, total_volume_kg, total_order_value, last_order_date, preferred_fish
            ) VALUES (
                :id, :company_name, :business_type, :contact_person, :phone, :email, :delivery_location,
                :tier, :total_orders_count, :total_volume_kg, :total_order_value, :last_order_date, :preferred_fish
            )
        ");
        $insertCust->execute([
            ':id' => 'CUST-001',
            ':company_name' => 'ইউনিমার্ট সুপারশপ (গুলশান ২ ব্রাঞ্চ)',
            ':business_type' => 'সুপারশপ চেইন',
            ':contact_person' => 'তানভীর আহমেদ',
            ':phone' => '01711-223344',
            ':email' => 'procurement@unimart.com.bd',
            ':delivery_location' => 'গুলশান ২, ঢাকা',
            ':tier' => 'VIP',
            ':total_orders_count' => 8,
            ':total_volume_kg' => 2850,
            ':total_order_value' => 4617000,
            ':last_order_date' => '2026-09-14',
            ':preferred_fish' => json_encode(['পদ্মার রূপালী ইলিশ', 'চলনবিলের পাবদা', 'গলদা চিংড়ি'], JSON_UNESCAPED_UNICODE)
        ]);
        echo "Seeded customer demo.\\n";
    }

    $stmt = $db->prepare("SELECT COUNT(*) FROM suppliers");
    $stmt->execute();
    if ((int)$stmt->fetchColumn() === 0) {
        $insertSup = $db->prepare("
            INSERT INTO suppliers (
                id, farmer_name, type, phone, district, location,
                verification_badge, total_lots_count, total_volume_kg, quality_rating, primary_species, joined_date
            ) VALUES (
                :id, :farmer_name, :type, :phone, :district, :location,
                :verification_badge, :total_lots_count, :total_volume_kg, :quality_rating, :primary_species, :joined_date
            )
        ");
        $insertSup->execute([
            ':id' => 'SUP-001',
            ':farmer_name' => 'মো: মোশাররফ হোসেন (জেলে সমবায়)',
            ':type' => 'জেলে সমবায়',
            ':phone' => '01715-998877',
            ':district' => 'চাঁদপুর',
            ':location' => 'বড়স্টেশন মোহনা ঘাট',
            ':verification_badge' => 'verified',
            ':total_lots_count' => 14,
            ':total_volume_kg' => 8500,
            ':quality_rating' => 4.9,
            ':primary_species' => json_encode(['পদ্মার রূপালী ইলিশ', 'মেঘনার পাঙ্গাশ', 'তপসে'], JSON_UNESCAPED_UNICODE),
            ':joined_date' => '2025-11-10'
        ]);
        echo "Seeded supplier demo.\\n";
    }

    echo "ALL DATABASE MIGRATION & SEEDING FINISHED SUCCESSFULLY!\\n";
} catch (Exception $e) {
    echo "Error in init.php: " . $e->getMessage() . "\\n";
    exit(1);
}
`);

// ============================================================
// 3. Controllers
// ============================================================

// 3.1 AuthController.php
writeFile('controllers/AuthController.php', `<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../helpers/Auth.php';
require_once __DIR__ . '/../helpers/Validator.php';
require_once __DIR__ . '/../helpers/Logger.php';

class AuthController {
    public static function login(): void {
        $data = Validator::getJsonBody();
        $email = trim($data['email'] ?? '');
        $password = trim($data['password'] ?? '');

        if (empty($email) || empty($password)) {
            Response::error('ইমেইল এবং পাসওয়ার্ড দুটিই প্রয়োজন।', 422);
        }

        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT * FROM admins WHERE email = :email LIMIT 1");
        $stmt->execute([':email' => $email]);
        $admin = $stmt->fetch();

        if (!$admin || !Auth::verifyPassword($password, $admin['password_hash'])) {
            Response::error('ইমেইল বা পাসওয়ার্ড সঠিক নয়। (সঠিক ক্রেডেনশিয়াল: admin@gangchill.com / admin123)', 401);
        }

        // Update last login
        $db->prepare("UPDATE admins SET last_login = NOW() WHERE id = :id")->execute([':id' => $admin['id']]);

        // Create session
        $session = Auth::createSession($admin['id']);

        $user = [
            'id' => $admin['id'],
            'name' => $admin['name'],
            'email' => $admin['email'],
            'role' => $admin['role'],
            'designation' => $admin['designation'],
            'avatar' => $admin['avatar'],
            'phone' => $admin['phone'],
            'lastLogin' => date('Y-m-d H:i:s')
        ];

        Logger::log('অ্যাডমিন লগইন', 'admin', $admin['name'], 'সফলভাবে অ্যাডমিন প্যানেলে লগইন করা হয়েছে', $admin['name']);

        Response::success([
            'token' => $session['token'],
            'expiresAt' => $session['expiresAt'],
            'user' => $user
        ], 'লগইন সফল হয়েছে।');
    }

    public static function me(): void {
        $user = Auth::requireAuth();
        Response::success($user);
    }

    public static function logout(): void {
        $token = Auth::getBearerToken();
        if ($token) {
            Auth::destroySession($token);
        }
        Response::success(null, 'লগআউট সফল হয়েছে।');
    }

    public static function updateProfile(): void {
        $currentUser = Auth::requireAuth();
        $data = Validator::getJsonBody();

        $db = Database::getConnection();
        $updates = [];
        $params = [':id' => $currentUser['id']];

        if (isset($data['name'])) {
            $updates[] = "name = :name";
            $params[':name'] = Validator::sanitize($data['name']);
        }
        if (isset($data['designation'])) {
            $updates[] = "designation = :designation";
            $params[':designation'] = Validator::sanitize($data['designation']);
        }
        if (isset($data['phone'])) {
            $updates[] = "phone = :phone";
            $params[':phone'] = Validator::normalizeDigits(trim($data['phone']));
        }
        if (isset($data['avatar'])) {
            $updates[] = "avatar = :avatar";
            $params[':avatar'] = trim($data['avatar']);
        }
        if (!empty($data['password'])) {
            $updates[] = "password_hash = :hash";
            $params[':hash'] = Auth::hashPassword($data['password']);
        }

        if (empty($updates)) {
            Response::error('আপডেট করার মতো কোনো তথ্য দেওয়া হয়নি।');
        }

        $sql = "UPDATE admins SET " . implode(', ', $updates) . " WHERE id = :id";
        $db->prepare($sql)->execute($params);

        // Fetch refreshed user
        $stmt = $db->prepare("SELECT id, name, email, role, designation, avatar, phone, last_login FROM admins WHERE id = :id");
        $stmt->execute([':id' => $currentUser['id']]);
        $refreshed = $stmt->fetch();

        Logger::log('অ্যাডমিন প্রোফাইল আপডেট', 'admin', $refreshed['name'], 'প্রোফাইলের তথ্য হালনাগাদ করা হয়েছে', $refreshed['name']);

        Response::success([
            'id' => $refreshed['id'],
            'name' => $refreshed['name'],
            'email' => $refreshed['email'],
            'role' => $refreshed['role'],
            'designation' => $refreshed['designation'],
            'avatar' => $refreshed['avatar'],
            'phone' => $refreshed['phone'],
            'lastLogin' => $refreshed['last_login']
        ], 'প্রোফাইল সফলভাবে আপডেট হয়েছে।');
    }
}
`);

// 3.2 StockController.php
writeFile('controllers/StockController.php', `<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../helpers/Auth.php';
require_once __DIR__ . '/../helpers/Validator.php';
require_once __DIR__ . '/../helpers/Logger.php';

class StockController {
    public static function formatStockRow(array $row): array {
        return [
            'id' => $row['id'],
            'slug' => $row['slug'],
            'productName' => $row['product_name'],
            'banglaName' => $row['bangla_name'],
            'category' => $row['category'],
            'status' => $row['status'],
            'quantity' => (float)$row['quantity'],
            'unit' => $row['unit'],
            'location' => $row['location'],
            'district' => $row['district'],
            'division' => $row['division'],
            'grade' => $row['grade'],
            'harvestDate' => $row['harvest_date'] ?: $row['availability_date'],
            'availabilityDate' => $row['availability_date'] ?: $row['harvest_date'],
            'packaging' => $row['packaging'],
            'minimumOrder' => $row['minimum_order'] !== null ? (float)$row['minimum_order'] : 50,
            'price' => (float)$row['price'],
            'priceType' => $row['price_type'] ?: 'fixed',
            'description' => $row['description'],
            'images' => !empty($row['images']) ? json_decode($row['images'], true) : [],
            'specifications' => !empty($row['specifications']) ? json_decode($row['specifications'], true) : [],
            'originDetails' => !empty($row['origin_details']) ? json_decode($row['origin_details'], true) : null,
            'logistics' => !empty($row['logistics']) ? json_decode($row['logistics'], true) : null,
            'featured' => (bool)$row['featured'],
            'createdAt' => $row['created_at'],
            'updatedAt' => $row['updated_at']
        ];
    }

    public static function list(): void {
        $db = Database::getConnection();
        $where = ["1=1"];
        $params = [];

        if (!empty($_GET['status']) && $_GET['status'] !== 'all') {
            $where[] = "status = :status";
            $params[':status'] = $_GET['status'];
        }

        if (!empty($_GET['category']) && $_GET['category'] !== 'সব') {
            $where[] = "category = :category";
            $params[':category'] = $_GET['category'];
        }

        if (!empty($_GET['district']) && $_GET['district'] !== 'সব জেলা') {
            $where[] = "district = :district";
            $params[':district'] = $_GET['district'];
        }

        if (!empty($_GET['searchQuery'])) {
            $q = '%' . trim($_GET['searchQuery']) . '%';
            $where[] = "(bangla_name LIKE :q1 OR product_name LIKE :q2 OR location LIKE :q3 OR category LIKE :q4)";
            $params[':q1'] = $q;
            $params[':q2'] = $q;
            $params[':q3'] = $q;
            $params[':q4'] = $q;
        }

        $sql = "SELECT * FROM stocks WHERE " . implode(' AND ', $where) . " ORDER BY created_at DESC";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        $stocks = array_map([self::class, 'formatStockRow'], $rows);
        Response::success($stocks);
    }

    public static function get(string $idOrSlug): void {
        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT * FROM stocks WHERE id = :id OR slug = :slug LIMIT 1");
        $stmt->execute([':id' => $idOrSlug, ':slug' => $idOrSlug]);
        $row = $stmt->fetch();

        if (!$row) {
            Response::notFound('মাছের স্টক তথ্য পাওয়া যায়নি।');
        }

        Response::success(self::formatStockRow($row));
    }

    public static function categories(): void {
        $db = Database::getConnection();
        $stmt = $db->query("SELECT DISTINCT category FROM stocks WHERE category IS NOT NULL AND category != '' ORDER BY category ASC");
        $cats = $stmt->fetchAll(PDO::FETCH_COLUMN);
        array_unshift($cats, 'সব');
        Response::success($cats);
    }

    public static function create(): void {
        $admin = Auth::requireAuth();
        $data = Validator::getJsonBody();

        if (empty($data['banglaName']) || empty($data['category'])) {
            Response::error('মাছের বাংলা নাম ও ক্যাটাগরি আবশ্যক।', 422);
        }

        $id = !empty($data['id']) ? $data['id'] : 'fish-' . time() . '-' . rand(10, 99);
        $slug = !empty($data['slug']) ? Validator::slugify($data['slug']) : Validator::slugify($data['productName'] ?? $data['banglaName']) . '-' . rand(100, 999);

        $db = Database::getConnection();
        $stmt = $db->prepare("
            INSERT INTO stocks (
                id, slug, product_name, bangla_name, category, status, quantity, unit,
                location, district, division, grade, harvest_date, availability_date, packaging,
                minimum_order, price, price_type, description, images, specifications, origin_details, logistics, featured
            ) VALUES (
                :id, :slug, :product_name, :bangla_name, :category, :status, :quantity, :unit,
                :location, :district, :division, :grade, :harvest_date, :availability_date, :packaging,
                :minimum_order, :price, :price_type, :description, :images, :specifications, :origin_details, :logistics, :featured
            )
        ");

        $stmt->execute([
            ':id' => $id,
            ':slug' => $slug,
            ':product_name' => $data['productName'] ?? $data['banglaName'],
            ':bangla_name' => $data['banglaName'],
            ':category' => $data['category'],
            ':status' => $data['status'] ?? 'live',
            ':quantity' => (float)($data['quantity'] ?? 0),
            ':unit' => $data['unit'] ?? 'কেজি (KG)',
            ':location' => $data['location'] ?? '',
            ':district' => $data['district'] ?? '',
            ':division' => $data['division'] ?? 'ঢাকা',
            ':grade' => $data['grade'] ?? 'গ্রেড A',
            ':harvest_date' => $data['harvestDate'] ?? null,
            ':availability_date' => $data['availabilityDate'] ?? ($data['harvestDate'] ?? null),
            ':packaging' => $data['packaging'] ?? 'ইনসুলেটেড বক্স',
            ':minimum_order' => (float)($data['minimumOrder'] ?? 50),
            ':price' => (float)($data['price'] ?? 0),
            ':price_type' => $data['priceType'] ?? 'fixed',
            ':description' => $data['description'] ?? '',
            ':images' => json_encode($data['images'] ?? [], JSON_UNESCAPED_UNICODE),
            ':specifications' => json_encode($data['specifications'] ?? [], JSON_UNESCAPED_UNICODE),
            ':origin_details' => json_encode($data['originDetails'] ?? null, JSON_UNESCAPED_UNICODE),
            ':logistics' => json_encode($data['logistics'] ?? null, JSON_UNESCAPED_UNICODE),
            ':featured' => !empty($data['featured']) ? 1 : 0
        ]);

        Logger::log('স্টক তৈরি', 'stock', $data['banglaName'], "নতুন মাছের স্টক তৈরি করা হয়েছে (ID: $id)", $admin['name']);

        self::get($id);
    }

    public static function update(string $id): void {
        $admin = Auth::requireAuth();
        $data = Validator::getJsonBody();

        $db = Database::getConnection();
        $chk = $db->prepare("SELECT * FROM stocks WHERE id = :id");
        $chk->execute([':id' => $id]);
        $existing = $chk->fetch();

        if (!$existing) {
            Response::notFound('মাছের স্টক তথ্য পাওয়া যায়নি।');
        }

        $fields = [
            'product_name' => $data['productName'] ?? $existing['product_name'],
            'bangla_name' => $data['banglaName'] ?? $existing['bangla_name'],
            'category' => $data['category'] ?? $existing['category'],
            'status' => $data['status'] ?? $existing['status'],
            'quantity' => isset($data['quantity']) ? (float)$data['quantity'] : (float)$existing['quantity'],
            'unit' => $data['unit'] ?? $existing['unit'],
            'location' => $data['location'] ?? $existing['location'],
            'district' => $data['district'] ?? $existing['district'],
            'division' => $data['division'] ?? $existing['division'],
            'grade' => $data['grade'] ?? $existing['grade'],
            'harvest_date' => $data['harvestDate'] ?? $existing['harvest_date'],
            'availability_date' => $data['availabilityDate'] ?? $existing['availability_date'],
            'packaging' => $data['packaging'] ?? $existing['packaging'],
            'minimum_order' => isset($data['minimumOrder']) ? (float)$data['minimumOrder'] : (float)$existing['minimum_order'],
            'price' => isset($data['price']) ? (float)$data['price'] : (float)$existing['price'],
            'price_type' => $data['priceType'] ?? $existing['price_type'],
            'description' => $data['description'] ?? $existing['description'],
            'images' => isset($data['images']) ? json_encode($data['images'], JSON_UNESCAPED_UNICODE) : $existing['images'],
            'specifications' => isset($data['specifications']) ? json_encode($data['specifications'], JSON_UNESCAPED_UNICODE) : $existing['specifications'],
            'origin_details' => isset($data['originDetails']) ? json_encode($data['originDetails'], JSON_UNESCAPED_UNICODE) : $existing['origin_details'],
            'logistics' => isset($data['logistics']) ? json_encode($data['logistics'], JSON_UNESCAPED_UNICODE) : $existing['logistics'],
            'featured' => isset($data['featured']) ? ($data['featured'] ? 1 : 0) : $existing['featured']
        ];

        $setPart = [];
        $params = [':id' => $id];
        foreach ($fields as $col => $val) {
            $setPart[] = "$col = :$col";
            $params[":$col"] = $val;
        }

        $sql = "UPDATE stocks SET " . implode(', ', $setPart) . " WHERE id = :id";
        $db->prepare($sql)->execute($params);

        Logger::log('স্টক আপডেট', 'stock', $fields['bangla_name'], "স্টকের তথ্য আপডেট করা হয়েছে (ID: $id)", $admin['name']);

        self::get($id);
    }

    public static function delete(string $id): void {
        $admin = Auth::requireAuth();
        $db = Database::getConnection();

        $chk = $db->prepare("SELECT bangla_name FROM stocks WHERE id = :id");
        $chk->execute([':id' => $id]);
        $title = $chk->fetchColumn();

        if (!$title) {
            Response::notFound('মাছের স্টক তথ্য পাওয়া যায়নি।');
        }

        $db->prepare("DELETE FROM stocks WHERE id = :id")->execute([':id' => $id]);
        Logger::log('স্টক অপসারণ', 'stock', $title, "স্টক মুছে ফেলা হয়েছে (ID: $id)", $admin['name']);

        Response::success(null, 'স্টক সফলভাবে মুছে ফেলা হয়েছে।');
    }

    public static function toggleStatus(string $id): void {
        $admin = Auth::requireAuth();
        $data = Validator::getJsonBody();
        $newStatus = $data['status'] ?? 'live';

        $db = Database::getConnection();
        $stmt = $db->prepare("UPDATE stocks SET status = :status WHERE id = :id");
        $stmt->execute([':status' => $newStatus, ':id' => $id]);

        Logger::log('স্টক স্ট্যাটাস পরিবর্তন', 'stock', "ID: $id", "নতুন স্ট্যাটাস: $newStatus", $admin['name']);
        self::get($id);
    }
}
`);

// 3.3 OrderController.php
writeFile('controllers/OrderController.php', `<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../helpers/Auth.php';
require_once __DIR__ . '/../helpers/Validator.php';
require_once __DIR__ . '/../helpers/Logger.php';

class OrderController {
    public static function formatOrderRow(array $row): array {
        return [
            'id' => $row['id'],
            'companyName' => $row['company_name'],
            'contactPerson' => $row['contact_person'],
            'phone' => $row['phone'],
            'email' => $row['email'],
            'productName' => $row['product_name'],
            'quantity' => (float)$row['quantity'],
            'unit' => $row['unit'],
            'requiredDate' => $row['required_date'],
            'deliveryLocation' => $row['delivery_location'],
            'specification' => $row['specification'],
            'notes' => $row['notes'],
            'status' => $row['status'],
            'orderStatus' => $row['order_status'],
            'quotedPricePerUnit' => $row['quoted_price_per_unit'] !== null ? (float)$row['quoted_price_per_unit'] : null,
            'totalEstimatedValue' => $row['total_estimated_value'] !== null ? (float)$row['total_estimated_value'] : null,
            'assignedStaff' => $row['assigned_staff'],
            'statusHistory' => !empty($row['status_history']) ? json_decode($row['status_history'], true) : [],
            'internalNotesList' => !empty($row['internal_notes']) ? json_decode($row['internal_notes'], true) : [],
            'createdAt' => $row['created_at'],
            'updatedAt' => $row['updated_at']
        ];
    }

    public static function list(): void {
        Auth::requireAuth();
        $db = Database::getConnection();
        $stmt = $db->query("SELECT * FROM buyer_orders ORDER BY created_at DESC");
        $rows = $stmt->fetchAll();
        $orders = array_map([self::class, 'formatOrderRow'], $rows);
        Response::success($orders);
    }

    public static function get(string $id): void {
        Auth::requireAuth();
        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT * FROM buyer_orders WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();

        if (!$row) {
            Response::notFound('অর্ডারের তথ্য পাওয়া যায়নি।');
        }

        Response::success(self::formatOrderRow($row));
    }

    public static function updateStatus(string $id): void {
        $admin = Auth::requireAuth();
        $data = Validator::getJsonBody();
        $newStatus = $data['orderStatus'] ?? $data['status'] ?? 'pending';
        $note = $data['note'] ?? '';

        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT * FROM buyer_orders WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $order = $stmt->fetch();

        if (!$order) {
            Response::notFound('অর্ডার পাওয়া যায়নি।');
        }

        $history = !empty($order['status_history']) ? json_decode($order['status_history'], true) : [];
        $historyItem = [
            'status' => $newStatus,
            'timestamp' => date('Y-m-d\TH:i:s\Z'),
            'updatedBy' => $admin['name'],
            'note' => $note ?: "স্ট্যাটাস পরিবর্তিত: $newStatus"
        ];
        array_unshift($history, $historyItem);

        $simpleStatus = ($newStatus === 'completed' || $newStatus === 'confirmed') ? 'reviewed' : 'pending';

        $upd = $db->prepare("
            UPDATE buyer_orders
            SET order_status = :os, status = :s, status_history = :hist, updated_at = NOW()
            WHERE id = :id
        ");
        $upd->execute([
            ':os' => $newStatus,
            ':s' => $simpleStatus,
            ':hist' => json_encode($history, JSON_UNESCAPED_UNICODE),
            ':id' => $id
        ]);

        Logger::log('অর্ডার স্ট্যাটাস আপডেট', 'order', "{$order['company_name']} ({$order['product_name']})", "নতুন স্ট্যাটাস: $newStatus", $admin['name']);

        self::get($id);
    }

    public static function addNote(string $id): void {
        $admin = Auth::requireAuth();
        $data = Validator::getJsonBody();
        $text = trim($data['text'] ?? '');

        if (empty($text)) {
            Response::error('নোটের বিষয়বস্তু ফাঁকা রাখা যাবে না।');
        }

        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT internal_notes FROM buyer_orders WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $currentNotesJson = $stmt->fetchColumn();

        if ($currentNotesJson === false) {
            Response::notFound('অর্ডার পাওয়া যায়নি।');
        }

        $notes = !empty($currentNotesJson) ? json_decode($currentNotesJson, true) : [];
        $newNote = [
            'id' => 'note-' . time() . '-' . rand(10, 99),
            'author' => $admin['name'],
            'text' => $text,
            'createdAt' => date('Y-m-d\TH:i:s\Z')
        ];
        array_unshift($notes, $newNote);

        $upd = $db->prepare("UPDATE buyer_orders SET internal_notes = :notes WHERE id = :id");
        $upd->execute([':notes' => json_encode($notes, JSON_UNESCAPED_UNICODE), ':id' => $id]);

        self::get($id);
    }

    public static function updateQuote(string $id): void {
        $admin = Auth::requireAuth();
        $data = Validator::getJsonBody();
        $quotedPrice = (float)($data['quotedPricePerUnit'] ?? 0);

        if ($quotedPrice <= 0) {
            Response::error('সঠিক কোটেশন দর উল্লেখ করুন।');
        }

        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT quantity, order_status, company_name FROM buyer_orders WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $order = $stmt->fetch();

        if (!$order) {
            Response::notFound('অর্ডার পাওয়া যায়নি।');
        }

        $totalVal = round($quotedPrice * (float)$order['quantity']);
        $newStatus = ($order['order_status'] === 'pending') ? 'quoted' : $order['order_status'];

        $upd = $db->prepare("
            UPDATE buyer_orders
            SET quoted_price_per_unit = :qp, total_estimated_value = :tot, order_status = :os
            WHERE id = :id
        ");
        $upd->execute([
            ':qp' => $quotedPrice,
            ':tot' => $totalVal,
            ':os' => $newStatus,
            ':id' => $id
        ]);

        Logger::log('কোটেশন প্রাইস আপডেট', 'order', $order['company_name'], "দর: ৳$quotedPrice, মোট: ৳$totalVal", $admin['name']);

        self::get($id);
    }
}
`);

// 3.4 SubmissionController.php
writeFile('controllers/SubmissionController.php', `<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../helpers/Auth.php';
require_once __DIR__ . '/../helpers/Validator.php';
require_once __DIR__ . '/../helpers/Logger.php';
require_once __DIR__ . '/StockController.php';

class SubmissionController {
    // ----------------- PUBLIC ENDPOINTS -----------------

    public static function submitCorporateRequirement(): void {
        $db = Database::getConnection();

        // Check maintenance mode
        $stmt = $db->prepare("SELECT settings_json FROM platform_settings WHERE id = 1");
        $stmt->execute();
        $settingsJson = $stmt->fetchColumn();
        if ($settingsJson) {
            $settings = json_decode($settingsJson, true);
            if (!empty($settings['maintenanceMode'])) {
                Response::error('প্ল্যাটফর্মের নিয়মিত কারিগরি রক্ষণাবেক্ষণের কারণে নতুন চাহিদা জমা সাময়িকভাবে স্থগিত রয়েছে। জরুরি প্রয়োজনে হটলাইনে যোগাযোগ করুন।', 403);
            }
        }

        $data = Validator::getJsonBody();
        if (empty($data['companyName']) || empty($data['productName']) || empty($data['phone'])) {
            Response::error('প্রতিষ্ঠানের নাম, মাছের নাম ও যোগাযোগ নম্বর আবশ্যক।', 422);
        }

        $id = 'REQ-' . time() . '-' . rand(100, 999);
        $statusHistory = [
            [
                'status' => 'pending',
                'timestamp' => date('Y-m-d\TH:i:s\Z'),
                'updatedBy' => 'ওয়েবসাইট ইউজার',
                'note' => 'অনলাইন রিকোয়ারমেন্ট ফর্ম জমা'
            ]
        ];

        $stmt = $db->prepare("
            INSERT INTO buyer_orders (
                id, company_name, contact_person, phone, email, product_name, quantity, unit,
                required_date, delivery_location, specification, notes, status, order_status, status_history, internal_notes
            ) VALUES (
                :id, :company_name, :contact_person, :phone, :email, :product_name, :quantity, :unit,
                :required_date, :delivery_location, :specification, :notes, 'pending', 'pending', :status_history, '[]'
            )
        ");

        $stmt->execute([
            ':id' => $id,
            ':company_name' => Validator::sanitize($data['companyName']),
            ':contact_person' => Validator::sanitize($data['contactPerson'] ?? ''),
            ':phone' => Validator::normalizeDigits(trim($data['phone'])),
            ':email' => trim($data['email'] ?? ''),
            ':product_name' => Validator::sanitize($data['productName']),
            ':quantity' => (float)($data['quantity'] ?? 0),
            ':unit' => $data['unit'] ?? 'কেজি (KG)',
            ':required_date' => $data['requiredDate'] ?? date('Y-m-d'),
            ':delivery_location' => Validator::sanitize($data['deliveryLocation'] ?? ''),
            ':specification' => Validator::sanitize($data['specification'] ?? ''),
            ':notes' => Validator::sanitize($data['notes'] ?? ''),
            ':status_history' => json_encode($statusHistory, JSON_UNESCAPED_UNICODE)
        ]);

        Logger::log('নতুন চাহিদা জমা', 'order', $data['companyName'], "পণ্য: {$data['productName']} ({$data['quantity']} {$data['unit']})", 'পাবলিক ভিজিটর');

        Response::success([
            'requirementId' => $id,
            'message' => 'আপনার করপোরেট চাহিদাপত্র গৃহীত হয়েছে। আমাদের সাপ্লাই টিম দ্রুত যোগাযোগ করবে।'
        ]);
    }

    public static function submitFarmerStock(): void {
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
        $data = Validator::getJsonBody();
        if (empty($data['investorName']) || empty($data['phone']) || empty($data['interestedAmount'])) {
            Response::error('বিনিয়োগকারীর নাম, ফোন নম্বর ও অর্থের পরিমাণ আবশ্যক।', 422);
        }

        $db = Database::getConnection();
        $id = 'INV-INT-' . time() . '-' . rand(100, 999);

        $stmt = $db->prepare("
            INSERT INTO investor_interests (
                id, opportunity_id, opportunity_title, investor_name, phone, email,
                interested_amount, expected_profit, notes, created_at
            ) VALUES (
                :id, :opportunity_id, :opportunity_title, :investor_name, :phone, :email,
                :interested_amount, :expected_profit, :notes, NOW()
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
                'createdAt' => $r['created_at']
            ];
        }, $rows);

        Response::success($formatted);
    }

    public static function deleteInvestorInterest(string $id): void {
        $admin = Auth::requireAuth();
        $db = Database::getConnection();
        $db->prepare("DELETE FROM investor_interests WHERE id = :id")->execute([':id' => $id]);
        Logger::log('বিনিয়োগ আবেদন মুছে ফেলা', 'investment', "ID: $id", '', $admin['name']);
        Response::success(null, 'আবেদন মুছে ফেলা হয়েছে।');
    }
}
`);

// 3.5 InvestmentController.php
writeFile('controllers/InvestmentController.php', `<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../helpers/Auth.php';
require_once __DIR__ . '/../helpers/Validator.php';
require_once __DIR__ . '/../helpers/Logger.php';

class InvestmentController {
    public static function formatInvestmentRow(array $row): array {
        return [
            'id' => $row['id'],
            'slug' => $row['slug'],
            'stockId' => $row['stock_id'],
            'title' => $row['title'],
            'productName' => $row['product_name'],
            'category' => $row['category'],
            'location' => $row['location'],
            'requiredCapital' => (float)$row['required_capital'],
            'raisedCapital' => (float)$row['raised_capital'],
            'minimumInvestment' => (float)$row['minimum_investment'],
            'profitPercentage' => (float)$row['profit_percentage'],
            'durationDays' => (int)$row['duration_days'],
            'startDate' => $row['start_date'],
            'settlementDate' => $row['settlement_date'],
            'status' => $row['status'],
            'investorCount' => (int)$row['investor_count'],
            'description' => $row['description'],
            'procurementPlan' => !empty($row['procurement_plan']) ? json_decode($row['procurement_plan'], true) : [],
            'timeline' => !empty($row['timeline']) ? json_decode($row['timeline'], true) : [],
            'risks' => !empty($row['risks']) ? json_decode($row['risks'], true) : [],
            'securityAndCompliance' => !empty($row['security_and_compliance']) ? json_decode($row['security_and_compliance'], true) : [],
            'images' => !empty($row['images']) ? json_decode($row['images'], true) : [],
            'createdAt' => $row['created_at'],
            'updatedAt' => $row['updated_at']
        ];
    }

    public static function list(): void {
        $db = Database::getConnection();
        $stmt = $db->query("SELECT * FROM investments ORDER BY created_at DESC");
        $rows = $stmt->fetchAll();
        $items = array_map([self::class, 'formatInvestmentRow'], $rows);
        Response::success($items);
    }

    public static function get(string $idOrSlug): void {
        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT * FROM investments WHERE id = :id OR slug = :slug LIMIT 1");
        $stmt->execute([':id' => $idOrSlug, ':slug' => $idOrSlug]);
        $row = $stmt->fetch();

        if (!$row) {
            Response::notFound('তহবিল প্রকল্পের তথ্য পাওয়া যায়নি।');
        }

        Response::success(self::formatInvestmentRow($row));
    }

    public static function create(): void {
        $admin = Auth::requireAuth();
        $data = Validator::getJsonBody();

        if (empty($data['title']) || empty($data['requiredCapital'])) {
            Response::error('প্রকল্পের শিরোনাম এবং লক্ষ্যমাত্রা আবশ্যক।', 422);
        }

        $id = !empty($data['id']) ? $data['id'] : 'inv-' . time();
        $slug = !empty($data['slug']) ? Validator::slugify($data['slug']) : Validator::slugify($data['title']) . '-' . rand(100, 999);

        $db = Database::getConnection();
        $stmt = $db->prepare("
            INSERT INTO investments (
                id, slug, stock_id, title, product_name, category, location,
                required_capital, raised_capital, minimum_investment, profit_percentage,
                duration_days, start_date, settlement_date, status, description,
                procurement_plan, timeline, risks, security_and_compliance, images, investor_count
            ) VALUES (
                :id, :slug, :stock_id, :title, :product_name, :category, :location,
                :required_capital, :raised_capital, :minimum_investment, :profit_percentage,
                :duration_days, :start_date, :settlement_date, :status, :description,
                :procurement_plan, :timeline, :risks, :security_and_compliance, :images, :investor_count
            )
        ");

        $stmt->execute([
            ':id' => $id,
            ':slug' => $slug,
            ':stock_id' => $data['stockId'] ?? null,
            ':title' => $data['title'],
            ':product_name' => $data['productName'] ?? $data['title'],
            ':category' => $data['category'] ?? 'প্রকিউরমেন্ট',
            ':location' => $data['location'] ?? 'ঢাকা',
            ':required_capital' => (float)$data['requiredCapital'],
            ':raised_capital' => (float)($data['raisedCapital'] ?? 0),
            ':minimum_investment' => (float)($data['minimumInvestment'] ?? 50000),
            ':profit_percentage' => (float)($data['profitPercentage'] ?? 15),
            ':duration_days' => (int)($data['durationDays'] ?? 30),
            ':start_date' => $data['startDate'] ?? date('Y-m-d'),
            ':settlement_date' => $data['settlementDate'] ?? null,
            ':status' => $data['status'] ?? 'open',
            ':description' => $data['description'] ?? '',
            ':procurement_plan' => json_encode($data['procurementPlan'] ?? [], JSON_UNESCAPED_UNICODE),
            ':timeline' => json_encode($data['timeline'] ?? [], JSON_UNESCAPED_UNICODE),
            ':risks' => json_encode($data['risks'] ?? [], JSON_UNESCAPED_UNICODE),
            ':security_and_compliance' => json_encode($data['securityAndCompliance'] ?? [], JSON_UNESCAPED_UNICODE),
            ':images' => json_encode($data['images'] ?? [], JSON_UNESCAPED_UNICODE),
            ':investor_count' => (int)($data['investorCount'] ?? 0)
        ]);

        Logger::log('তহবিল প্রকল্প তৈরি', 'investment', $data['title'], "ক্যাপিটাল: ৳{$data['requiredCapital']}", $admin['name']);

        self::get($id);
    }

    public static function update(string $id): void {
        $admin = Auth::requireAuth();
        $data = Validator::getJsonBody();

        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT * FROM investments WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $existing = $stmt->fetch();

        if (!$existing) {
            Response::notFound('প্রকল্প পাওয়া যায়নি।');
        }

        $fields = [
            'title' => $data['title'] ?? $existing['title'],
            'product_name' => $data['productName'] ?? $existing['product_name'],
            'category' => $data['category'] ?? $existing['category'],
            'location' => $data['location'] ?? $existing['location'],
            'required_capital' => isset($data['requiredCapital']) ? (float)$data['requiredCapital'] : (float)$existing['required_capital'],
            'raised_capital' => isset($data['raisedCapital']) ? (float)$data['raisedCapital'] : (float)$existing['raised_capital'],
            'minimum_investment' => isset($data['minimumInvestment']) ? (float)$data['minimumInvestment'] : (float)$existing['minimum_investment'],
            'profit_percentage' => isset($data['profitPercentage']) ? (float)$data['profitPercentage'] : (float)$existing['profit_percentage'],
            'duration_days' => isset($data['durationDays']) ? (int)$data['durationDays'] : (int)$existing['duration_days'],
            'start_date' => $data['startDate'] ?? $existing['start_date'],
            'settlement_date' => $data['settlementDate'] ?? $existing['settlement_date'],
            'status' => $data['status'] ?? $existing['status'],
            'description' => $data['description'] ?? $existing['description'],
            'procurement_plan' => isset($data['procurementPlan']) ? json_encode($data['procurementPlan'], JSON_UNESCAPED_UNICODE) : $existing['procurement_plan'],
            'timeline' => isset($data['timeline']) ? json_encode($data['timeline'], JSON_UNESCAPED_UNICODE) : $existing['timeline'],
            'risks' => isset($data['risks']) ? json_encode($data['risks'], JSON_UNESCAPED_UNICODE) : $existing['risks'],
            'security_and_compliance' => isset($data['securityAndCompliance']) ? json_encode($data['securityAndCompliance'], JSON_UNESCAPED_UNICODE) : $existing['security_and_compliance'],
            'images' => isset($data['images']) ? json_encode($data['images'], JSON_UNESCAPED_UNICODE) : $existing['images'],
            'investor_count' => isset($data['investorCount']) ? (int)$data['investorCount'] : (int)$existing['investor_count']
        ];

        $sets = [];
        $params = [':id' => $id];
        foreach ($fields as $col => $val) {
            $sets[] = "$col = :$col";
            $params[":$col"] = $val;
        }

        $sql = "UPDATE investments SET " . implode(', ', $sets) . " WHERE id = :id";
        $db->prepare($sql)->execute($params);

        Logger::log('তহবিল প্রকল্প আপডেট', 'investment', $fields['title'], "প্রকল্প আপডেট সম্পন্ন", $admin['name']);

        self::get($id);
    }

    public static function delete(string $id): void {
        $admin = Auth::requireAuth();
        $db = Database::getConnection();

        $stmt = $db->prepare("SELECT title FROM investments WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $title = $stmt->fetchColumn();

        if (!$title) {
            Response::notFound('প্রকল্প পাওয়া যায়নি।');
        }

        $db->prepare("DELETE FROM investments WHERE id = :id")->execute([':id' => $id]);
        Logger::log('তহবিল প্রকল্প মুছে ফেলা', 'investment', $title, "প্রকল্প ডিলিট করা হয়েছে", $admin['name']);

        Response::success(null, 'প্রকল্প সফলভাবে মুছে ফেলা হয়েছে।');
    }

    public static function updateStatus(string $id): void {
        $admin = Auth::requireAuth();
        $data = Validator::getJsonBody();
        $status = $data['status'] ?? 'open';

        $db = Database::getConnection();
        $db->prepare("UPDATE investments SET status = :st WHERE id = :id")->execute([':st' => $status, ':id' => $id]);

        Logger::log('তহবিল স্ট্যাটাস পরিবর্তন', 'investment', "ID: $id", "নতুন স্ট্যাটাস: $status", $admin['name']);
        self::get($id);
    }
}
`);

// 3.6 BlogController.php
writeFile('controllers/BlogController.php', `<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../helpers/Auth.php';
require_once __DIR__ . '/../helpers/Validator.php';
require_once __DIR__ . '/../helpers/Logger.php';

class BlogController {
    public static function formatBlogRow(array $row): array {
        return [
            'id' => (int)$row['id'],
            'slug' => $row['slug'],
            'title' => $row['title'],
            'excerpt' => $row['excerpt'],
            'content' => $row['content'],
            'category' => $row['category'],
            'featuredImage' => $row['featured_image'],
            'imageAlt' => $row['image_alt'],
            'author' => $row['author'],
            'publishedAt' => $row['published_at'],
            'updatedAt' => $row['updated_at_date'] ?: $row['updated_at'],
            'readingTime' => $row['reading_time'],
            'seoTitle' => $row['seo_title'],
            'seoDescription' => $row['seo_description'],
            'keywords' => !empty($row['keywords']) ? json_decode($row['keywords'], true) : [],
            'featured' => (bool)$row['featured'],
            'createdAt' => $row['created_at']
        ];
    }

    public static function list(): void {
        $db = Database::getConnection();
        $stmt = $db->query("SELECT * FROM blog_posts ORDER BY created_at DESC");
        $rows = $stmt->fetchAll();
        $posts = array_map([self::class, 'formatBlogRow'], $rows);
        Response::success($posts);
    }

    public static function get(string $slug): void {
        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT * FROM blog_posts WHERE slug = :slug LIMIT 1");
        $stmt->execute([':slug' => $slug]);
        $row = $stmt->fetch();

        if (!$row) {
            Response::notFound('ব্লগ আর্টিকেল পাওয়া যায়নি।');
        }

        Response::success(self::formatBlogRow($row));
    }

    public static function create(): void {
        $admin = Auth::requireAuth();
        $data = Validator::getJsonBody();

        if (empty($data['title']) || empty($data['content'])) {
            Response::error('শিরোনাম ও বিস্তারিত লেখা আবশ্যক।', 422);
        }

        $slug = !empty($data['slug']) ? Validator::slugify($data['slug']) : Validator::slugify($data['title']) . '-' . rand(100, 999);

        $db = Database::getConnection();
        $stmt = $db->prepare("
            INSERT INTO blog_posts (
                slug, title, excerpt, content, category, featured_image, image_alt,
                author, published_at, reading_time, seo_title, seo_description, keywords, featured
            ) VALUES (
                :slug, :title, :excerpt, :content, :category, :featured_image, :image_alt,
                :author, :published_at, :reading_time, :seo_title, :seo_description, :keywords, :featured
            )
        ");

        $stmt->execute([
            ':slug' => $slug,
            ':title' => $data['title'],
            ':excerpt' => $data['excerpt'] ?? mb_substr(strip_tags($data['content']), 0, 150),
            ':content' => $data['content'],
            ':category' => $data['category'] ?? 'সংবাদ ও বাজার বিশ্লেষণ',
            ':featured_image' => $data['featuredImage'] ?? null,
            ':image_alt' => $data['imageAlt'] ?? $data['title'],
            ':author' => $data['author'] ?? $admin['name'],
            ':published_at' => $data['publishedAt'] ?? date('Y-m-d'),
            ':reading_time' => $data['readingTime'] ?? '৫ মিনিট পড়া',
            ':seo_title' => $data['seoTitle'] ?? $data['title'],
            ':seo_description' => $data['seoDescription'] ?? ($data['excerpt'] ?? ''),
            ':keywords' => json_encode($data['keywords'] ?? [], JSON_UNESCAPED_UNICODE),
            ':featured' => !empty($data['featured']) ? 1 : 0
        ]);

        Logger::log('ব্লগ প্রকাশ', 'blog', $data['title'], "নতুন আর্টিকেল প্রকাশিত: $slug", $admin['name']);

        self::get($slug);
    }

    public static function update(string $slug): void {
        $admin = Auth::requireAuth();
        $data = Validator::getJsonBody();

        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT * FROM blog_posts WHERE slug = :slug");
        $stmt->execute([':slug' => $slug]);
        $existing = $stmt->fetch();

        if (!$existing) {
            Response::notFound('ব্লগ পাওয়া যায়নি।');
        }

        $fields = [
            'title' => $data['title'] ?? $existing['title'],
            'excerpt' => $data['excerpt'] ?? $existing['excerpt'],
            'content' => $data['content'] ?? $existing['content'],
            'category' => $data['category'] ?? $existing['category'],
            'featured_image' => $data['featuredImage'] ?? $existing['featured_image'],
            'image_alt' => $data['imageAlt'] ?? $existing['image_alt'],
            'reading_time' => $data['readingTime'] ?? $existing['reading_time'],
            'seo_title' => $data['seoTitle'] ?? $existing['seo_title'],
            'seo_description' => $data['seoDescription'] ?? $existing['seo_description'],
            'keywords' => isset($data['keywords']) ? json_encode($data['keywords'], JSON_UNESCAPED_UNICODE) : $existing['keywords'],
            'featured' => isset($data['featured']) ? ($data['featured'] ? 1 : 0) : $existing['featured'],
            'updated_at_date' => date('Y-m-d')
        ];

        $sets = [];
        $params = [':slug' => $slug];
        foreach ($fields as $col => $val) {
            $sets[] = "$col = :$col";
            $params[":$col"] = $val;
        }

        $sql = "UPDATE blog_posts SET " . implode(', ', $sets) . " WHERE slug = :slug";
        $db->prepare($sql)->execute($params);

        Logger::log('ব্লগ আপডেট', 'blog', $fields['title'], "আর্টিকেল আপডেট সম্পন্ন: $slug", $admin['name']);

        self::get($slug);
    }

    public static function delete(string $slug): void {
        $admin = Auth::requireAuth();
        $db = Database::getConnection();

        $stmt = $db->prepare("SELECT title FROM blog_posts WHERE slug = :slug");
        $stmt->execute([':slug' => $slug]);
        $title = $stmt->fetchColumn();

        if (!$title) {
            Response::notFound('ব্লগ আর্টিকেল পাওয়া যায়নি।');
        }

        $db->prepare("DELETE FROM blog_posts WHERE slug = :slug")->execute([':slug' => $slug]);
        Logger::log('ব্লগ অপসারণ', 'blog', $title, "ব্লগ পোস্ট মুছে ফেলা হয়েছে: $slug", $admin['name']);

        Response::success(null, 'আর্টিকেল মুছে ফেলা হয়েছে।');
    }
}
`);

// 3.7 CustomerController.php
writeFile('controllers/CustomerController.php', `<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../helpers/Auth.php';
require_once __DIR__ . '/../helpers/Validator.php';
require_once __DIR__ . '/../helpers/Logger.php';

class CustomerController {
    public static function formatCustomerRow(array $row): array {
        return [
            'id' => $row['id'],
            'companyName' => $row['company_name'],
            'businessType' => $row['business_type'],
            'contactPerson' => $row['contact_person'],
            'phone' => $row['phone'],
            'email' => $row['email'],
            'deliveryLocation' => $row['delivery_location'],
            'tier' => $row['tier'],
            'totalOrdersCount' => (int)$row['total_orders_count'],
            'totalVolumeKg' => (float)$row['total_volume_kg'],
            'totalOrderValue' => (float)$row['total_order_value'],
            'lastOrderDate' => $row['last_order_date'],
            'preferredFish' => !empty($row['preferred_fish']) ? json_decode($row['preferred_fish'], true) : [],
            'createdAt' => $row['created_at'],
            'updatedAt' => $row['updated_at']
        ];
    }

    public static function list(): void {
        Auth::requireAuth();
        $db = Database::getConnection();
        $stmt = $db->query("SELECT * FROM customers ORDER BY created_at DESC");
        $rows = $stmt->fetchAll();
        $customers = array_map([self::class, 'formatCustomerRow'], $rows);
        Response::success($customers);
    }

    public static function create(): void {
        $admin = Auth::requireAuth();
        $data = Validator::getJsonBody();

        if (empty($data['companyName']) || empty($data['phone'])) {
            Response::error('প্রতিষ্ঠানের নাম এবং ফোন নম্বর আবশ্যক।', 422);
        }

        $id = !empty($data['id']) ? $data['id'] : 'CUST-' . time();
        $db = Database::getConnection();

        $stmt = $db->prepare("
            INSERT INTO customers (
                id, company_name, business_type, contact_person, phone, email, delivery_location,
                tier, total_orders_count, total_volume_kg, total_order_value, last_order_date, preferred_fish
            ) VALUES (
                :id, :company_name, :business_type, :contact_person, :phone, :email, :delivery_location,
                :tier, :total_orders_count, :total_volume_kg, :total_order_value, :last_order_date, :preferred_fish
            )
        ");

        $stmt->execute([
            ':id' => $id,
            ':company_name' => Validator::sanitize($data['companyName']),
            ':business_type' => Validator::sanitize($data['businessType'] ?? 'ইনস্টিটিউশনাল বায়ার'),
            ':contact_person' => Validator::sanitize($data['contactPerson'] ?? ''),
            ':phone' => Validator::normalizeDigits(trim($data['phone'])),
            ':email' => trim($data['email'] ?? ''),
            ':delivery_location' => Validator::sanitize($data['deliveryLocation'] ?? ''),
            ':tier' => $data['tier'] ?? 'New',
            ':total_orders_count' => (int)($data['totalOrdersCount'] ?? 0),
            ':total_volume_kg' => (float)($data['totalVolumeKg'] ?? 0),
            ':total_order_value' => (float)($data['totalOrderValue'] ?? 0),
            ':last_order_date' => $data['lastOrderDate'] ?? date('Y-m-d'),
            ':preferred_fish' => json_encode($data['preferredFish'] ?? [], JSON_UNESCAPED_UNICODE)
        ]);

        Logger::log('গ্রাহক প্রোফাইল তৈরি', 'order', $data['companyName'], "নতুন বায়ার প্রোফাইল (টিয়ার: {$data['tier']})", $admin['name']);

        $stmt = $db->prepare("SELECT * FROM customers WHERE id = :id");
        $stmt->execute([':id' => $id]);
        Response::success(self::formatCustomerRow($stmt->fetch()));
    }

    public static function update(string $id): void {
        $admin = Auth::requireAuth();
        $data = Validator::getJsonBody();

        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT * FROM customers WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $existing = $stmt->fetch();

        if (!$existing) {
            Response::notFound('গ্রাহকের তথ্য পাওয়া যায়নি।');
        }

        $fields = [
            'company_name' => $data['companyName'] ?? $existing['company_name'],
            'business_type' => $data['businessType'] ?? $existing['business_type'],
            'contact_person' => $data['contactPerson'] ?? $existing['contact_person'],
            'phone' => isset($data['phone']) ? Validator::normalizeDigits(trim($data['phone'])) : $existing['phone'],
            'email' => $data['email'] ?? $existing['email'],
            'delivery_location' => $data['deliveryLocation'] ?? $existing['delivery_location'],
            'tier' => $data['tier'] ?? $existing['tier'],
            'total_orders_count' => isset($data['totalOrdersCount']) ? (int)$data['totalOrdersCount'] : (int)$existing['total_orders_count'],
            'total_volume_kg' => isset($data['totalVolumeKg']) ? (float)$data['totalVolumeKg'] : (float)$existing['total_volume_kg'],
            'total_order_value' => isset($data['totalOrderValue']) ? (float)$data['totalOrderValue'] : (float)$existing['total_order_value'],
            'last_order_date' => $data['lastOrderDate'] ?? $existing['last_order_date'],
            'preferred_fish' => isset($data['preferredFish']) ? json_encode($data['preferredFish'], JSON_UNESCAPED_UNICODE) : $existing['preferred_fish']
        ];

        $sets = [];
        $params = [':id' => $id];
        foreach ($fields as $col => $val) {
            $sets[] = "$col = :$col";
            $params[":$col"] = $val;
        }

        $sql = "UPDATE customers SET " . implode(', ', $sets) . " WHERE id = :id";
        $db->prepare($sql)->execute($params);

        Logger::log('গ্রাহক প্রোফাইল আপডেট', 'order', $fields['company_name'], "টিয়ার: {$fields['tier']}", $admin['name']);

        $stmt = $db->prepare("SELECT * FROM customers WHERE id = :id");
        $stmt->execute([':id' => $id]);
        Response::success(self::formatCustomerRow($stmt->fetch()));
    }

    public static function delete(string $id): void {
        $admin = Auth::requireAuth();
        $db = Database::getConnection();

        $stmt = $db->prepare("SELECT company_name FROM customers WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $name = $stmt->fetchColumn();

        if (!$name) {
            Response::notFound('গ্রাহক পাওয়া যায়নি।');
        }

        $db->prepare("DELETE FROM customers WHERE id = :id")->execute([':id' => $id]);
        Logger::log('গ্রাহক অপসারণ', 'order', $name, "গ্রাহক মুছে ফেলা হয়েছে: $id", $admin['name']);

        Response::success(null, 'গ্রাহক প্রোফাইল সফলভাবে মুছে ফেলা হয়েছে।');
    }
}
`);

// 3.8 SupplierController.php
writeFile('controllers/SupplierController.php', `<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../helpers/Auth.php';
require_once __DIR__ . '/../helpers/Validator.php';
require_once __DIR__ . '/../helpers/Logger.php';

class SupplierController {
    public static function formatSupplierRow(array $row): array {
        return [
            'id' => $row['id'],
            'farmerName' => $row['farmer_name'],
            'type' => $row['type'],
            'phone' => $row['phone'],
            'district' => $row['district'],
            'location' => $row['location'],
            'verificationBadge' => $row['verification_badge'],
            'totalLotsCount' => (int)$row['total_lots_count'],
            'totalVolumeKg' => (float)$row['total_volume_kg'],
            'qualityRating' => (float)$row['quality_rating'],
            'primarySpecies' => !empty($row['primary_species']) ? json_decode($row['primary_species'], true) : [],
            'joinedDate' => $row['joined_date'],
            'createdAt' => $row['created_at'],
            'updatedAt' => $row['updated_at']
        ];
    }

    public static function list(): void {
        Auth::requireAuth();
        $db = Database::getConnection();
        $stmt = $db->query("SELECT * FROM suppliers ORDER BY created_at DESC");
        $rows = $stmt->fetchAll();
        $suppliers = array_map([self::class, 'formatSupplierRow'], $rows);
        Response::success($suppliers);
    }

    public static function create(): void {
        $admin = Auth::requireAuth();
        $data = Validator::getJsonBody();

        if (empty($data['farmerName']) || empty($data['phone'])) {
            Response::error('সরবরাহকারীর নাম ও যোগাযোগ নম্বর আবশ্যক।', 422);
        }

        $id = !empty($data['id']) ? $data['id'] : 'SUP-' . time();
        $db = Database::getConnection();

        $stmt = $db->prepare("
            INSERT INTO suppliers (
                id, farmer_name, type, phone, district, location,
                verification_badge, total_lots_count, total_volume_kg, quality_rating, primary_species, joined_date
            ) VALUES (
                :id, :farmer_name, :type, :phone, :district, :location,
                :verification_badge, :total_lots_count, :total_volume_kg, :quality_rating, :primary_species, :joined_date
            )
        ");

        $stmt->execute([
            ':id' => $id,
            ':farmer_name' => Validator::sanitize($data['farmerName']),
            ':type' => Validator::sanitize($data['type'] ?? 'জেলে সমবায়'),
            ':phone' => Validator::normalizeDigits(trim($data['phone'])),
            ':district' => Validator::sanitize($data['district'] ?? ''),
            ':location' => Validator::sanitize($data['location'] ?? ''),
            ':verification_badge' => $data['verificationBadge'] ?? 'new',
            ':total_lots_count' => (int)($data['totalLotsCount'] ?? 0),
            ':total_volume_kg' => (float)($data['totalVolumeKg'] ?? 0),
            ':quality_rating' => (float)($data['qualityRating'] ?? 4.5),
            ':primary_species' => json_encode($data['primarySpecies'] ?? [], JSON_UNESCAPED_UNICODE),
            ':joined_date' => $data['joinedDate'] ?? date('Y-m-d')
        ]);

        Logger::log('সরবরাহকারী প্রোফাইল তৈরি', 'seller_lot', $data['farmerName'], "নতুন সরবরাহকারী: {$data['district']}", $admin['name']);

        $stmt = $db->prepare("SELECT * FROM suppliers WHERE id = :id");
        $stmt->execute([':id' => $id]);
        Response::success(self::formatSupplierRow($stmt->fetch()));
    }

    public static function update(string $id): void {
        $admin = Auth::requireAuth();
        $data = Validator::getJsonBody();

        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT * FROM suppliers WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $existing = $stmt->fetch();

        if (!$existing) {
            Response::notFound('সরবরাহকারীর তথ্য পাওয়া যায়নি।');
        }

        $fields = [
            'farmer_name' => $data['farmerName'] ?? $existing['farmer_name'],
            'type' => $data['type'] ?? $existing['type'],
            'phone' => isset($data['phone']) ? Validator::normalizeDigits(trim($data['phone'])) : $existing['phone'],
            'district' => $data['district'] ?? $existing['district'],
            'location' => $data['location'] ?? $existing['location'],
            'verification_badge' => $data['verificationBadge'] ?? $existing['verification_badge'],
            'total_lots_count' => isset($data['totalLotsCount']) ? (int)$data['totalLotsCount'] : (int)$existing['total_lots_count'],
            'total_volume_kg' => isset($data['totalVolumeKg']) ? (float)$data['totalVolumeKg'] : (float)$existing['total_volume_kg'],
            'quality_rating' => isset($data['qualityRating']) ? (float)$data['qualityRating'] : (float)$existing['quality_rating'],
            'primary_species' => isset($data['primarySpecies']) ? json_encode($data['primarySpecies'], JSON_UNESCAPED_UNICODE) : $existing['primary_species'],
            'joined_date' => $data['joinedDate'] ?? $existing['joined_date']
        ];

        $sets = [];
        $params = [':id' => $id];
        foreach ($fields as $col => $val) {
            $sets[] = "$col = :$col";
            $params[":$col"] = $val;
        }

        $sql = "UPDATE suppliers SET " . implode(', ', $sets) . " WHERE id = :id";
        $db->prepare($sql)->execute($params);

        Logger::log('সরবরাহকারী প্রোফাইল আপডেট', 'seller_lot', $fields['farmer_name'], "স্ট্যাটাস: {$fields['verification_badge']}", $admin['name']);

        $stmt = $db->prepare("SELECT * FROM suppliers WHERE id = :id");
        $stmt->execute([':id' => $id]);
        Response::success(self::formatSupplierRow($stmt->fetch()));
    }

    public static function delete(string $id): void {
        $admin = Auth::requireAuth();
        $db = Database::getConnection();

        $stmt = $db->prepare("SELECT farmer_name FROM suppliers WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $name = $stmt->fetchColumn();

        if (!$name) {
            Response::notFound('সরবরাহকারী পাওয়া যায়নি।');
        }

        $db->prepare("DELETE FROM suppliers WHERE id = :id")->execute([':id' => $id]);
        Logger::log('সরবরাহকারী অপসারণ', 'seller_lot', $name, "সরবরাহকারী মুছে ফেলা হয়েছে: $id", $admin['name']);

        Response::success(null, 'সরবরাহকারী প্রোফাইল মুছে ফেলা হয়েছে।');
    }
}
`);

// 3.9 SettingsController.php
writeFile('controllers/SettingsController.php', `<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../helpers/Auth.php';
require_once __DIR__ . '/../helpers/Validator.php';
require_once __DIR__ . '/../helpers/Logger.php';

class SettingsController {
    private static function getDefaultSettings(): array {
        return [
            'platformName' => 'Gangchill B2B Hub',
            'tagline' => 'জাতীয় সামুদ্রিক ও নদীর মাছের পাইকারি সরবরাহ নেটওয়ার্ক',
            'supportEmail' => 'supply@gangchill.com',
            'emergencyHotline' => '+880 1712-345678',
            'businessHours' => 'শনিবার - বৃহস্পতিবার: সকাল ৮টা - রাত ১০টা',
            'headOfficeAddress' => 'হাউস ১২, রোড ৯, ব্লক-সি, গুলশান-১, ঢাকা ১২১২, বাংলাদেশ',
            'hubLocations' => 'চাঁদপুর বড়স্টেশন, কক্সবাজার ফিশারি ঘাট, খুলনা রূপসা, নাটোর চলনবিল, ভৈরব মেঘনা ঘাট',
            'defaultMoqKg' => 50,
            'coldChainEnabled' => true,
            'allowPublicSellerSubmissions' => true,
            'allowPublicInvestorInterest' => true,
            'maintenanceMode' => false,
            'notifyOnNewOrder' => true,
            'notifyOnNewLot' => true,
            'notifyOnNewInvestmentInterest' => true
        ];
    }

    public static function get(): void {
        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT settings_json FROM platform_settings WHERE id = 1");
        $stmt->execute();
        $json = $stmt->fetchColumn();

        if ($json) {
            $data = json_decode($json, true);
            Response::success(array_merge(self::getDefaultSettings(), $data));
        }

        Response::success(self::getDefaultSettings());
    }

    public static function save(): void {
        $admin = Auth::requireAuth();
        $data = Validator::getJsonBody();

        $current = self::getDefaultSettings();
        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT settings_json FROM platform_settings WHERE id = 1");
        $stmt->execute();
        $json = $stmt->fetchColumn();
        if ($json) {
            $current = array_merge($current, json_decode($json, true));
        }

        $merged = array_merge($current, $data);

        $upd = $db->prepare("
            INSERT INTO platform_settings (id, settings_json, updated_by, updated_at)
            VALUES (1, :json, :ub, NOW())
            ON DUPLICATE KEY UPDATE settings_json = :json_u, updated_by = :ub_u, updated_at = NOW()
        ");
        $upd->execute([
            ':json' => json_encode($merged, JSON_UNESCAPED_UNICODE),
            ':ub' => $admin['name'],
            ':json_u' => json_encode($merged, JSON_UNESCAPED_UNICODE),
            ':ub_u' => $admin['name']
        ]);

        $detail = !empty($merged['maintenanceMode']) ? 'রক্ষণাবেক্ষণ মোড (Maintenance Mode) সক্রিয় করা হয়েছে' : 'কোম্পানির তথ্য, হাব ও পলিসি সংরক্ষিত হয়েছে';
        Logger::log('প্ল্যাটফর্ম সেটিংস আপডেট', 'settings', 'জেনারেল কনফিগারেশন', $detail, $admin['name']);

        Response::success($merged, 'সেটিংস সফলভাবে সংরক্ষিত হয়েছে।');
    }

    public static function reset(): void {
        $admin = Auth::requireAuth();
        $defaults = self::getDefaultSettings();

        $db = Database::getConnection();
        $upd = $db->prepare("
            INSERT INTO platform_settings (id, settings_json, updated_by, updated_at)
            VALUES (1, :json, :ub, NOW())
            ON DUPLICATE KEY UPDATE settings_json = :json_u, updated_by = :ub_u, updated_at = NOW()
        ");
        $upd->execute([
            ':json' => json_encode($defaults, JSON_UNESCAPED_UNICODE),
            ':ub' => $admin['name'],
            ':json_u' => json_encode($defaults, JSON_UNESCAPED_UNICODE),
            ':ub_u' => $admin['name']
        ]);

        Logger::log('প্ল্যাটফর্ম সেটিংস রিসেট', 'settings', 'ডিফল্ট কনফিগারেশন', 'প্রাথমিক ডিফল্ট মানে পুনঃস্থাপন', $admin['name']);

        Response::success($defaults, 'সেটিংস ডিফল্ট মানে রিসেট করা হয়েছে।');
    }
}
`);

// 3.10 DashboardController.php
writeFile('controllers/DashboardController.php', `<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../helpers/Auth.php';

class DashboardController {
    public static function getMetrics(): void {
        Auth::requireAuth();
        $db = Database::getConnection();

        // Stocks counts
        $totalStocks = (int)$db->query("SELECT COUNT(*) FROM stocks")->fetchColumn();
        $liveStocks = (int)$db->query("SELECT COUNT(*) FROM stocks WHERE status = 'live'")->fetchColumn();
        $upcomingStocks = (int)$db->query("SELECT COUNT(*) FROM stocks WHERE status = 'upcoming'")->fetchColumn();
        $soldStocks = (int)$db->query("SELECT COUNT(*) FROM stocks WHERE status = 'sold'")->fetchColumn();

        // Buyer Orders counts
        $pendingRequirementsCount = (int)$db->query("SELECT COUNT(*) FROM buyer_orders WHERE order_status IN ('pending', 'under_review')")->fetchColumn();
        $activeOrdersCount = (int)$db->query("SELECT COUNT(*) FROM buyer_orders WHERE order_status IN ('confirmed', 'processing', 'dispatched')")->fetchColumn();
        $completedOrdersCount = (int)$db->query("SELECT COUNT(*) FROM buyer_orders WHERE order_status = 'completed'")->fetchColumn();

        // Seller Lots
        $pendingSellerLotsCount = (int)$db->query("SELECT COUNT(*) FROM seller_lots WHERE verification_status = 'pending'")->fetchColumn();

        // Investments
        $totalInvestmentPledges = (int)$db->query("SELECT COUNT(*) FROM investor_interests")->fetchColumn();
        $totalPledgedAmount = (float)$db->query("SELECT COALESCE(SUM(interested_amount), 0) FROM investor_interests")->fetchColumn();
        $activeFundProjectsCount = (int)$db->query("SELECT COUNT(*) FROM investments WHERE status = 'open'")->fetchColumn();

        Response::success([
            'totalStocks' => $totalStocks,
            'liveStocks' => $liveStocks,
            'upcomingStocks' => $upcomingStocks,
            'soldStocks' => $soldStocks,
            'pendingRequirementsCount' => $pendingRequirementsCount,
            'activeOrdersCount' => $activeOrdersCount,
            'completedOrdersCount' => $completedOrdersCount,
            'pendingSellerLotsCount' => $pendingSellerLotsCount,
            'totalInvestmentPledges' => $totalInvestmentPledges,
            'totalPledgedAmount' => $totalPledgedAmount,
            'activeFundProjectsCount' => $activeFundProjectsCount
        ]);
    }

    public static function getActivity(): void {
        Auth::requireAuth();
        $db = Database::getConnection();
        $stmt = $db->query("SELECT id, action, target_type, target_title, actor, timestamp, details FROM activity_logs ORDER BY timestamp DESC LIMIT 30");
        $rows = $stmt->fetchAll();

        $formatted = array_map(function($r) {
            return [
                'id' => $r['id'],
                'action' => $r['action'],
                'targetType' => $r['target_type'],
                'targetTitle' => $r['target_title'],
                'actor' => $r['actor'],
                'timestamp' => $r['timestamp'],
                'details' => $r['details']
            ];
        }, $rows);

        Response::success($formatted);
    }
}
`);

// 3.11 MediaController.php
writeFile('controllers/MediaController.php', `<?php
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../helpers/Auth.php';
require_once __DIR__ . '/../helpers/Uploader.php';
require_once __DIR__ . '/../helpers/Logger.php';

class MediaController {
    public static function upload(): void {
        $user = Auth::user();
        $actorName = $user ? $user['name'] : 'Public Uploader';

        $fileKey = isset($_FILES['file']) ? 'file' : (isset($_FILES['image']) ? 'image' : 'file');
        $uploaded = Uploader::handleUpload($fileKey, $user ? $user['id'] : null);

        Logger::log('মিডিয়া আপলোড', 'stock', $uploaded['filename'], "আকার: " . round($uploaded['size'] / 1024, 1) . " KB", $actorName);

        Response::success($uploaded, 'ছবি সফলভাবে আপলোড হয়েছে।');
    }
}
`);

// ============================================================
// 4. Central REST Router (api/index.php)
// ============================================================
writeFile('index.php', `<?php
/**
 * Gangchill REST API Central Router
 */

require_once __DIR__ . '/config/app.php';
require_once __DIR__ . '/helpers/Response.php';

// Handle CORS Preflight & Headers
handleCors();

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// Normalize path: strip leading /api or trailing slash
$path = preg_replace('#^/api#', '', $uri);
$path = rtrim($path, '/');
if (empty($path)) {
    $path = '/';
}

// Route mapping
try {
    // ---------------- AUTH ----------------
    if ($path === '/auth/login' && $method === 'POST') {
        require_once __DIR__ . '/controllers/AuthController.php';
        AuthController::login();
    }
    if ($path === '/auth/me' && $method === 'GET') {
        require_once __DIR__ . '/controllers/AuthController.php';
        AuthController::me();
    }
    if ($path === '/auth/logout' && $method === 'POST') {
        require_once __DIR__ . '/controllers/AuthController.php';
        AuthController::logout();
    }
    if ($path === '/auth/update-profile' && $method === 'POST') {
        require_once __DIR__ . '/controllers/AuthController.php';
        AuthController::updateProfile();
    }

    // ---------------- STOCKS ----------------
    if ($path === '/stocks/categories' && $method === 'GET') {
        require_once __DIR__ . '/controllers/StockController.php';
        StockController::categories();
    }
    if ($path === '/stocks' && $method === 'GET') {
        require_once __DIR__ . '/controllers/StockController.php';
        StockController::list();
    }
    if ($path === '/stocks' && $method === 'POST') {
        require_once __DIR__ . '/controllers/StockController.php';
        StockController::create();
    }
    if (preg_match('#^/stocks/([^/]+)/status$#', $path, $m) && ($method === 'PATCH' || $method === 'POST')) {
        require_once __DIR__ . '/controllers/StockController.php';
        StockController::toggleStatus($m[1]);
    }
    if (preg_match('#^/stocks/([^/]+)$#', $path, $m)) {
        require_once __DIR__ . '/controllers/StockController.php';
        if ($method === 'GET') StockController::get($m[1]);
        if ($method === 'PUT' || $method === 'PATCH') StockController::update($m[1]);
        if ($method === 'DELETE') StockController::delete($m[1]);
    }

    // ---------------- ORDERS ----------------
    if ($path === '/orders' && $method === 'GET') {
        require_once __DIR__ . '/controllers/OrderController.php';
        OrderController::list();
    }
    if (preg_match('#^/orders/([^/]+)/status$#', $path, $m) && ($method === 'PATCH' || $method === 'POST')) {
        require_once __DIR__ . '/controllers/OrderController.php';
        OrderController::updateStatus($m[1]);
    }
    if (preg_match('#^/orders/([^/]+)/notes$#', $path, $m) && $method === 'POST') {
        require_once __DIR__ . '/controllers/OrderController.php';
        OrderController::addNote($m[1]);
    }
    if (preg_match('#^/orders/([^/]+)/quote$#', $path, $m) && ($method === 'PATCH' || $method === 'POST')) {
        require_once __DIR__ . '/controllers/OrderController.php';
        OrderController::updateQuote($m[1]);
    }
    if (preg_match('#^/orders/([^/]+)$#', $path, $m) && $method === 'GET') {
        require_once __DIR__ . '/controllers/OrderController.php';
        OrderController::get($m[1]);
    }

    // ---------------- SUBMISSIONS ----------------
    if ($path === '/submissions/corporate-requirement' && $method === 'POST') {
        require_once __DIR__ . '/controllers/SubmissionController.php';
        SubmissionController::submitCorporateRequirement();
    }
    if ($path === '/submissions/farmer-stock' && $method === 'POST') {
        require_once __DIR__ . '/controllers/SubmissionController.php';
        SubmissionController::submitFarmerStock();
    }
    if ($path === '/submissions/investor-interest' && $method === 'POST') {
        require_once __DIR__ . '/controllers/SubmissionController.php';
        SubmissionController::submitInvestorInterest();
    }
    if ($path === '/submissions/contact' && $method === 'POST') {
        require_once __DIR__ . '/controllers/SubmissionController.php';
        SubmissionController::submitContactMessage();
    }

    // Seller lots admin
    if ($path === '/submissions/seller-lots' && $method === 'GET') {
        require_once __DIR__ . '/controllers/SubmissionController.php';
        SubmissionController::listSellerLots();
    }
    if (preg_match('#^/submissions/seller-lots/([^/]+)/status$#', $path, $m) && ($method === 'PATCH' || $method === 'POST')) {
        require_once __DIR__ . '/controllers/SubmissionController.php';
        SubmissionController::updateSellerLotStatus($m[1]);
    }
    if (preg_match('#^/submissions/seller-lots/([^/]+)/convert$#', $path, $m) && $method === 'POST') {
        require_once __DIR__ . '/controllers/SubmissionController.php';
        SubmissionController::convertLotToStock($m[1]);
    }
    if (preg_match('#^/submissions/seller-lots/([^/]+)$#', $path, $m) && $method === 'GET') {
        require_once __DIR__ . '/controllers/SubmissionController.php';
        SubmissionController::getSellerLot($m[1]);
    }

    // Investor interests admin
    if ($path === '/submissions/investor-interests' && $method === 'GET') {
        require_once __DIR__ . '/controllers/SubmissionController.php';
        SubmissionController::listInvestorInterests();
    }
    if (preg_match('#^/submissions/investor-interests/([^/]+)$#', $path, $m) && $method === 'DELETE') {
        require_once __DIR__ . '/controllers/SubmissionController.php';
        SubmissionController::deleteInvestorInterest($m[1]);
    }

    // ---------------- INVESTMENTS ----------------
    if ($path === '/investments' && $method === 'GET') {
        require_once __DIR__ . '/controllers/InvestmentController.php';
        InvestmentController::list();
    }
    if ($path === '/investments' && $method === 'POST') {
        require_once __DIR__ . '/controllers/InvestmentController.php';
        InvestmentController::create();
    }
    if (preg_match('#^/investments/([^/]+)/status$#', $path, $m) && ($method === 'PATCH' || $method === 'POST')) {
        require_once __DIR__ . '/controllers/InvestmentController.php';
        InvestmentController::updateStatus($m[1]);
    }
    if (preg_match('#^/investments/([^/]+)$#', $path, $m)) {
        require_once __DIR__ . '/controllers/InvestmentController.php';
        if ($method === 'GET') InvestmentController::get($m[1]);
        if ($method === 'PUT' || $method === 'PATCH') InvestmentController::update($m[1]);
        if ($method === 'DELETE') InvestmentController::delete($m[1]);
    }

    // ---------------- BLOG ----------------
    if ($path === '/blog' && $method === 'GET') {
        require_once __DIR__ . '/controllers/BlogController.php';
        BlogController::list();
    }
    if ($path === '/blog' && $method === 'POST') {
        require_once __DIR__ . '/controllers/BlogController.php';
        BlogController::create();
    }
    if (preg_match('#^/blog/([^/]+)$#', $path, $m)) {
        require_once __DIR__ . '/controllers/BlogController.php';
        if ($method === 'GET') BlogController::get($m[1]);
        if ($method === 'PUT' || $method === 'PATCH') BlogController::update($m[1]);
        if ($method === 'DELETE') BlogController::delete($m[1]);
    }

    // ---------------- CUSTOMERS ----------------
    if ($path === '/customers' && $method === 'GET') {
        require_once __DIR__ . '/controllers/CustomerController.php';
        CustomerController::list();
    }
    if ($path === '/customers' && $method === 'POST') {
        require_once __DIR__ . '/controllers/CustomerController.php';
        CustomerController::create();
    }
    if (preg_match('#^/customers/([^/]+)$#', $path, $m)) {
        require_once __DIR__ . '/controllers/CustomerController.php';
        if ($method === 'PUT' || $method === 'PATCH') CustomerController::update($m[1]);
        if ($method === 'DELETE') CustomerController::delete($m[1]);
    }

    // ---------------- SUPPLIERS ----------------
    if ($path === '/suppliers' && $method === 'GET') {
        require_once __DIR__ . '/controllers/SupplierController.php';
        SupplierController::list();
    }
    if ($path === '/suppliers' && $method === 'POST') {
        require_once __DIR__ . '/controllers/SupplierController.php';
        SupplierController::create();
    }
    if (preg_match('#^/suppliers/([^/]+)$#', $path, $m)) {
        require_once __DIR__ . '/controllers/SupplierController.php';
        if ($method === 'PUT' || $method === 'PATCH') SupplierController::update($m[1]);
        if ($method === 'DELETE') SupplierController::delete($m[1]);
    }

    // ---------------- SETTINGS ----------------
    if ($path === '/settings' && $method === 'GET') {
        require_once __DIR__ . '/controllers/SettingsController.php';
        SettingsController::get();
    }
    if ($path === '/settings' && $method === 'POST') {
        require_once __DIR__ . '/controllers/SettingsController.php';
        SettingsController::save();
    }
    if ($path === '/settings/reset' && $method === 'POST') {
        require_once __DIR__ . '/controllers/SettingsController.php';
        SettingsController::reset();
    }

    // ---------------- DASHBOARD ----------------
    if ($path === '/dashboard/metrics' && $method === 'GET') {
        require_once __DIR__ . '/controllers/DashboardController.php';
        DashboardController::getMetrics();
    }
    if ($path === '/dashboard/activity' && $method === 'GET') {
        require_once __DIR__ . '/controllers/DashboardController.php';
        DashboardController::getActivity();
    }

    // ---------------- MEDIA UPLOAD ----------------
    if ($path === '/media/upload' && $method === 'POST') {
        require_once __DIR__ . '/controllers/MediaController.php';
        MediaController::upload();
    }

    // Root Health Check
    if ($path === '/' && $method === 'GET') {
        Response::success([
            'status' => 'online',
            'api' => 'Gangchill B2B Hub REST API',
            'version' => '2.0.0',
            'serverTime' => date('Y-m-d H:i:s')
        ]);
    }

    Response::notFound("Endpoint not found: $method $path");

} catch (Exception $e) {
    Response::serverError($e->getMessage());
}
`);

console.log('ALL BACKEND FILES GENERATED SUCCESSFULLY!');
