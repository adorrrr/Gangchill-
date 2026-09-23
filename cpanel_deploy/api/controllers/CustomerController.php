<?php
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
