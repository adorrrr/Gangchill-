<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../helpers/Auth.php';
require_once __DIR__ . '/../helpers/Validator.php';
require_once __DIR__ . '/../helpers/Logger.php';

class OrderController {
    public static function formatOrderRow(array $row): array {
        return [
            'id' => $row['id'],
            'stockId' => $row['stock_id'] ?? null,
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
            'timestamp' => date('Y-m-dTH:i:sZ'),
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
            'createdAt' => date('Y-m-dTH:i:sZ')
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

        $totalVal = round($quotedPrice * (float)$order['quantity'], 2);
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
