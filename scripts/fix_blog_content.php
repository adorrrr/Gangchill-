<?php
require_once __DIR__ . '/../api/config/database.php';

$seedPath = __DIR__ . '/../api/database/seed_data.json';
if (!file_exists($seedPath)) {
    echo "seed_data.json not found\n";
    exit(1);
}

$data = json_decode(file_get_contents($seedPath), true);
$posts = $data['blogPosts'] ?? [];

$db = Database::getConnection();

foreach ($posts as $post) {
    $slug = $post['slug'];
    $jsonContent = json_encode($post['content'], JSON_UNESCAPED_UNICODE);
    
    $stmt = $db->prepare("UPDATE blog_posts SET content = :content WHERE slug = :slug");
    $stmt->execute([
        ':content' => $jsonContent,
        ':slug' => $slug
    ]);
    echo "Updated post {$slug}, content length: " . strlen($jsonContent) . "\n";
}

$stmt = $db->query("SELECT id, slug, LEFT(content, 60) as preview FROM blog_posts");
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "\nCurrent blog posts in DB:\n";
print_r($rows);
