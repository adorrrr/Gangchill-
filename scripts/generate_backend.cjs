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

// ==========================================
// 1. Database & App Config
// ==========================================
writeFile('config/database.php', `<?php
/**
 * Gangchill Database Configuration & PDO Singleton
 */

class Database {
    private static ?PDO $instance = null;

    public static function getConnection(): PDO {
        if (self::$instance === null) {
            $host = getenv('DB_HOST') ?: '127.0.0.1';
            $port = getenv('DB_PORT') ?: '3306';
            $db   = getenv('DB_NAME') ?: 'gangchill_db';
            $user = getenv('DB_USER') ?: 'root';
            $pass = getenv('DB_PASS') !== false ? getenv('DB_PASS') : '';

            $dsn = "mysql:host={$host};port={$port};dbname={$db};charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
            ];

            try {
                self::$instance = new PDO($dsn, $user, $pass, $options);
            } catch (PDOException $e) {
                http_response_code(500);
                header('Content-Type: application/json; charset=UTF-8');
                echo json_encode([
                    'success' => false,
                    'error' => 'Database connection error: ' . $e->getMessage()
                ], JSON_UNESCAPED_UNICODE);
                exit;
            }
        }
        return self::$instance;
    }
}
`);

writeFile('config/app.php', `<?php
/**
 * Global App & CORS Configuration
 */

date_default_timezone_set('Asia/Dhaka');

function handleCors() {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
    header("Access-Control-Allow-Origin: $origin");
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}

define('UPLOAD_DIR', __DIR__ . '/../uploads/');
define('UPLOAD_MAX_BYTES', 5 * 1024 * 1024);
define('ALLOWED_MIMES', ['image/jpeg', 'image/png', 'image/webp']);
`);

// ==========================================
// 2. Helpers
// ==========================================
writeFile('helpers/Response.php', `<?php
/**
 * Standardized JSON API Response Helper
 */

class Response {
    public static function json($data, int $status = 200): void {
        http_response_code($status);
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    public static function success($data = null, string $message = 'Success', int $status = 200): void {
        $res = ['success' => true, 'message' => $message];
        if ($data !== null) {
            $res['data'] = $data;
        }
        self::json($res, $status);
    }

    public static function error(string $message = 'An error occurred', int $status = 400, $details = null): void {
        $res = ['success' => false, 'error' => $message];
        if ($details !== null) {
            $res['details'] = $details;
        }
        self::json($res, $status);
    }

    public static function unauthorized(string $message = 'অননুমোদিত অ্যাক্সেস (প্রবেশাধিকার নেই)'): void {
        self::json(['success' => false, 'error' => $message], 401);
    }

    public static function forbidden(string $message = 'অ্যাক্সেস নিষিদ্ধ'): void {
        self::json(['success' => false, 'error' => $message], 403);
    }

    public static function notFound(string $message = 'তথ্য পাওয়া যায়নি'): void {
        self::json(['success' => false, 'error' => $message], 404);
    }

    public static function serverError(string $message = 'সার্ভার ত্রুটি ঘটেছে'): void {
        self::json(['success' => false, 'error' => $message], 500);
    }
}
`);

writeFile('helpers/Auth.php', `<?php
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
        $token = bin2hex(random_bytes(32));
        $expiresAt = date('Y-m-d H:i:s', strtotime('+7 days'));

        $stmt = $db->prepare("INSERT INTO admin_sessions (token, admin_id, expires_at) VALUES (:token, :admin_id, :expires_at)");
        $stmt->execute([
            ':token' => $token,
            ':admin_id' => $adminId,
            ':expires_at' => $expiresAt
        ]);

        return [
            'token' => $token,
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

        if (!empty($header) && preg_match('/Bearer\\s(\\S+)/', $header, $matches)) {
            return $matches[1];
        }
        return null;
    }

    public static function user(): ?array {
        $token = self::getBearerToken();
        if (!$token) {
            return null;
        }

        $db = Database::getConnection();
        $stmt = $db->prepare("
            SELECT a.id, a.name, a.email, a.role, a.designation, a.avatar, a.phone, a.last_login
            FROM admin_sessions s
            JOIN admins a ON s.admin_id = a.id
            WHERE s.token = :token AND s.expires_at > NOW()
            LIMIT 1
        ");
        $stmt->execute([':token' => $token]);
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
        $stmt = $db->prepare("DELETE FROM admin_sessions WHERE token = :token");
        $stmt->execute([':token' => $token]);
    }
}
`);

