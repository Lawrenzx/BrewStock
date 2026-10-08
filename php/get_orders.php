<?php

require_once "db.php";

header("Content-Type: application/json");

$sql = "
    SELECT
        o.order_id,
        o.supplier_name,
        o.quantity,
        o.unit,
        o.status,
        o.notes,
        o.order_date,
        o.updated_at,
        i.item_id,
        i.item_name,
        i.category,
        s.staff_id,
        s.full_name AS ordered_by_name
    FROM orders o
    JOIN inventory i ON o.item_id   = i.item_id
    LEFT JOIN staff s ON o.ordered_by = s.staff_id
    ORDER BY o.order_date DESC
";

$result = $conn->query($sql);

$orders = [];

while ($row = $result->fetch_assoc()) {
    $orders[] = $row;
}

echo json_encode($orders);

$conn->close();

?>
