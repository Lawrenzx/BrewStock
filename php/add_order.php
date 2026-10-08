<?php

require_once "db.php";

header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode(["success" => false, "message" => "Invalid request data."]);
    exit;
}

$supplier_name = trim($data["supplier_name"] ?? "");
$item_id       = intval($data["item_id"]       ?? 0);
$quantity      = floatval($data["quantity"]     ?? 0);
$unit          = trim($data["unit"]             ?? "");
$notes         = trim($data["notes"]            ?? "");
$ordered_by    = intval($data["ordered_by"]     ?? 0);

if (!$supplier_name || $item_id <= 0 || $quantity <= 0 || !$unit) {
    echo json_encode(["success" => false, "message" => "Please fill in all required fields."]);
    exit;
}

// Verify item exists and grab its unit if not provided
$check = $conn->prepare("SELECT item_id FROM inventory WHERE item_id = ?");
$check->bind_param("i", $item_id);
$check->execute();
$check->store_result();

if ($check->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "Selected item does not exist."]);
    $check->close();
    $conn->close();
    exit;
}
$check->close();

$ordered_by_val = $ordered_by > 0 ? $ordered_by : null;

$stmt = $conn->prepare(
    "INSERT INTO orders (supplier_name, item_id, quantity, unit, notes, ordered_by)
     VALUES (?, ?, ?, ?, ?, ?)"
);

$stmt->bind_param(
    "sidssi",
    $supplier_name,
    $item_id,
    $quantity,
    $unit,
    $notes,
    $ordered_by_val
);

if ($stmt->execute()) {
    echo json_encode([
        "success"  => true,
        "message"  => "Order placed successfully.",
        "order_id" => $conn->insert_id
    ]);
} else {
    echo json_encode(["success" => false, "message" => "Failed to place order."]);
}

$stmt->close();
$conn->close();

?>
