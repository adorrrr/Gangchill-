<?php
/**
 * Gangchill Authentication & Session Helper
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/Response.php';

class Auth {
    public static function hashPassword(string $password): string {
        return password_hash($password, PASSWORD_BCRYPT, ['cost' => 11]);
    }

    public static function verifyPassword(string $password, string $hash): bool {
        return password_verify($password, $hash);
    }

    public static function createSession(string $adminId): array {
        $db = Database::getConnection();
        $rawToken = bin2hex(random_bytes(32));
        $tokenHash = hash('sha256', $rawToken);
        $expiresAt = date('Y-m-d H:i:s', strtotime('+7 days'));

        $stmt = $db->prepare("INSERT INTO admin_sessions (token, admin_id, expires_at) VALUES (:token, :admin_id, :expires_at)");
        $stmt->execute([
            ':token' => $tokenHash,
            ':admin_id' => $adminId,
            ':expires_at' => $expiresAt
        ]);

        return [
            'token' => $rawToken,
            'expiresAt' => $expiresAt
        ];
    }

    public static function getBearerToken(): ?string {
        $header = '';
        if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $header = trim($_SERVER['HTTP_AUTHORIZATION']);
        } elseif (isset($_SERVER['Authorization'])) {
            $header = trim($_SERVER['Authorization']);
        } elseif (function_exists('apache_request_headers')) {
            $headers = apache_request_headers();
            if (isset($headers['Authorization'])) {
                $header = trim($headers['Authorization']);
            }
        }

        if (!empty($header) && preg_match('/Bearer\s(\S+)/', $header, $matches)) {
            return $matches[1];
        }
        return null;
    }

    public static function user(): ?array {
        $rawToken = self::getBearerToken();
        if (!$rawToken) {
            return null;
        }

        $tokenHash = hash('sha256', $rawToken);
        $db = Database::getConnection();
        $stmt = $db->prepare("
            SELECT a.id, a.name, a.email, a.role, a.designation, a.avatar, a.phone, a.last_login
            FROM admin_sessions s
            JOIN admins a ON s.admin_id = a.id
            WHERE (s.token = :hash OR s.token = :raw) AND s.expires_at > NOW()
            LIMIT 1
        ");
        $stmt->execute([
            ':hash' => $tokenHash,
            ':raw'  => $rawToken
        ]);
        $user = $stmt->fetch();

        if ($user) {
            return [
                'id' => $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'role' => $user['role'],
                'designation' => $user['designation'],
                'avatar' => $user['avatar'],
                'phone' => $user['phone'],
                'lastLogin' => $user['last_login']
            ];
        }

        return null;
    }

    public static function requireAuth(): array {
        $user = self::user();
        if (!$user) {
            Response::unauthorized('অননুমোদিত অ্যাক্সেস। অনুগ্রহ করে পুনরায় লগইন করুন।');
        }
        return $user;
    }

    public static function destroySession(string $token): void {
        $db = Database::getConnection();
        $tokenHash = hash('sha256', $token);
        $stmt = $db->prepare("DELETE FROM admin_sessions WHERE token = :hash OR token = :raw");
        $stmt->execute([
            ':hash' => $tokenHash,
            ':raw'  => $token
        ]);
    }
}
