<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../helpers/Auth.php';
require_once __DIR__ . '/../helpers/Validator.php';
require_once __DIR__ . '/../helpers/Logger.php';

class BlogController {
    public static function formatBlogRow(array $row): array {
        $content = $row['content'];
        if (is_string($content)) {
            $decoded = json_decode($content, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                $content = $decoded;
            }
        }

        return [
            'id' => (int)$row['id'],
            'slug' => $row['slug'],
            'title' => $row['title'],
            'excerpt' => $row['excerpt'],
            'content' => $content,
            'category' => $row['category'],
            'featuredImage' => $row['featured_image'],
            'imageAlt' => $row['image_alt'],
            'author' => $row['author'],
            'publishedAt' => $row['published_at'],
            'updatedAt' => $row['updated_at_date'] ?: $row['updated_at'],
            'readingTime' => $row['reading_time'],
            'seoTitle' => $row['seo_title'],
            'seoDescription' => $row['seo_description'],
            'keywords' => !empty($row['keywords']) ? json_decode($row['keywords'], true) : [],
            'featured' => (bool)$row['featured'],
            'createdAt' => $row['created_at']
        ];
    }

    public static function list(): void {
        $db = Database::getConnection();
        $stmt = $db->query("SELECT * FROM blog_posts ORDER BY created_at DESC");
        $rows = $stmt->fetchAll();
        $posts = array_map([self::class, 'formatBlogRow'], $rows);
        Response::success($posts);
    }

    public static function get(string $slugOrId): void {
        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT * FROM blog_posts WHERE slug = :slug OR id = :id LIMIT 1");
        $stmt->execute([':slug' => $slugOrId, ':id' => $slugOrId]);
        $row = $stmt->fetch();

        if (!$row) {
            Response::notFound('ব্লগ আর্টিকেল পাওয়া যায়নি।');
        }

        Response::success(self::formatBlogRow($row));
    }

