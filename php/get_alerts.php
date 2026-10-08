<?php
// GET /php/get_alerts.php
// Returns items below their reorder threshold, most urgent first, with an
// estimated "days until stockout" based on the last 14 days of stock-OUT entries in stock_movements.
// Read-only: nothing here changes inventory or stock_movements.

require_once __DIR__ . "/helpers.php";

const USAGE_WINDOW_DAYS = 14;

$conn = get_connection();

try {
    $sql = "
        SELECT
            i.item_id, i.item_name, i.category,
            i.current_stock, i.min_threshold, i.unit,
            COALESCE((
                SELECT SUM(m.quantity)
                FROM stock_movements m
                WHERE m.item_id = i.item_id
                  AND m.movement_type = 'OUT'
                  AND m.movement_date >= NOW() - INTERVAL " . USAGE_WINDOW_DAYS . " DAY
            ), 0) AS out_in_window
        FROM inventory i
    ";

    $result = $conn->query($sql);

    $alerts   = [];
    $critical = 0;
    $low      = 0;

    while ($row = $result->fetch_assoc()) {
        $stock = (float) $row["current_stock"];
        $min   = (float) $row["min_threshold"];
        $status = compute_status($stock, $min);

        if ($status === "in-stock") {
            continue;
        }

        $dailyUsage = ((float) $row["out_in_window"]) / USAGE_WINDOW_DAYS;

        $alerts[] = [
            "item_id"         => (int) $row["item_id"],
            "item_name"       => $row["item_name"],
            "category"        => $row["category"],
            "unit"            => $row["unit"],
            "current_stock"   => $stock,
            "min_threshold"   => $min,
            "shortfall"       => max(0, $min - $stock),
            "status"          => $status,
            "avg_daily_usage" => $dailyUsage > 0 ? round($dailyUsage, 2) : null,
            // null = no usage history yet, so no estimate
            "days_to_stockout" => $dailyUsage > 0 ? round($stock / $dailyUsage, 1) : null,
        ];

        $status === "critical" ? $critical++ : $low++;
    }

    usort($alerts, function ($a, $b) {
        $rank = ["critical" => 0, "low" => 1];
        if ($rank[$a["status"]] !== $rank[$b["status"]]) {
            return $rank[$a["status"]] <=> $rank[$b["status"]];
        }
        // Within the same severity: soonest stockout first, unknowns last.
        $da = $a["days_to_stockout"] ?? INF;
        $db = $b["days_to_stockout"] ?? INF;
        return $da <=> $db;
    });

    json_response([
        "summary" => [
            "critical"     => $critical,
            "low"          => $low,
            "total_alerts" => $critical + $low,
            "window_days"  => USAGE_WINDOW_DAYS,
        ],
        "alerts" => $alerts,
    ]);
} catch (Throwable $e) {
    error_log("get_alerts failed: " . $e->getMessage());
    json_error("Could not load stock alerts.", 500);
} finally {
    $conn->close();
}
