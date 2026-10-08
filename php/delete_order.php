<?php

require_once "db.php";

header("Content-Type: application/json");

$data     = json_decode(file_get_contents("php://input"), true);
$order_id = intval($data["order_id"] ?? 0);

if ($order_id <= 0) {
    echo json_encode(["success" => false, "message" => "Invalid order ID."]);
    exit;
}

$check = $conn->prepare(
    "SELECT status FROM orders WHERE order_id = ?"
);
$check->bind_param("i", $order_id);
$check->execute();
$res    = $check->get_result();
$order  = $res->fetch_assoc();
$check->close();

if (!$order) {
    echo json_encode(["success" => false, "message" => "Order not found."]);
    $conn->close();
    exit;
}

if (!in_array($order["status"], ["Pending", "Cancelled"])) {
    echo json_encode([
        "success" => false,
        "message" => "Only Pending or Cancelled orders can be deleted."
    ]);
    $conn->close();
    exit;
}

$stmt = $conn->prepare("DELETE FROM orders WHERE order_id = ?");
$stmt->bind_param("i", $order_id);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "Order deleted."]);
} else {
    echo json_encode(["success" => false, "message" => "Failed to delete order."]);
}

$stmt->close();
$conn->close();

?>
