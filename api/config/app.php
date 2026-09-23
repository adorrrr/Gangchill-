<?php
// Production error reporting: log internally, do not display to client
ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL & ~E_DEPRECATED & ~E_STRICT);

date_default_timezone_set('Asia/Dhaka');

function handleCors() {
    $allowedOrigins = [
        'https://gangchill.com',
        'https://www.gangchill.com',
        'http://gangchil.foliobd.com',
        'https://gangchil.foliobd.com',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5174',
        'http://localhost:8000',
        'http://127.0.0.1:8000',
        'http://localhost:3000',
        'http://127.0.0.1:3000'
    ];

    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

    // If APP_URL environment variable is provided, include it in allowed origins
    $customAppUrl = getenv('APP_URL');
    if ($customAppUrl && !in_array($customAppUrl, $allowedOrigins, true)) {
        $allowedOrigins[] = rtrim($customAppUrl, '/');
    }

    // Dynamic origin matching: allow if origin host matches current HTTP_HOST
    $isAllowed = in_array($origin, $allowedOrigins, true);
    if (!$isAllowed && !empty($origin)) {
        $parsedOrigin = parse_url($origin, PHP_URL_HOST);
        $serverHost = parse_url('http://' . ($_SERVER['HTTP_HOST'] ?? ''), PHP_URL_HOST);
        if ($parsedOrigin && $serverHost && strcasecmp($parsedOrigin, $serverHost) === 0) {
            $isAllowed = true;
        }
    }

    if ($isAllowed && !empty($origin)) {
        header("Access-Control-Allow-Origin: $origin");
        header("Access-Control-Allow-Credentials: true");
        header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    } elseif (empty($origin)) {
        // Direct / non-CORS requests
        header("Access-Control-Allow-Origin: *");
        header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    }

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}

define('UPLOAD_DIR', __DIR__ . '/../uploads/');
define('UPLOAD_MAX_BYTES', 5 * 1024 * 1024);
define('ALLOWED_MIMES', ['image/jpeg', 'image/png', 'image/webp']);
