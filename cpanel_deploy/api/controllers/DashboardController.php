<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../helpers/Auth.php';

class DashboardController {
    public static function getMetrics(): void {
        Auth::requireAuth();
        $db = Database::getConnection();

        // Stocks counts
        $totalStocks = (int)$db->query("SELECT COUNT(*) FROM stocks")->fetchColumn();
        $liveStocks = (int)$db->query("SELECT COUNT(*) FROM stocks WHERE status = 'live'")->fetchColumn();
        $upcomingStocks = (int)$db->query("SELECT COUNT(*) FROM stocks WHERE status = 'upcoming'")->fetchColumn();
        $soldStocks = (int)$db->query("SELECT COUNT(*) FROM stocks WHERE status = 'sold'")->fetchColumn();

        // Buyer Orders counts
        $pendingRequirementsCount = (int)$db->query("SELECT COUNT(*) FROM buyer_orders WHERE order_status IN ('pending', 'under_review')")->fetchColumn();
        $activeOrdersCount = (int)$db->query("SELECT COUNT(*) FROM buyer_orders WHERE order_status IN ('confirmed', 'processing', 'dispatched')")->fetchColumn();
        $completedOrdersCount = (int)$db->query("SELECT COUNT(*) FROM buyer_orders WHERE order_status = 'completed'")->fetchColumn();

        // Seller Lots
        $pendingSellerLotsCount = (int)$db->query("SELECT COUNT(*) FROM seller_lots WHERE verification_status = 'pending'")->fetchColumn();

        // Investments
        $totalInvestmentPledges = (int)$db->query("SELECT COUNT(*) FROM investor_interests")->fetchColumn();
        $totalPledgedAmount = (float)$db->query("SELECT COALESCE(SUM(interested_amount), 0) FROM investor_interests")->fetchColumn();
        $activeFundProjectsCount = (int)$db->query("SELECT COUNT(*) FROM investments WHERE status = 'open'")->fetchColumn();

        Response::success([
            'totalStocks' => $totalStocks,
            'liveStocks' => $liveStocks,
            'upcomingStocks' => $upcomingStocks,
            'soldStocks' => $soldStocks,
            'pendingRequirementsCount' => $pendingRequirementsCount,
            'activeOrdersCount' => $activeOrdersCount,
            'completedOrdersCount' => $completedOrdersCount,
            'pendingSellerLotsCount' => $pendingSellerLotsCount,
            'totalInvestmentPledges' => $totalInvestmentPledges,
            'totalPledgedAmount' => $totalPledgedAmount,
            'activeFundProjectsCount' => $activeFundProjectsCount
        ]);
    }

    public static function getActivity(): void {
        Auth::requireAuth();
        $db = Database::getConnection();
        $stmt = $db->query("SELECT id, action, target_type, target_title, actor, timestamp, details FROM activity_logs ORDER BY timestamp DESC LIMIT 30");
        $rows = $stmt->fetchAll();

        $formatted = array_map(function($r) {
            return [
                'id' => $r['id'],
                'action' => $r['action'],
                'targetType' => $r['target_type'],
                'targetTitle' => $r['target_title'],
                'actor' => $r['actor'],
                'timestamp' => $r['timestamp'],
                'details' => $r['details']
            ];
        }, $rows);

        Response::success($formatted);
    }
}
