<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../helpers/Auth.php';
require_once __DIR__ . '/../helpers/Validator.php';
require_once __DIR__ . '/../helpers/Logger.php';

class InvestmentController {
    public static function formatInvestmentRow(array $row): array {
        $images = !empty($row['images']) ? json_decode($row['images'], true) : [];
        if (!is_array($images) || empty($images)) {
            $images = ['/hero-fishermen-boat.png'];
        }
        $primaryImage = !empty($images[0]) ? $images[0] : '/hero-fishermen-boat.png';

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
            'image' => $primaryImage,
            'images' => $images,
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
        date_default_timezone_set('Asia/Dhaka');
        $admin = Auth::requireAuth();
        $data = Validator::getJsonBody();

        if (empty($data['title']) || empty($data['requiredCapital'])) {
            Response::error('প্রকল্পের শিরোনাম এবং লক্ষ্যমাত্রা আবশ্যক।', 422);
        }

        $id = !empty($data['id']) ? $data['id'] : 'inv-' . time();
        $slug = !empty($data['slug']) ? Validator::slugify($data['slug']) : Validator::slugify($data['title']) . '-' . rand(100, 999);

        // Deduplicate slug
        $db = Database::getConnection();
        $chk = $db->prepare("SELECT COUNT(*) FROM investments WHERE slug = :slug");
        $chk->execute([':slug' => $slug]);
        if ((int)$chk->fetchColumn() > 0) {
            $slug .= '-' . rand(100, 999);
        }

        $nowDhaka = date('Y-m-d H:i:s');
        $stmt = $db->prepare("
            INSERT INTO investments (
                id, slug, stock_id, title, product_name, category, location,
                required_capital, raised_capital, minimum_investment, profit_percentage,
                duration_days, start_date, settlement_date, status, description,
                procurement_plan, timeline, risks, security_and_compliance, images, investor_count,
                created_at, updated_at
            ) VALUES (
                :id, :slug, :stock_id, :title, :product_name, :category, :location,
                :required_capital, :raised_capital, :minimum_investment, :profit_percentage,
                :duration_days, :start_date, :settlement_date, :status, :description,
                :procurement_plan, :timeline, :risks, :security_and_compliance, :images, :investor_count,
                :created_at, :updated_at
            )
        ");

        $images = [];
        if (!empty($data['images']) && is_array($data['images'])) {
            $images = array_values(array_filter($data['images']));
        } elseif (!empty($data['image']) && is_string($data['image'])) {
            $images = [trim($data['image'])];
        }
        if (empty($images)) {
            $images = ['/hero-fishermen-boat.png'];
        }

        $stmt->execute([
            ':id' => $id,
            ':slug' => $slug,
            ':stock_id' => $data['stockId'] ?? null,
            ':title' => $data['title'],
            ':product_name' => $data['productName'] ?? $data['title'],
            ':category' => $data['category'] ?? 'প্রকিউরমেন্ট',
            ':location' => $data['location'] ?? 'ঢাকা',
            ':required_capital' => max(1, (float)$data['requiredCapital']),
            ':raised_capital' => max(0, (float)($data['raisedCapital'] ?? 0)),
            ':minimum_investment' => max(1, (float)($data['minimumInvestment'] ?? 50000)),
            ':profit_percentage' => max(0, (float)($data['profitPercentage'] ?? 15)),
            ':duration_days' => max(1, (int)($data['durationDays'] ?? 30)),
            ':start_date' => $data['startDate'] ?? date('Y-m-d'),
            ':settlement_date' => $data['settlementDate'] ?? null,
            ':status' => $data['status'] ?? 'open',
            ':description' => $data['description'] ?? '',
            ':procurement_plan' => json_encode($data['procurementPlan'] ?? [], JSON_UNESCAPED_UNICODE),
            ':timeline' => json_encode($data['timeline'] ?? [], JSON_UNESCAPED_UNICODE),
            ':risks' => json_encode($data['risks'] ?? [], JSON_UNESCAPED_UNICODE),
            ':security_and_compliance' => json_encode($data['securityAndCompliance'] ?? [], JSON_UNESCAPED_UNICODE),
            ':images' => json_encode($images, JSON_UNESCAPED_UNICODE),
            ':investor_count' => (int)($data['investorCount'] ?? 0),
            ':created_at' => $nowDhaka,
            ':updated_at' => $nowDhaka
        ]);

        Logger::log('তহবিল প্রকল্প তৈরি', 'investment', $data['title'], "ক্যাপিটাল: ৳{$data['requiredCapital']}", $admin['name']);

        self::get($id);
    }

    public static function update(string $idOrSlug): void {
        date_default_timezone_set('Asia/Dhaka');
        $admin = Auth::requireAuth();
        $data = Validator::getJsonBody();

        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT * FROM investments WHERE id = :id OR slug = :slug LIMIT 1");
        $stmt->execute([':id' => $idOrSlug, ':slug' => $idOrSlug]);
        $existing = $stmt->fetch();

        if (!$existing) {
            Response::notFound('প্রকল্প পাওয়া যায়নি।');
        }

        $resolvedId = $existing['id'];

        $imagesToSave = null;
        if (isset($data['images'])) {
            if (is_array($data['images'])) {
                $filtered = array_values(array_filter($data['images']));
                $imagesToSave = !empty($filtered) ? $filtered : ['/hero-fishermen-boat.png'];
            } elseif (is_string($data['images']) && trim($data['images']) !== '') {
                $imagesToSave = [trim($data['images'])];
            }
        } elseif (isset($data['image'])) {
            $trimmed = trim($data['image']);
            $imagesToSave = $trimmed !== '' ? [$trimmed] : ['/hero-fishermen-boat.png'];
        }

        $fields = [
            'title' => $data['title'] ?? $existing['title'],
            'product_name' => $data['productName'] ?? $existing['product_name'],
            'category' => $data['category'] ?? $existing['category'],
            'location' => $data['location'] ?? $existing['location'],
            'required_capital' => isset($data['requiredCapital']) ? max(1, (float)$data['requiredCapital']) : (float)$existing['required_capital'],
            'raised_capital' => isset($data['raisedCapital']) ? max(0, (float)$data['raisedCapital']) : (float)$existing['raised_capital'],
            'minimum_investment' => isset($data['minimumInvestment']) ? max(1, (float)$data['minimumInvestment']) : (float)$existing['minimum_investment'],
            'profit_percentage' => isset($data['profitPercentage']) ? max(0, (float)$data['profitPercentage']) : (float)$existing['profit_percentage'],
            'duration_days' => isset($data['durationDays']) ? max(1, (int)$data['durationDays']) : (int)$existing['duration_days'],
            'start_date' => $data['startDate'] ?? $existing['start_date'],
            'settlement_date' => $data['settlementDate'] ?? $existing['settlement_date'],
            'status' => $data['status'] ?? $existing['status'],
            'description' => $data['description'] ?? $existing['description'],
            'procurement_plan' => isset($data['procurementPlan']) ? json_encode($data['procurementPlan'], JSON_UNESCAPED_UNICODE) : $existing['procurement_plan'],
            'timeline' => isset($data['timeline']) ? json_encode($data['timeline'], JSON_UNESCAPED_UNICODE) : $existing['timeline'],
            'risks' => isset($data['risks']) ? json_encode($data['risks'], JSON_UNESCAPED_UNICODE) : $existing['risks'],
            'security_and_compliance' => isset($data['securityAndCompliance']) ? json_encode($data['securityAndCompliance'], JSON_UNESCAPED_UNICODE) : $existing['security_and_compliance'],
            'images' => $imagesToSave !== null ? json_encode($imagesToSave, JSON_UNESCAPED_UNICODE) : $existing['images'],
            'investor_count' => isset($data['investorCount']) ? (int)$data['investorCount'] : (int)$existing['investor_count'],
            'updated_at' => date('Y-m-d H:i:s')
        ];

        $sets = [];
        $params = [':id' => $resolvedId];
        foreach ($fields as $col => $val) {
            $sets[] = "$col = :$col";
            $params[":$col"] = $val;
        }

        $sql = "UPDATE investments SET " . implode(', ', $sets) . " WHERE id = :id";
        $db->prepare($sql)->execute($params);

        Logger::log('তহবিল প্রকল্প আপডেট', 'investment', $fields['title'], "প্রকল্প আপডেট সম্পন্ন (ID: $resolvedId)", $admin['name']);

        self::get($resolvedId);
    }

    public static function delete(string $idOrSlug): void {
        $admin = Auth::requireAuth();
        $db = Database::getConnection();

        $stmt = $db->prepare("SELECT id, title FROM investments WHERE id = :id OR slug = :slug LIMIT 1");
        $stmt->execute([':id' => $idOrSlug, ':slug' => $idOrSlug]);
        $existing = $stmt->fetch();

        if (!$existing) {
            Response::notFound('প্রকল্প পাওয়া যায়নি।');
        }

        $resolvedId = $existing['id'];
        $title = $existing['title'];

        $db->prepare("DELETE FROM investments WHERE id = :id")->execute([':id' => $resolvedId]);
        Logger::log('তহবিল প্রকল্প মুছে ফেলা', 'investment', $title, "প্রকল্প ডিলিট করা হয়েছে (ID: $resolvedId)", $admin['name']);

        Response::success(null, 'প্রকল্প সফলভাবে মুছে ফেলা হয়েছে।');
    }

    public static function updateStatus(string $idOrSlug): void {
        $admin = Auth::requireAuth();
        $data = Validator::getJsonBody();
        $status = $data['status'] ?? 'open';

        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT id FROM investments WHERE id = :id OR slug = :slug LIMIT 1");
        $stmt->execute([':id' => $idOrSlug, ':slug' => $idOrSlug]);
        $existing = $stmt->fetch();

        if (!$existing) {
            Response::notFound('প্রকল্প পাওয়া যায়নি।');
        }

        $resolvedId = $existing['id'];

        $db->prepare("UPDATE investments SET status = :st, updated_at = :updated_at WHERE id = :id")->execute([
            ':st' => $status,
            ':updated_at' => date('Y-m-d H:i:s'),
            ':id' => $resolvedId
        ]);

        Logger::log('তহবিল স্ট্যাটাস পরিবর্তন', 'investment', "ID: $resolvedId", "নতুন স্ট্যাটাস: $status", $admin['name']);
        self::get($resolvedId);
    }
}
