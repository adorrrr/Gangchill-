<?php
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
