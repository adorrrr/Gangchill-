<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../helpers/Auth.php';
require_once __DIR__ . '/../helpers/Uploader.php';
require_once __DIR__ . '/../helpers/Logger.php';

class MediaController {
    public static function getClientIp(): string {
        if (!empty($_SERVER['HTTP_CF_CONNECTING_IP'])) {
            return $_SERVER['HTTP_CF_CONNECTING_IP'];
        }
        if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $list = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
            return trim($list[0]);
        }
        return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    }

    /**
     * Admin Media Upload (Requires Admin Authentication)
     */
    public static function upload(): void {
        $admin = Auth::requireAuth();

        $fileKey = isset($_FILES['file']) ? 'file' : (isset($_FILES['image']) ? 'image' : 'file');
        $uploaded = Uploader::handleUpload($fileKey, $admin['id']);

        Logger::log('মিডিয়া আপলোড', 'stock', $uploaded['filename'], "আকার: " . round($uploaded['size'] / 1024, 1) . " KB", $admin['name']);

        Response::success($uploaded, 'ছবি সফলভাবে আপলোড হয়েছে।');
    }

    /**
     * Public Seller Lot Media Upload (Rate-limited to 5 uploads / 10 minutes per IP)
     */
    public static function uploadSubmission(): void {
        $ip = self::getClientIp();
        $db = Database::getConnection();

        // 1. Ensure upload_rate_limits table exists
        $db->exec("
            CREATE TABLE IF NOT EXISTS `upload_rate_limits` (
                `id` INT AUTO_INCREMENT PRIMARY KEY,
                `ip_address` VARCHAR(64) NOT NULL,
                `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                INDEX `idx_url_ip_created` (`ip_address`, `created_at`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");

        // 2. Check rate limit: max 5 uploads per 10 minutes
        $stmt = $db->prepare("
            SELECT COUNT(*) FROM `upload_rate_limits`
            WHERE `ip_address` = :ip AND `created_at` >= DATE_SUB(NOW(), INTERVAL 10 MINUTE)
        ");
        $stmt->execute([':ip' => $ip]);
        $uploadCount = (int)$stmt->fetchColumn();

        if ($uploadCount >= 5) {
            Response::error('আপনি সর্বোচ্চ আপলোড সীমাতে পৌঁছেছেন। অনুগ্রহ করে ১০ মিনিট পর পুনরায় চেষ্টা করুন।', 429);
        }

        $fileKey = isset($_FILES['file']) ? 'file' : (isset($_FILES['image']) ? 'image' : 'file');
        $uploaded = Uploader::handleUpload($fileKey, null);

        // 3. Record successful upload in rate limits
        $insertStmt = $db->prepare("INSERT INTO `upload_rate_limits` (`ip_address`) VALUES (:ip)");
        $insertStmt->execute([':ip' => $ip]);

        Response::success($uploaded, 'লট ছবি সফলভাবে আপলোড হয়েছে।');
    }
}
