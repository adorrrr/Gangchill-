<?php
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
        return (bool) preg_match('/^(?:\+?880|0)?1[3-9]\d{8}$/', $normalized);
    }

    public static function isValidEmail(string $email): bool {
        return (bool) filter_var($email, FILTER_VALIDATE_EMAIL);
    }

    public static function slugify(string $text): string {
        $text = preg_replace('~[^\pL\d]+~u', '-', $text);
        $text = trim($text, '-');
        $text = preg_replace('~-+~', '-', $text);
        $text = strtolower($text);
        return empty($text) ? 'item-' . time() : $text;
    }

    public static function sanitize(string $data): string {
        return htmlspecialchars(strip_tags(trim($data)), ENT_QUOTES, 'UTF-8');
    }
}
