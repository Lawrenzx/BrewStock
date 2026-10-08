<?php
// POST /php/add_waste.php
// JSON body: { item_id, quantity_wasted, reason, recorded_by }
// Adds one row to usage_waste. Does NOT change inventory or stock_movements.

require_once __DIR__ . "/helpers.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    json_error("Use POST for this endpoint.", 405);
}

$input = json_decode(file_get_contents("php://input"), true);
if (!is_array($input)) {
    json_error("Request body must be valid JSON.", 400);
}

$itemId     = filter_var($input["item_id"] ?? null, FILTER_VALIDATE_INT);
$wasted     = is_numeric($input["quantity_wasted"] ?? null) ? (float) $input["quantity_wasted"] : 0;
$reason     = trim((string) ($input["reason"] ?? ""));
$recordedBy = filter_var($input["recorded_by"] ?? null, FILTER_VALIDATE_INT);

if (!$itemId || $itemId < 1)         json_error("Choose an item.", 422);
if ($wasted <= 0)                    json_error("Enter how much was wasted.", 422);
if ($reason === "")                  json_error("Add a reason for the waste.", 422);
if (strlen($reason) > 255)           json_error("Reason must be 255 characters or fewer.", 422);
if (!$recordedBy || $recordedBy < 1) json_error("Choose who is recording this.", 422);

$conn = get_connection();

try {
    $stmt = $conn->prepare("SELECT item_name FROM inventory WHERE item_id = ?");
    $stmt->bind_param("i", $itemId);
    $stmt->execute();
    $item = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    if (!$item) {
        json_error("That item no longer exists.", 404);
    }

    $stmt = $conn->prepare("SELECT 1 FROM staff WHERE staff_id = ?");
    $stmt->bind_param("i", $recordedBy);
    $stmt->execute();
    $staffExists = (bool) $stmt->get_result()->fetch_row();
    $stmt->close();
    if (!$staffExists) {
        json_error("That staff member doesn't exist.", 404);
    }

    $stmt = $conn->prepare("INSERT INTO usage_waste (item_id, quantity_used, quantity_wasted, reason, recorded_by) VALUES (?, 0, ?, ?, ?)");
    $stmt->bind_param("idsi", $itemId, $wasted, $reason, $recordedBy);
    $stmt->execute();
    $stmt->close();

    json_response(["message" => "Recorded.", "item_name" => $item["item_name"]], 201);
} catch (Throwable $e) {
    error_log("add_waste failed: " . $e->getMessage());
    json_error("Could not save the record.", 500);
} finally {
    $conn->close();
}
