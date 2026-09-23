<?php
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
