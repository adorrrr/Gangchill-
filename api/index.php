<?php
/**
 * Gangchill REST API Central Router
 */

require_once __DIR__ . '/config/app.php';
require_once __DIR__ . '/helpers/Response.php';

// Handle CORS Preflight & Headers
handleCors();

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// Normalize path: strip leading /api or trailing slash
$path = preg_replace('#^/api#', '', $uri);
$path = rtrim($path, '/');
if (empty($path)) {
    $path = '/';
}

// Route mapping
try {
    // ---------------- AUTH ----------------
    if ($path === '/auth/login' && $method === 'POST') {
        require_once __DIR__ . '/controllers/AuthController.php';
        AuthController::login();
    }
    if ($path === '/auth/me' && $method === 'GET') {
        require_once __DIR__ . '/controllers/AuthController.php';
        AuthController::me();
    }
    if ($path === '/auth/logout' && $method === 'POST') {
        require_once __DIR__ . '/controllers/AuthController.php';
        AuthController::logout();
    }
    if ($path === '/auth/update-profile' && $method === 'POST') {
        require_once __DIR__ . '/controllers/AuthController.php';
        AuthController::updateProfile();
    }

    // ---------------- STOCKS ----------------
    if ($path === '/stocks/categories' && $method === 'GET') {
        require_once __DIR__ . '/controllers/StockController.php';
        StockController::categories();
    }
    if ($path === '/stocks' && $method === 'GET') {
        require_once __DIR__ . '/controllers/StockController.php';
        StockController::list();
    }
    if ($path === '/stocks' && $method === 'POST') {
        require_once __DIR__ . '/controllers/StockController.php';
        StockController::create();
    }
    if (preg_match('#^/stocks/([^/]+)/status$#', $path, $m) && ($method === 'PATCH' || $method === 'POST')) {
        require_once __DIR__ . '/controllers/StockController.php';
        StockController::toggleStatus($m[1]);
    }
    if (preg_match('#^/stocks/([^/]+)$#', $path, $m)) {
        require_once __DIR__ . '/controllers/StockController.php';
        if ($method === 'GET') StockController::get($m[1]);
        if ($method === 'PUT' || $method === 'PATCH') StockController::update($m[1]);
        if ($method === 'DELETE') StockController::delete($m[1]);
    }

    // ---------------- ORDERS ----------------
    if ($path === '/orders' && $method === 'GET') {
        require_once __DIR__ . '/controllers/OrderController.php';
        OrderController::list();
    }
    if (preg_match('#^/orders/([^/]+)/status$#', $path, $m) && ($method === 'PATCH' || $method === 'POST')) {
        require_once __DIR__ . '/controllers/OrderController.php';
        OrderController::updateStatus($m[1]);
    }
    if (preg_match('#^/orders/([^/]+)/notes$#', $path, $m) && $method === 'POST') {
        require_once __DIR__ . '/controllers/OrderController.php';
        OrderController::addNote($m[1]);
    }
    if (preg_match('#^/orders/([^/]+)/quote$#', $path, $m) && ($method === 'PATCH' || $method === 'POST')) {
        require_once __DIR__ . '/controllers/OrderController.php';
        OrderController::updateQuote($m[1]);
    }
    if (preg_match('#^/orders/([^/]+)$#', $path, $m) && $method === 'GET') {
        require_once __DIR__ . '/controllers/OrderController.php';
        OrderController::get($m[1]);
    }

    // ---------------- SUBMISSIONS ----------------
    if ($path === '/submissions/upload' && $method === 'POST') {
        require_once __DIR__ . '/controllers/MediaController.php';
        MediaController::uploadSubmission();
    }
    if (($path === '/submissions/corporate-requirement' || $path === '/submissions/corporate' || $path === '/submissions/demand' || $path === '/demand') && $method === 'POST') {
        require_once __DIR__ . '/controllers/SubmissionController.php';
        SubmissionController::submitCorporateRequirement();
    }
    if ($path === '/submissions/farmer-stock' && $method === 'POST') {
        require_once __DIR__ . '/controllers/SubmissionController.php';
        SubmissionController::submitFarmerStock();
    }
    if ($path === '/submissions/investor-interest' && $method === 'POST') {
        require_once __DIR__ . '/controllers/SubmissionController.php';
        SubmissionController::submitInvestorInterest();
    }
    if ($path === '/submissions/contact' && $method === 'POST') {
        require_once __DIR__ . '/controllers/SubmissionController.php';
        SubmissionController::submitContactMessage();
    }

    // Seller lots admin
    if ($path === '/submissions/seller-lots' && $method === 'GET') {
        require_once __DIR__ . '/controllers/SubmissionController.php';
        SubmissionController::listSellerLots();
    }
    if (preg_match('#^/submissions/seller-lots/([^/]+)/status$#', $path, $m) && ($method === 'PATCH' || $method === 'POST')) {
        require_once __DIR__ . '/controllers/SubmissionController.php';
        SubmissionController::updateSellerLotStatus($m[1]);
    }
    if (preg_match('#^/submissions/seller-lots/([^/]+)/convert$#', $path, $m) && $method === 'POST') {
        require_once __DIR__ . '/controllers/SubmissionController.php';
        SubmissionController::convertLotToStock($m[1]);
    }
    if (preg_match('#^/submissions/seller-lots/([^/]+)$#', $path, $m) && $method === 'GET') {
        require_once __DIR__ . '/controllers/SubmissionController.php';
        SubmissionController::getSellerLot($m[1]);
    }

    // Investor interests admin
    if ($path === '/submissions/investor-interests' && $method === 'GET') {
        require_once __DIR__ . '/controllers/SubmissionController.php';
        SubmissionController::listInvestorInterests();
    }
    if (preg_match('#^/submissions/investor-interests/([^/]+)/status$#', $path, $m) && ($method === 'PATCH' || $method === 'POST')) {
        require_once __DIR__ . '/controllers/SubmissionController.php';
        SubmissionController::updateInvestorInterestStatus($m[1]);
    }
    if (preg_match('#^/submissions/investor-interests/([^/]+)$#', $path, $m) && $method === 'DELETE') {
        require_once __DIR__ . '/controllers/SubmissionController.php';
        SubmissionController::deleteInvestorInterest($m[1]);
    }

    // ---------------- INVESTMENTS ----------------
    if ($path === '/investments' && $method === 'GET') {
        require_once __DIR__ . '/controllers/InvestmentController.php';
        InvestmentController::list();
    }
    if ($path === '/investments' && $method === 'POST') {
        require_once __DIR__ . '/controllers/InvestmentController.php';
        InvestmentController::create();
    }
    if (preg_match('#^/investments/([^/]+)/status$#', $path, $m) && ($method === 'PATCH' || $method === 'POST')) {
        require_once __DIR__ . '/controllers/InvestmentController.php';
        InvestmentController::updateStatus($m[1]);
    }
    if (preg_match('#^/investments/([^/]+)$#', $path, $m)) {
        require_once __DIR__ . '/controllers/InvestmentController.php';
        if ($method === 'GET') InvestmentController::get($m[1]);
        if ($method === 'PUT' || $method === 'PATCH') InvestmentController::update($m[1]);
        if ($method === 'DELETE') InvestmentController::delete($m[1]);
    }

    // ---------------- BLOG ----------------
    if ($path === '/blog' && $method === 'GET') {
        require_once __DIR__ . '/controllers/BlogController.php';
        BlogController::list();
    }
    if ($path === '/blog' && $method === 'POST') {
        require_once __DIR__ . '/controllers/BlogController.php';
        BlogController::create();
    }
    if (preg_match('#^/blog/([^/]+)$#', $path, $m)) {
        require_once __DIR__ . '/controllers/BlogController.php';
        if ($method === 'GET') BlogController::get($m[1]);
        if ($method === 'PUT' || $method === 'PATCH') BlogController::update($m[1]);
        if ($method === 'DELETE') BlogController::delete($m[1]);
    }

    // ---------------- CUSTOMERS ----------------
    if ($path === '/customers' && $method === 'GET') {
        require_once __DIR__ . '/controllers/CustomerController.php';
        CustomerController::list();
    }
    if ($path === '/customers' && $method === 'POST') {
        require_once __DIR__ . '/controllers/CustomerController.php';
        CustomerController::create();
    }
    if (preg_match('#^/customers/([^/]+)$#', $path, $m)) {
        require_once __DIR__ . '/controllers/CustomerController.php';
        if ($method === 'PUT' || $method === 'PATCH') CustomerController::update($m[1]);
        if ($method === 'DELETE') CustomerController::delete($m[1]);
    }

    // ---------------- SUPPLIERS ----------------
    if ($path === '/suppliers' && $method === 'GET') {
        require_once __DIR__ . '/controllers/SupplierController.php';
        SupplierController::list();
    }
    if ($path === '/suppliers' && $method === 'POST') {
        require_once __DIR__ . '/controllers/SupplierController.php';
        SupplierController::create();
    }
    if (preg_match('#^/suppliers/([^/]+)$#', $path, $m)) {
        require_once __DIR__ . '/controllers/SupplierController.php';
        if ($method === 'PUT' || $method === 'PATCH') SupplierController::update($m[1]);
        if ($method === 'DELETE') SupplierController::delete($m[1]);
    }

    // ---------------- SETTINGS ----------------
    if ($path === '/settings' && $method === 'GET') {
        require_once __DIR__ . '/controllers/SettingsController.php';
        SettingsController::get();
    }
    if ($path === '/settings' && $method === 'POST') {
        require_once __DIR__ . '/controllers/SettingsController.php';
        SettingsController::save();
    }
    if ($path === '/settings/reset' && $method === 'POST') {
        require_once __DIR__ . '/controllers/SettingsController.php';
        SettingsController::reset();
    }

    // ---------------- DASHBOARD ----------------
    if ($path === '/dashboard/metrics' && $method === 'GET') {
        require_once __DIR__ . '/controllers/DashboardController.php';
        DashboardController::getMetrics();
    }
    if ($path === '/dashboard/activity' && $method === 'GET') {
        require_once __DIR__ . '/controllers/DashboardController.php';
        DashboardController::getActivity();
    }

    // ---------------- MEDIA UPLOAD ----------------
    if ($path === '/media/upload' && $method === 'POST') {
        require_once __DIR__ . '/controllers/MediaController.php';
        MediaController::upload();
    }

    // Root Health Check
    if ($path === '/' && $method === 'GET') {
        Response::success([
            'status' => 'online',
            'api' => 'Gangchill B2B Hub REST API',
            'version' => '2.0.0',
            'serverTime' => date('Y-m-d H:i:s')
        ]);
    }

    Response::notFound("Endpoint not found: $method $path");

} catch (\Throwable $e) {
    error_log("Gangchill API Exception [{$method} {$path}]: " . $e->getMessage() . "\n" . $e->getTraceAsString());
    Response::serverError('সার্ভারে সাময়িক সমস্যা হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।');
}
