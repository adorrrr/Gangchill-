<?php
/**
 * Standardized JSON API Response Helper
 */

class Response {
    public static function json($data, int $status = 200): void {
        http_response_code($status);
        header('Content-Type: application/json; charset=UTF-8');
        header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
        header('Pragma: no-cache');
        header('Expires: 0');
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