    public static function create(): void {
        date_default_timezone_set('Asia/Dhaka');
        $admin = Auth::requireAuth();
        $data = Validator::getJsonBody();

        if (empty($data['title']) || empty($data['content'])) {
            Response::error('শিরোনাম ও বিস্তারিত লেখা আবশ্যক।', 422);
        }

        $slug = !empty($data['slug']) ? Validator::slugify($data['slug']) : Validator::slugify($data['title']) . '-' . rand(100, 999);

        // Deduplicate slug if exists
        $db = Database::getConnection();
        $chk = $db->prepare("SELECT COUNT(*) FROM blog_posts WHERE slug = :slug");
        $chk->execute([':slug' => $slug]);
        if ((int)$chk->fetchColumn() > 0) {
            $slug .= '-' . rand(100, 999);
        }

        $contentStr = is_array($data['content']) ? json_encode($data['content'], JSON_UNESCAPED_UNICODE) : (string)$data['content'];

        $excerpt = $data['excerpt'] ?? null;
        if (empty($excerpt)) {
            if (is_array($data['content'])) {
                $firstText = '';
                foreach ($data['content'] as $blk) {
                    if (!empty($blk['text'])) {
                        $firstText = $blk['text'];
                        break;
                    }
                }
                $excerpt = mb_substr($firstText, 0, 150);
            } else {
                $excerpt = mb_substr(strip_tags((string)$data['content']), 0, 150);
            }
        }

        $nowDhaka = date('Y-m-d H:i:s');
        $stmt = $db->prepare("
            INSERT INTO blog_posts (
                slug, title, excerpt, content, category, featured_image, image_alt,
                author, published_at, reading_time, seo_title, seo_description, keywords, featured,
                created_at, updated_at
            ) VALUES (
                :slug, :title, :excerpt, :content, :category, :featured_image, :image_alt,
                :author, :published_at, :reading_time, :seo_title, :seo_description, :keywords, :featured,
                :created_at, :updated_at
            )
        ");

        $stmt->execute([
            ':slug' => $slug,
            ':title' => $data['title'],
            ':excerpt' => $excerpt ?: $data['title'],
            ':content' => $contentStr,
            ':category' => $data['category'] ?? 'সংবাদ ও বাজার বিশ্লেষণ',
            ':featured_image' => $data['featuredImage'] ?? null,
            ':image_alt' => $data['imageAlt'] ?? $data['title'],
            ':author' => $data['author'] ?? $admin['name'],
            ':published_at' => $data['publishedAt'] ?? date('Y-m-d'),
            ':reading_time' => $data['readingTime'] ?? '৫ মিনিট পড়া',
            ':seo_title' => $data['seoTitle'] ?? $data['title'],
            ':seo_description' => $data['seoDescription'] ?? ($excerpt ?: $data['title']),
            ':keywords' => json_encode($data['keywords'] ?? [], JSON_UNESCAPED_UNICODE),
            ':featured' => !empty($data['featured']) ? 1 : 0,
            ':created_at' => $nowDhaka,
            ':updated_at' => $nowDhaka
        ]);

        Logger::log('ব্লগ প্রকাশ', 'blog', $data['title'], "নতুন আর্টিকেল প্রকাশিত: $slug", $admin['name']);

        self::get($slug);
    }

    public static function update(string $slugOrId): void {
        date_default_timezone_set('Asia/Dhaka');
        $admin = Auth::requireAuth();
        $data = Validator::getJsonBody();

        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT * FROM blog_posts WHERE slug = :slug OR id = :id LIMIT 1");
        $stmt->execute([':slug' => $slugOrId, ':id' => $slugOrId]);
        $existing = $stmt->fetch();

        if (!$existing) {
            Response::notFound('ব্লগ পাওয়া যায়নি।');
        }

        $resolvedId = (int)$existing['id'];

        $contentVal = $existing['content'];
        if (isset($data['content'])) {
            $contentVal = is_array($data['content']) ? json_encode($data['content'], JSON_UNESCAPED_UNICODE) : (string)$data['content'];
        }

        $fields = [
            'title' => $data['title'] ?? $existing['title'],
            'excerpt' => $data['excerpt'] ?? $existing['excerpt'],
            'content' => $contentVal,
            'category' => $data['category'] ?? $existing['category'],
            'featured_image' => $data['featuredImage'] ?? $existing['featured_image'],
            'image_alt' => $data['imageAlt'] ?? $existing['image_alt'],
            'reading_time' => $data['readingTime'] ?? $existing['reading_time'],
            'seo_title' => $data['seoTitle'] ?? $existing['seo_title'],
            'seo_description' => $data['seoDescription'] ?? $existing['seo_description'],
            'keywords' => isset($data['keywords']) ? json_encode($data['keywords'], JSON_UNESCAPED_UNICODE) : $existing['keywords'],
            'featured' => isset($data['featured']) ? ($data['featured'] ? 1 : 0) : $existing['featured'],
            'updated_at_date' => date('Y-m-d'),
            'updated_at' => date('Y-m-d H:i:s')
        ];

        $sets = [];
        $params = [':id' => $resolvedId];
        foreach ($fields as $col => $val) {
            $sets[] = "$col = :$col";
            $params[":$col"] = $val;
        }

        $sql = "UPDATE blog_posts SET " . implode(', ', $sets) . " WHERE id = :id";
        $db->prepare($sql)->execute($params);

        Logger::log('ব্লগ আপডেট', 'blog', $fields['title'], "আর্টিকেল আপডেট সম্পন্ন (ID: $resolvedId)", $admin['name']);

        self::get((string)$resolvedId);
    }

    public static function delete(string $slugOrId): void {
        $admin = Auth::requireAuth();
        $db = Database::getConnection();

        $stmt = $db->prepare("SELECT id, title FROM blog_posts WHERE slug = :slug OR id = :id LIMIT 1");
        $stmt->execute([':slug' => $slugOrId, ':id' => $slugOrId]);
        $existing = $stmt->fetch();

        if (!$existing) {
            Response::notFound('ব্লগ আর্টিকেল পাওয়া যায়নি।');
        }

        $resolvedId = (int)$existing['id'];
        $title = $existing['title'];

        $db->prepare("DELETE FROM blog_posts WHERE id = :id")->execute([':id' => $resolvedId]);
        Logger::log('ব্লগ অপসারণ', 'blog', $title, "ব্লগ পোস্ট মুছে ফেলা হয়েছে (ID: $resolvedId)", $admin['name']);

        Response::success(null, 'আর্টিকেল মুছে ফেলা হয়েছে।');
    }
}
