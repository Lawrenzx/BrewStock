<?php

require_once "db.php";

header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"), true);

$order_id = intval($data["order_id"] ?? 0);
$status   = trim($data["status"]    ?? "");

$allowed = ["Pending", "Ordered", "Received", "Cancelled"];

if ($order_id <= 0 || !in_array($status, $allowed)) {
    echo json_encode(["success" => false, "message" => "Invalid order ID or status."]);
    exit;
}

if ($status === "Received") {
    
    $fetch = $conn->prepare(
        "SELECT item_id, quantity FROM orders WHERE order_id = ?"
    );
    $fetch->bind_param("i", $order_id);
    $fetch->execute();
    $res = $fetch->get_result();
    $order = $res->fetch_assoc();
    $fetch->close();

    if ($order) {
   
        $upd = $conn->prepare(
            "UPDATE inventory
             SET current_stock = current_stock + ?
             WHERE item_id = ?"
        );
        $upd->bind_param("di", $order["quantity"], $order["item_id"]);
        $upd->execute();
        $upd->close();

        $recalc = $conn->prepare(
            "UPDATE inventory
             SET status = CASE
                 WHEN current_stock <= 0               THEN 'critical'
                 WHEN current_stock <= min_threshold   THEN 'low'
                 ELSE 'in-stock'
             END
             WHERE item_id = ?"
        );
        $recalc->bind_param("i", $order["item_id"]);
        $recalc->execute();
        $recalc->close();

        $mov = $conn->prepare(
            "INSERT INTO stock_movements (item_id, movement_type, quantity)
             VALUES (?, 'IN', ?)"
        );
        $mov->bind_param("id", $order["item_id"], $order["quantity"]);
        $mov->execute();
        $mov->close();
    }
}

$stmt = $conn->prepare(
    "UPDATE orders SET status = ? WHERE order_id = ?"
);
$stmt->bind_param("si", $status, $order_id);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "Order status updated."]);
} else {
    echo json_encode(["success" => false, "message" => "Failed to update status."]);
}

$stmt->close();
$conn->close();

?>
