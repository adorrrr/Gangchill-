<?php
// Local Dev Server Router for PHP Built-in Server
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Serve uploads directly
if (preg_match('#^/api/uploads/(.+)$#', $uri, $matches)) {
    $file = __DIR__ . '/uploads/' . $matches[1];
    if (file_exists($file) && !is_dir($file)) {
        $mime = mime_content_type($file);
        header("Content-Type: $mime");
        readfile($file);
        exit;
    }
}

// Block or test execution of init.php
if (preg_match('#^/api/database/init\.php$#', $uri)) {
    require __DIR__ . '/database/init.php';
    exit;
}

require __DIR__ . '/index.php';