writeFile('helpers/Validator.php', `<?php
/**
 * Input Validation & Normalization Helper
 */

class Validator {
    public static function getJsonBody(): array {
        $input = file_get_contents('php://input');
        if (empty($input)) {
            return [];
        }
        $decoded = json_decode($input, true);
        return is_array($decoded) ? $decoded : [];
    }

    public static function normalizeDigits(string $input): string {
        $bn = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
        $en = ['0','1','2','3','4','5','6','7','8','9'];
        return str_replace($bn, $en, $input);
    }

    public static function isValidPhone(string $phone): bool {
        $normalized = self::normalizeDigits(preg_replace('/[^0-9০-৯+]/u', '', $phone));
        return (bool) preg_match('/^(?:\\+?880|0)?1[3-9]\\d{8}$/', $normalized);
    }

    public static function isValidEmail(string $email): bool {
        return (bool) filter_var($email, FILTER_VALIDATE_EMAIL);
    }

    public static function slugify(string $text): string {
        $text = preg_replace('~[^\\pL\\d]+~u', '-', $text);
        $text = trim($text, '-');
        $text = preg_replace('~-+~', '-', $text);
        $text = strtolower($text);
        return empty($text) ? 'item-' . time() : $text;
    }

    public static function sanitize(string $data): string {
        return htmlspecialchars(strip_tags(trim($data)), ENT_QUOTES, 'UTF-8');
    }
}
`);

writeFile('helpers/Uploader.php', `<?php
/**
 * Media Uploader & File Validator
 */

require_once __DIR__ . '/../config/app.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/Response.php';

class Uploader {
    public static function handleUpload(string $fileKey = 'file', ?string $uploadedBy = null): array {
        if (!isset($_FILES[$fileKey])) {
            Response::error('কোনো ফাইল নির্বাচন করা হয়নি।');
        }

        $file = $_FILES[$fileKey];

        if ($file['error'] !== UPLOAD_ERR_OK) {
            $msg = 'ফাইল আপলোড ব্যর্থ হয়েছে (কোড: ' . $file['error'] . ')';
            Response::error($msg);
        }

        if ($file['size'] > UPLOAD_MAX_BYTES) {
            Response::error('ফাইলের আকার সর্বোচ্চ ৫ মেগাবাইটের মধ্যে হতে হবে।');
        }

        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($file['tmp_name']);

        if (!in_array($mime, ALLOWED_MIMES)) {
            Response::error('শুধুমাত্র JPG, PNG বা WEBP ফরম্যাটের ছবি আপলোড করা যাবে।');
        }

        $extensions = [
            'image/jpeg' => 'jpg',
            'image/png'  => 'png',
            'image/webp' => 'webp'
        ];
        $ext = $extensions[$mime] ?? 'jpg';

        $uniqueName = 'media_' . time() . '_' . bin2hex(random_bytes(6)) . '.' . $ext;
        $targetDir = rtrim(UPLOAD_DIR, '/\\\\') . DIRECTORY_SEPARATOR;
        if (!is_dir($targetDir)) {
            mkdir($targetDir, 0755, true);
        }

        $targetPath = $targetDir . $uniqueName;

        if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
            Response::serverError('ফাইল সংরক্ষণ করতে সমস্যা হয়েছে।');
        }

        $publicUrl = '/api/uploads/' . $uniqueName;

        try {
            $db = Database::getConnection();
            $id = 'MED-' . time() . '-' . rand(100, 999);
            $stmt = $db->prepare("
                INSERT INTO media_uploads (id, filename, original_name, file_path, file_url, mime_type, file_size, uploaded_by)
                VALUES (:id, :filename, :original_name, :file_path, :file_url, :mime_type, :file_size, :uploaded_by)
            ");
            $stmt->execute([
                ':id' => $id,
                ':filename' => $uniqueName,
                ':original_name' => $file['name'],
                ':file_path' => $targetPath,
                ':file_url' => $publicUrl,
                ':mime_type' => $mime,
                ':file_size' => $file['size'],
                ':uploaded_by' => $uploadedBy
            ]);
        } catch (Exception $e) {
            // Non-fatal
        }

        return [
            'url' => $publicUrl,
            'filename' => $uniqueName,
            'originalName' => $file['name'],
            'size' => $file['size'],
            'mime' => $mime
        ];
    }
}
`);

