<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../helpers/Auth.php';
require_once __DIR__ . '/../helpers/Validator.php';
require_once __DIR__ . '/../helpers/Logger.php';

class AuthController {
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

    public static function login(): void {
        $data = Validator::getJsonBody();
        $email = trim($data['email'] ?? '');
        $password = trim($data['password'] ?? '');

        if (empty($email) || empty($password)) {
            Response::error('ইমেইল এবং পাসওয়ার্ড প্রদান করুন।', 422);
        }

        $db = Database::getConnection();

        // 1. Ensure login_attempts table exists
        $db->exec("
            CREATE TABLE IF NOT EXISTS `login_attempts` (
                `id` INT AUTO_INCREMENT PRIMARY KEY,
                `ip_address` VARCHAR(64) NOT NULL,
                `email` VARCHAR(150) NOT NULL,
                `attempted_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                INDEX `idx_attempts_ip` (`ip_address`, `attempted_at`),
                INDEX `idx_attempts_email` (`email`, `attempted_at`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");

        $ip = self::getClientIp();

        // 2. Check failed attempts in the last 10 minutes
        $checkStmt = $db->prepare("
            SELECT COUNT(*) as fail_count, MAX(attempted_at) as last_fail
            FROM login_attempts
            WHERE (ip_address = :ip OR email = :email)
              AND attempted_at >= DATE_SUB(NOW(), INTERVAL 10 MINUTE)
        ");
        $checkStmt->execute([':ip' => $ip, ':email' => $email]);
        $attemptInfo = $checkStmt->fetch();
        $failCount = (int)($attemptInfo['fail_count'] ?? 0);

        if ($failCount >= 5) {
            $lastFailTime = !empty($attemptInfo['last_fail']) ? strtotime($attemptInfo['last_fail']) : time();
            $lockExpires = $lastFailTime + (10 * 60);
            $secondsRemaining = max(0, $lockExpires - time());
            $minutesRemaining = max(1, ceil($secondsRemaining / 60));

            Response::error("অতিরিক্ত ভুল প্রচেষ্টার কারণে আপনার লগইন সাময়িকভাবে ১০ মিনিটের জন্য স্থগিত করা হয়েছে। অনুগ্রহ করে {$minutesRemaining} মিনিট পর আবার চেষ্টা করুন।", 429, [
                'blocked' => true,
                'remainingMinutes' => $minutesRemaining,
                'remainingSeconds' => $secondsRemaining
            ]);
        }

        // 3. Verify Admin Credentials
        $stmt = $db->prepare("SELECT * FROM admins WHERE email = :email LIMIT 1");
        $stmt->execute([':email' => $email]);
        $admin = $stmt->fetch();

        if (!$admin || !Auth::verifyPassword($password, $admin['password_hash'])) {
            // Record failed attempt
            $rec = $db->prepare("INSERT INTO login_attempts (ip_address, email, attempted_at) VALUES (:ip, :email, NOW())");
            $rec->execute([':ip' => $ip, ':email' => $email]);

            $newFailCount = $failCount + 1;
            $remainingAttempts = max(0, 5 - $newFailCount);

            if ($remainingAttempts > 0) {
                $msg = "ইমেইল বা পাসওয়ার্ড সঠিক নয়। আপনার আর {$remainingAttempts} বার চেষ্টা করার সুযোগ রয়েছে।";
            } else {
                $msg = "অতিরিক্ত ভুল প্রচেষ্টার কারণে লগইন সাময়িকভাবে ১০ মিনিটের জন্য স্থগিত করা হয়েছে।";
            }

            Response::error($msg, 401, [
                'remainingAttempts' => $remainingAttempts,
                'blocked' => ($remainingAttempts === 0)
            ]);
        }

        // 4. Successful Login -> Clear failed attempts
        $db->prepare("DELETE FROM login_attempts WHERE ip_address = :ip OR email = :email")->execute([
            ':ip' => $ip,
            ':email' => $email
        ]);

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
