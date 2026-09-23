<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../helpers/Auth.php';
require_once __DIR__ . '/../helpers/Validator.php';
require_once __DIR__ . '/../helpers/Logger.php';
require_once __DIR__ . '/SettingsController.php';

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

        if (isset($_GET['featured']) && $_GET['featured'] !== '') {
            $where[] = "featured = :featured";
            $params[':featured'] = (int)$_GET['featured'];
        }

        $sql = "SELECT * FROM stocks WHERE " . implode(' AND ', $where) . " ORDER BY featured DESC, created_at DESC";
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

        $db = Database::getConnection();

        $id = !empty($data['id']) ? $data['id'] : 'fish-' . time() . '-' . rand(10, 99);
        $baseSlug = !empty($data['slug']) ? Validator::slugify($data['slug']) : Validator::slugify($data['productName'] ?? $data['banglaName']);
        $slug = $baseSlug;

        // Ensure slug uniqueness
        $chkSlug = $db->prepare("SELECT COUNT(*) FROM stocks WHERE slug = :slug");
        $chkSlug->execute([':slug' => $slug]);
        if ((int)$chkSlug->fetchColumn() > 0) {
            $slug = $baseSlug . '-' . rand(100, 9999);
        }

        $isLive = ($data['status'] ?? 'live') === 'live';
        $isFeatured = isset($data['featured']) ? ($data['featured'] ? 1 : 0) : ($isLive ? 1 : 0);

        $harvestDate = !empty($data['harvestDate']) ? $data['harvestDate'] : (!empty($data['availabilityDate']) ? $data['availabilityDate'] : 'আজকের তাজা সংগ্রহ');
        $availabilityDate = !empty($data['availabilityDate']) ? $data['availabilityDate'] : $harvestDate;

        // Force Asia/Dhaka current timestamp
        $nowDhaka = date('Y-m-d H:i:s');

        $stmt = $db->prepare("
            INSERT INTO stocks (
                id, slug, product_name, bangla_name, category, status, quantity, unit,
                location, district, division, grade, harvest_date, availability_date, packaging,
                minimum_order, price, price_type, description, images, specifications, origin_details, logistics, featured,
                created_at, updated_at
            ) VALUES (
                :id, :slug, :product_name, :bangla_name, :category, :status, :quantity, :unit,
                :location, :district, :division, :grade, :harvest_date, :availability_date, :packaging,
                :minimum_order, :price, :price_type, :description, :images, :specifications, :origin_details, :logistics, :featured,
                :created_at, :updated_at
            )
        ");

        $images = !empty($data['images']) ? (is_array($data['images']) ? $data['images'] : [$data['images']]) : ['/hero-fishermen-boat.png'];

        // Fetch default MOQ from platform settings
        $settings = SettingsController::getSettings();
        $defaultMoq = (float)($settings['defaultMoqKg'] ?? 50);
        $minimumOrder = isset($data['minimumOrder']) && is_numeric($data['minimumOrder']) && (float)$data['minimumOrder'] > 0
            ? (float)$data['minimumOrder']
            : $defaultMoq;

        $stmt->execute([
            ':id' => $id,
            ':slug' => $slug,
            ':product_name' => $data['productName'] ?? $data['banglaName'],
            ':bangla_name' => $data['banglaName'],
            ':category' => $data['category'],
            ':status' => $data['status'] ?? 'live',
            ':quantity' => max(0, (float)($data['quantity'] ?? 0)),
            ':unit' => $data['unit'] ?? 'কেজি (KG)',
            ':location' => $data['location'] ?? '',
            ':district' => $data['district'] ?? '',
            ':division' => $data['division'] ?? 'ঢাকা',
            ':grade' => $data['grade'] ?? 'গ্রেড A',
            ':harvest_date' => $harvestDate,
            ':availability_date' => $availabilityDate,
            ':packaging' => $data['packaging'] ?? 'ইনসুলেটেড বক্স',
            ':minimum_order' => max(1, $minimumOrder),
            ':price' => max(0, (float)($data['price'] ?? 0)),
            ':price_type' => $data['priceType'] ?? 'fixed',
            ':description' => $data['description'] ?? '',
            ':images' => json_encode($images, JSON_UNESCAPED_UNICODE),
            ':specifications' => json_encode($data['specifications'] ?? [], JSON_UNESCAPED_UNICODE),
            ':origin_details' => json_encode($data['originDetails'] ?? null, JSON_UNESCAPED_UNICODE),
            ':logistics' => json_encode($data['logistics'] ?? null, JSON_UNESCAPED_UNICODE),
            ':featured' => $isFeatured,
            ':created_at' => $nowDhaka,
            ':updated_at' => $nowDhaka
        ]);

        Logger::log('স্টক তৈরি', 'stock', $data['banglaName'], "নতুন মাছের স্টক তৈরি করা হয়েছে (ID: $id)", $admin['name']);

        self::get($id);
    }

    public static function update(string $id): void {
        $admin = Auth::requireAuth();
        $data = Validator::getJsonBody();

        $db = Database::getConnection();
        $chk = $db->prepare("SELECT * FROM stocks WHERE id = :id OR slug = :slug LIMIT 1");
        $chk->execute([':id' => $id, ':slug' => $id]);
        $existing = $chk->fetch();

        if (!$existing) {
            Response::notFound('মাছের স্টক তথ্য পাওয়া যায়নি।');
        }

        $resolvedId = $existing['id'];

        $fields = [
            'product_name' => $data['productName'] ?? $existing['product_name'],
            'bangla_name' => $data['banglaName'] ?? $existing['bangla_name'],
            'category' => $data['category'] ?? $existing['category'],
            'status' => $data['status'] ?? $existing['status'],
            'quantity' => isset($data['quantity']) ? max(0, (float)$data['quantity']) : (float)$existing['quantity'],
            'unit' => $data['unit'] ?? $existing['unit'],
            'location' => $data['location'] ?? $existing['location'],
            'district' => $data['district'] ?? $existing['district'],
            'division' => $data['division'] ?? $existing['division'],
            'grade' => $data['grade'] ?? $existing['grade'],
            'harvest_date' => $data['harvestDate'] ?? $existing['harvest_date'],
            'availability_date' => $data['availabilityDate'] ?? $existing['availability_date'],
            'packaging' => $data['packaging'] ?? $existing['packaging'],
            'minimum_order' => isset($data['minimumOrder']) ? max(1, (float)$data['minimumOrder']) : (float)$existing['minimum_order'],
            'price' => isset($data['price']) ? max(0, (float)$data['price']) : (float)$existing['price'],
            'price_type' => $data['priceType'] ?? $existing['price_type'],
            'description' => $data['description'] ?? $existing['description'],
            'images' => isset($data['images']) ? json_encode($data['images'], JSON_UNESCAPED_UNICODE) : $existing['images'],
            'specifications' => isset($data['specifications']) ? json_encode($data['specifications'], JSON_UNESCAPED_UNICODE) : $existing['specifications'],
            'origin_details' => isset($data['originDetails']) ? json_encode($data['originDetails'], JSON_UNESCAPED_UNICODE) : $existing['origin_details'],
            'logistics' => isset($data['logistics']) ? json_encode($data['logistics'], JSON_UNESCAPED_UNICODE) : $existing['logistics'],
            'featured' => isset($data['featured']) ? ($data['featured'] ? 1 : 0) : $existing['featured'],
            'updated_at' => date('Y-m-d H:i:s')
        ];

        $setPart = [];
        $params = [':id' => $resolvedId];
        foreach ($fields as $col => $val) {
            $setPart[] = "$col = :$col";
            $params[":$col"] = $val;
        }

        $sql = "UPDATE stocks SET " . implode(', ', $setPart) . " WHERE id = :id";
        $db->prepare($sql)->execute($params);

        Logger::log('স্টক আপডেট', 'stock', $fields['bangla_name'], "স্টকের তথ্য আপডেট করা হয়েছে (ID: $resolvedId)", $admin['name']);

        self::get($resolvedId);
    }

    public static function delete(string $id): void {
        $admin = Auth::requireAuth();
        $db = Database::getConnection();

        $chk = $db->prepare("SELECT id, bangla_name FROM stocks WHERE id = :id OR slug = :slug LIMIT 1");
        $chk->execute([':id' => $id, ':slug' => $id]);
        $existing = $chk->fetch();

        if (!$existing) {
            Response::notFound('মাছের স্টক তথ্য পাওয়া যায়নি।');
        }

        $resolvedId = $existing['id'];
        $title = !empty($existing['bangla_name']) ? $existing['bangla_name'] : $id;

        // Synchronize with original seller lots:
        // When a converted/live stock is deleted, the original seller lot is NOT removed from MySQL.
        // It records stock_deleted_at and stock_deleted_name so it moves to "ডিলিট করা লট".
        $db->prepare("
            UPDATE seller_lots 
            SET stock_deleted_at = NOW(), 
                stock_deleted_name = :sname 
            WHERE converted_stock_id = :sid
        ")->execute([
            ':sname' => $title,
            ':sid' => $resolvedId
        ]);

        $db->prepare("DELETE FROM stocks WHERE id = :id")->execute([':id' => $resolvedId]);
        Logger::log('স্টক অপসারণ', 'stock', $title, "স্টক মুছে ফেলা হয়েছে (ID: $resolvedId)", $admin['name']);

        Response::success(null, 'স্টক সফলভাবে মুছে ফেলা হয়েছে।');
    }

    public static function toggleStatus(string $id): void {
        $admin = Auth::requireAuth();
        $data = Validator::getJsonBody();
        $newStatus = $data['status'] ?? 'live';

        $db = Database::getConnection();
        $chk = $db->prepare("SELECT id FROM stocks WHERE id = :id OR slug = :slug LIMIT 1");
        $chk->execute([':id' => $id, ':slug' => $id]);
        $existing = $chk->fetch();

        if (!$existing) {
            Response::notFound('মাছের স্টক তথ্য পাওয়া যায়নি।');
        }

        $resolvedId = $existing['id'];

        $stmt = $db->prepare("UPDATE stocks SET status = :status, updated_at = :updated_at WHERE id = :id");
        $stmt->execute([':status' => $newStatus, ':updated_at' => date('Y-m-d H:i:s'), ':id' => $resolvedId]);

        Logger::log('স্টক স্ট্যাটাস পরিবর্তন', 'stock', "ID: $resolvedId", "নতুন স্ট্যাটাস: $newStatus", $admin['name']);
        self::get($resolvedId);
    }
}