// ==========================================
// 3. Database Initializer & Seeder
// ==========================================
writeFile('database/init.php', `<?php
/**
 * Gangchill Database Migration & Seeder Script
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/Auth.php';

try {
    $db = Database::getConnection();
    echo "Connected to database successfully.\\n";

    // 1. Run schema.sql
    $schemaFile = __DIR__ . '/schema.sql';
    if (file_exists($schemaFile)) {
        $sql = file_get_contents($schemaFile);
        $db->exec($sql);
        echo "Database schema synchronized successfully.\\n";
    }

    // 2. Seed Admin User
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

    // 3. Seed Platform Settings
    $settingsKey = 'platform_config';
    $stmt = $db->prepare("SELECT COUNT(*) FROM platform_settings WHERE setting_key = :k");
    $stmt->execute([':k' => $settingsKey]);
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
        $insertSettings = $db->prepare("INSERT INTO platform_settings (setting_key, setting_value) VALUES (:k, :v)");
        $insertSettings->execute([
            ':k' => $settingsKey,
            ':v' => json_encode($defaultSettings, JSON_UNESCAPED_UNICODE)
        ]);
        echo "Platform default settings seeded.\\n";
    }

    // 4. Seed Seed Data from JSON
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
                        price, price_type, description, images, specifications, pricing_tiers
                    ) VALUES (
                        :id, :slug, :product_name, :bangla_name, :category, :status, :quantity, :unit,
                        :location, :district, :division, :grade, :harvest_date, :packaging, :minimum_order,
                        :price, :price_type, :description, :images, :specifications, :pricing_tiers
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
                        ':pricing_tiers' => json_encode($s['pricingTiers'] ?? [], JSON_UNESCAPED_UNICODE)
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
                        id, title, bangla_title, hub, category, required_capital, raised_capital,
                        min_investment, expected_roi, duration_months, status, risk_level, security_type,
                        description, highlights, images, documents, investor_count
                    ) VALUES (
                        :id, :title, :bangla_title, :hub, :category, :required_capital, :raised_capital,
                        :min_investment, :expected_roi, :duration_months, :status, :risk_level, :security_type,
                        :description, :highlights, :images, :documents, :investor_count
                    )
                ");

                foreach ($data['investments'] as $inv) {
                    $insertInv->execute([
                        ':id' => $inv['id'],
                        ':title' => $inv['title'],
                        ':bangla_title' => $inv['banglaTitle'],
                        ':hub' => $inv['hub'],
                        ':category' => $inv['category'],
                        ':required_capital' => $inv['requiredCapital'],
                        ':raised_capital' => $inv['raisedCapital'],
                        ':min_investment' => $inv['minInvestment'],
                        ':expected_roi' => $inv['expectedRoi'],
                        ':duration_months' => $inv['durationMonths'],
                        ':status' => $inv['status'],
                        ':risk_level' => $inv['riskLevel'],
                        ':security_type' => $inv['securityType'],
                        ':description' => $inv['description'],
                        ':highlights' => json_encode($inv['highlights'] ?? [], JSON_UNESCAPED_UNICODE),
                        ':images' => json_encode($inv['images'] ?? [], JSON_UNESCAPED_UNICODE),
                        ':documents' => json_encode($inv['documents'] ?? [], JSON_UNESCAPED_UNICODE),
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
                        slug, title, excerpt, content, category, author_name, author_role,
                        publish_date, read_time, cover_image, tags, published
                    ) VALUES (
                        :slug, :title, :excerpt, :content, :category, :author_name, :author_role,
                        :publish_date, :read_time, :cover_image, :tags, :published
                    )
                ");

                foreach ($data['blogPosts'] as $bp) {
                    $insertBlog->execute([
                        ':slug' => $bp['slug'],
                        ':title' => $bp['title'],
                        ':excerpt' => $bp['excerpt'],
                        ':content' => $bp['content'],
                        ':category' => $bp['category'],
                        ':author_name' => $bp['author']['name'] ?? 'Gangchill Team',
                        ':author_role' => $bp['author']['role'] ?? 'Specialist',
                        ':publish_date' => $bp['publishDate'],
                        ':read_time' => $bp['readTime'],
                        ':cover_image' => $bp['coverImage'],
                        ':tags' => json_encode($bp['tags'] ?? [], JSON_UNESCAPED_UNICODE),
                        ':published' => 1
                    ]);
                }
                echo "Seeded " . count($data['blogPosts']) . " blog posts.\\n";
            }
        }
    }

    // 5. Seed Initial Buyer Orders
    $stmt = $db->prepare("SELECT COUNT(*) FROM buyer_orders");
    $stmt->execute();
    if ((int)$stmt->fetchColumn() === 0) {
        $insertOrder = $db->prepare("
            INSERT INTO buyer_orders (
                id, company_name, contact_person, phone, email, product_name, quantity, unit,
                required_date, delivery_location, specification, notes, status, order_status,
                quoted_price_per_unit, total_estimated_value, assigned_staff, status_history, internal_notes_list
            ) VALUES (
                :id, :company_name, :contact_person, :phone, :email, :product_name, :quantity, :unit,
                :required_date, :delivery_location, :specification, :notes, :status, :order_status,
                :quoted_price_per_unit, :total_estimated_value, :assigned_staff, :status_history, :internal_notes_list
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
                'internal_notes_list' => []
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
                'internal_notes_list' => []
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
                ':internal_notes_list' => json_encode($ord['internal_notes_list'], JSON_UNESCAPED_UNICODE)
            ]);
        }
        echo "Seeded demo buyer orders.\\n";
    }

    // 6. Seed Initial Customers
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

        $demoCustomers = [
            [
                'id' => 'CUST-001',
                'company_name' => 'ইউনিমার্ট সুপারশপ (গুলশান ২ ব্রাঞ্চ)',
                'business_type' => 'সুপারশপ চেইন',
                'contact_person' => 'তানভীর আহমেদ',
                'phone' => '01711-223344',
                'email' => 'procurement@unimart.com.bd',
                'delivery_location' => 'গুলশান ২, ঢাকা',
                'tier' => 'VIP',
                'total_orders_count' => 8,
                'total_volume_kg' => 2850,
                'total_order_value' => 4617000,
                'last_order_date' => '2026-09-14',
                'preferred_fish' => ['পদ্মার রূপালী ইলিশ', 'চলনবিলের পাবদা', 'গলদা চিংড়ি']
            ],
            [
                'id' => 'CUST-002',
                'company_name' => 'রেডিসন ব্লু ঢাকা ওয়াটার গার্ডেন',
                'business_type' => '৫-স্টার হোটেল ও হসপিটালিটি',
                'contact_person' => 'শেফ মাহবুবুল আলম',
                'phone' => '01819-887766',
                'email' => 'executive.chef@radissondhaka.com',
                'delivery_location' => 'বিমানবন্দর রোড, ঢাকা',
                'tier' => 'VIP',
                'total_orders_count' => 6,
                'total_volume_kg' => 1200,
                'total_order_value' => 1850000,
                'last_order_date' => '2026-09-13',
                'preferred_fish' => ['বাগদা চিংড়ি (16/20)', 'কোরাল মাছ', 'কক্সবাজার লবস্টার']
            ]
        ];

        foreach ($demoCustomers as $c) {
            $insertCust->execute([
                ':id' => $c['id'],
                ':company_name' => $c['company_name'],
                ':business_type' => $c['business_type'],
                ':contact_person' => $c['contact_person'],
                ':phone' => $c['phone'],
                ':email' => $c['email'],
                ':delivery_location' => $c['delivery_location'],
                ':tier' => $c['tier'],
                ':total_orders_count' => $c['total_orders_count'],
                ':total_volume_kg' => $c['total_volume_kg'],
                ':total_order_value' => $c['total_order_value'],
                ':last_order_date' => $c['last_order_date'],
                ':preferred_fish' => json_encode($c['preferred_fish'], JSON_UNESCAPED_UNICODE)
            ]);
        }
        echo "Seeded demo customers.\\n";
    }

    // 7. Seed Initial Suppliers
    $stmt = $db->prepare("SELECT COUNT(*) FROM suppliers");
    $stmt->execute();
    if ((int)$stmt->fetchColumn() === 0) {
        $insertSup = $db->prepare("
            INSERT INTO suppliers (
                id, farmer_name, type, phone, email, district, location,
                verification_badge, total_lots_count, total_volume_kg, quality_rating, primary_species, joined_date
            ) VALUES (
                :id, :farmer_name, :type, :phone, :email, :district, :location,
                :verification_badge, :total_lots_count, :total_volume_kg, :quality_rating, :primary_species, :joined_date
            )
        ");

        $demoSuppliers = [
            [
                'id' => 'SUP-001',
                'farmer_name' => 'মো: মোশাররফ হোসেন (জেলে সমবায়)',
                'type' => 'জেলে সমবায়',
                'phone' => '01715-998877',
                'email' => 'mosharraf.fishery@gmail.com',
                'district' => 'চাঁদপুর',
                'location' => 'বড়স্টেশন মোহনা ঘাট',
                'verification_badge' => 'verified',
                'total_lots_count' => 14,
                'total_volume_kg' => 8500,
                'quality_rating' => 4.9,
                'primary_species' => ['পদ্মার রূপালী ইলিশ', 'মেঘনার পাঙ্গাশ', 'তপসে'],
                'joined_date' => '2025-11-10'
            ],
            [
                'id' => 'SUP-002',
                'farmer_name' => 'হাজী সামসুল হক (ট্রলার মালিক)',
                'type' => 'ট্রলার কনসোর্টিয়াম',
                'phone' => '01814-332211',
                'email' => 'samsul.trawler@yahoo.com',
                'district' => 'কক্সবাজার',
                'location' => 'ফিশারি ঘাট টার্মিনাল',
                'verification_badge' => 'verified',
                'total_lots_count' => 9,
                'total_volume_kg' => 12400,
                'quality_rating' => 4.8,
                'primary_species' => ['কক্সবাজার রূপচাঁদা', 'লবস্টার', 'কোরাল মাছ'],
                'joined_date' => '2025-12-05'
            ]
        ];

        foreach ($demoSuppliers as $sup) {
            $insertSup->execute([
                ':id' => $sup['id'],
                ':farmer_name' => $sup['farmer_name'],
                ':type' => $sup['type'],
                ':phone' => $sup['phone'],
                ':email' => $sup['email'],
                ':district' => $sup['district'],
                ':location' => $sup['location'],
                ':verification_badge' => $sup['verification_badge'],
                ':total_lots_count' => $sup['total_lots_count'],
                ':total_volume_kg' => $sup['total_volume_kg'],
                ':quality_rating' => $sup['quality_rating'],
                ':primary_species' => json_encode($sup['primary_species'], JSON_UNESCAPED_UNICODE),
                ':joined_date' => $sup['joined_date']
            ]);
        }
        echo "Seeded demo suppliers.\\n";
    }

    echo "Database initialization and seeding completed successfully!\\n";

} catch (Exception $e) {
    echo "Initialization error: " . $e->getMessage() . "\\n";
    exit(1);
}
`);

console.log('Database init script created');
