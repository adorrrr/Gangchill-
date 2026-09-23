<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../helpers/Auth.php';
require_once __DIR__ . '/../helpers/Validator.php';
require_once __DIR__ . '/../helpers/Logger.php';

class SettingsController {
    public static function getDefaultSettings(): array {
        return [
            'platformName' => 'Gangchill B2B Hub',
            'tagline' => 'জাতীয় সামুদ্রিক ও নদীর মাছের পাইকারি সরবরাহ নেটওয়ার্ক',
            'supportEmail' => 'supply@gangchill.com',
            'supportPhone' => '+880 1712-345678',
            'emergencyHotline' => '+880 1712-345678',
            'businessHours' => 'শনিবার - বৃহস্পতিবার: সকাল ৮টা - রাত ১০টা',
            'headOfficeAddress' => 'হাউস ১২, রোড ৯, ব্লক-সি, গুলশান-১, ঢাকা ১২১২, বাংলাদেশ',
            'hubLocations' => 'চাঁদপুর বড়স্টেশন, কক্সবাজার ফিশারি ঘাট, খুলনা রূপসা, নাটোর চলনবিল, ভৈরব মেঘনা ঘাট',
            'defaultMoqKg' => 50,
            'coldChainEnabled' => true,
            'allowPublicSellerSubmissions' => true,
            'allowPublicInvestorInterest' => true,
            'maintenanceMode' => false,
            'maintenanceMessage' => 'সাময়িক রক্ষণাবেক্ষণের জন্য আমাদের ক্রয়-বিক্রয় কার্যক্রম বর্তমানে বন্ধ রয়েছে। অনুগ্রহ করে কিছুক্ষণ পরে আবার চেষ্টা করুন।',
            'notifyOnNewOrder' => true,
            'notifyOnNewLot' => true,
            'notifyOnNewInvestmentInterest' => true
        ];
    }

    public static function getSettings(): array {
        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT settings_json FROM platform_settings WHERE id = 1");
        $stmt->execute();
        $json = $stmt->fetchColumn();

        if ($json) {
            $data = json_decode($json, true);
            if (is_array($data)) {
                return array_merge(self::getDefaultSettings(), $data);
            }
        }

        return self::getDefaultSettings();
    }

    public static function get(): void {
        Response::success(self::getSettings());
    }

    public static function save(): void {
        $admin = Auth::requireAuth();
        $data = Validator::getJsonBody();

        $current = self::getSettings();
        $merged = array_merge($current, $data);

        // Sanitize and strictly type settings
        if (isset($merged['defaultMoqKg'])) {
            $merged['defaultMoqKg'] = max(1, (int)$merged['defaultMoqKg']);
        }
        if (isset($merged['coldChainEnabled'])) {
            $merged['coldChainEnabled'] = (bool)$merged['coldChainEnabled'];
        }
        if (isset($merged['allowPublicSellerSubmissions'])) {
            $merged['allowPublicSellerSubmissions'] = (bool)$merged['allowPublicSellerSubmissions'];
        }
        if (isset($merged['allowPublicInvestorInterest'])) {
            $merged['allowPublicInvestorInterest'] = (bool)$merged['allowPublicInvestorInterest'];
        }
        if (isset($merged['maintenanceMode'])) {
            $merged['maintenanceMode'] = (bool)$merged['maintenanceMode'];
        }
        if (isset($merged['maintenanceMessage'])) {
            $merged['maintenanceMessage'] = trim($merged['maintenanceMessage']);
            if (empty($merged['maintenanceMessage'])) {
                $merged['maintenanceMessage'] = 'সাময়িক রক্ষণাবেক্ষণের জন্য আমাদের ক্রয়-বিক্রয় কার্যক্রম বর্তমানে বন্ধ রয়েছে। অনুগ্রহ করে কিছুক্ষণ পরে আবার চেষ্টা করুন।';
            }
        }

        $db = Database::getConnection();
        $upd = $db->prepare("
            INSERT INTO platform_settings (id, settings_json, updated_by, updated_at)
            VALUES (1, :json, :ub, NOW())
            ON DUPLICATE KEY UPDATE settings_json = :json_u, updated_by = :ub_u, updated_at = NOW()
        ");
        $jsonStr = json_encode($merged, JSON_UNESCAPED_UNICODE);
        $upd->execute([
            ':json' => $jsonStr,
            ':ub' => $admin['name'],
            ':json_u' => $jsonStr,
            ':ub_u' => $admin['name']
        ]);

        $detail = !empty($merged['maintenanceMode']) ? 'রক্ষণাবেক্ষণ মোড (Maintenance Mode) সক্রিয় করা হয়েছে' : 'কোম্পানির তথ্য, হাব ও পলিসি সংরক্ষিত হয়েছে';
        Logger::log('প্ল্যাটফর্ম সেটিংস আপডেট', 'settings', 'জেনারেল কনফিগারেশন', $detail, $admin['name']);

        Response::success($merged, 'সেটিংস সফলভাবে সংরক্ষিত হয়েছে।');
    }

    public static function reset(): void {
        $admin = Auth::requireAuth();
        $defaults = self::getDefaultSettings();

        $db = Database::getConnection();
        $upd = $db->prepare("
            INSERT INTO platform_settings (id, settings_json, updated_by, updated_at)
            VALUES (1, :json, :ub, NOW())
            ON DUPLICATE KEY UPDATE settings_json = :json_u, updated_by = :ub_u, updated_at = NOW()
        ");
        $jsonStr = json_encode($defaults, JSON_UNESCAPED_UNICODE);
        $upd->execute([
            ':json' => $jsonStr,
            ':ub' => $admin['name'],
            ':json_u' => $jsonStr,
            ':ub_u' => $admin['name']
        ]);

        Logger::log('প্ল্যাটফর্ম সেটিংস রিসেট', 'settings', 'ডিফল্ট কনফিগারেশন', 'প্রাথমিক ডিফল্ট মানে পুনঃস্থাপন', $admin['name']);

        Response::success($defaults, 'সেটিংস ডিফল্ট মানে রিসেট করা হয়েছে।');
    }
}
