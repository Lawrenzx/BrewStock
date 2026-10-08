<?php
// GET /php/get_usage_waste.php?range=today|week|month
// Usage & waste report. Read-only.
//   usage = stock-OUT entries in stock_movements
//   waste = quantity_wasted logged in usage_waste

require_once __DIR__ . "/helpers.php";

// Whitelisted ranges (never put user input straight into SQL).
$ranges = [
    "today" => "CURDATE()",
    "week"  => "CURDATE() - INTERVAL 6 DAY",
    "month" => "CURDATE() - INTERVAL 29 DAY",
];

$range = $_GET["range"] ?? "week";
if (!isset($ranges[$range])) {
    json_error("Invalid range. Use today, week, or month.", 400);
}
$since = $ranges[$range];

$conn = get_connection();

try {
    // Usage per item, from the stock-out log.
    $usage = [];
    $result = $conn->query("
        SELECT item_id, SUM(quantity) AS total
        FROM stock_movements
        WHERE movement_type = 'OUT' AND movement_date >= $since
        GROUP BY item_id
    ");
    while ($row = $result->fetch_assoc()) {
        $usage[(int) $row["item_id"]] = (float) $row["total"];
    }

    // Waste per item, from the waste log.
    $waste = [];
    $result = $conn->query("
        SELECT item_id, SUM(quantity_wasted) AS total
        FROM usage_waste
        WHERE record_date >= $since
        GROUP BY item_id
    ");
    while ($row = $result->fetch_assoc()) {
        $waste[(int) $row["item_id"]] = (float) $row["total"];
    }

    // Units differ (kg, liters, pieces...) so quantities are never added across
    // items; only cost can be totalled across items.
    $byItem = [];
    $totalWasteCost = 0.0;
    $totalUsageCost = 0.0;

    $result = $conn->query("
        SELECT i.item_id, i.item_name, i.category, i.unit,
               COALESCE(c.unit_cost, 0) AS unit_cost
        FROM inventory i
        LEFT JOIN item_costs c ON c.item_id = i.item_id
    ");
    while ($row = $result->fetch_assoc()) {
        $id     = (int) $row["item_id"];
        $used   = $usage[$id] ?? 0.0;
        $wasted = $waste[$id] ?? 0.0;

        if ($used <= 0 && $wasted <= 0) {
            continue;
        }

        $cost    = (float) $row["unit_cost"];
        $handled = $used + $wasted;

        $totalWasteCost += $wasted * $cost;
        $totalUsageCost += $used * $cost;

        $byItem[] = [
            "item_id"    => $id,
            "item_name"  => $row["item_name"],
            "category"   => $row["category"],
            "unit"       => $row["unit"],
            "used"       => $used,
            "wasted"     => $wasted,
            "waste_rate" => $handled > 0 ? round(($wasted / $handled) * 100, 1) : 0,
            "waste_cost" => round($wasted * $cost, 2),
        ];
    }

    usort($byItem, fn($a, $b) => [$b["wasted"], $b["used"]] <=> [$a["wasted"], $a["used"]]);

    // Latest 15 entries: stock-outs and waste entries together.
    $recent = [];
    $result = $conn->query("
        (SELECT m.movement_date AS record_date, i.item_name, i.unit,
                m.quantity AS quantity_used, 0 AS quantity_wasted,
                NULL AS reason, s.full_name AS recorded_by
         FROM stock_movements m
         JOIN inventory i ON i.item_id = m.item_id
         LEFT JOIN staff s ON s.staff_id = m.recorded_by
         WHERE m.movement_type = 'OUT' AND m.movement_date >= $since)
        UNION ALL
        (SELECT u.record_date, i.item_name, i.unit,
                0, u.quantity_wasted,
                u.reason, s.full_name
         FROM usage_waste u
         JOIN inventory i ON i.item_id = u.item_id
         LEFT JOIN staff s ON s.staff_id = u.recorded_by
         WHERE u.quantity_wasted > 0 AND u.record_date >= $since)
        ORDER BY record_date DESC
        LIMIT 15
    ");
    while ($row = $result->fetch_assoc()) {
        $recent[] = [
            "record_date"     => $row["record_date"],
            "item_name"       => $row["item_name"],
            "unit"            => $row["unit"],
            "quantity_used"   => (float) $row["quantity_used"],
            "quantity_wasted" => (float) $row["quantity_wasted"],
            "reason"          => $row["reason"],
            "recorded_by"     => $row["recorded_by"], // null if staff was deleted
        ];
    }

    $itemsWithWaste = count(array_filter($byItem, fn($r) => $r["wasted"] > 0));

    json_response([
        "range" => $range,
        "summary" => [
            "items_tracked"    => count($byItem),
            "items_with_waste" => $itemsWithWaste,
            "waste_cost"       => round($totalWasteCost, 2),
            "usage_cost"       => round($totalUsageCost, 2),
            "top_waste_item"   => ($byItem && $byItem[0]["wasted"] > 0) ? $byItem[0]["item_name"] : null,
        ],
        "by_item" => $byItem,
        "recent"  => $recent,
    ]);
} catch (Throwable $e) {
    error_log("get_usage_waste failed: " . $e->getMessage());
    json_error("Could not load the usage & waste report.", 500);
} finally {
    $conn->close();
}
