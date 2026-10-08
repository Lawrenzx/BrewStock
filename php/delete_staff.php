<?php

require_once "db.php";

header("Content-Type: application/json");

$data = json_decode(
    file_get_contents("php://input"),
    true
);

$staff_id = intval($data["staff_id"] ?? 0);

if ($staff_id <= 0) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid staff ID."
    ]);
    exit;
}

$stmt = $conn->prepare(
    "DELETE FROM staff WHERE staff_id = ?"
);

$stmt->bind_param("i", $staff_id);

if ($stmt->execute()) {

    if ($stmt->affected_rows > 0) {
        echo json_encode([
            "success" => true,
            "message" => "Staff account deleted."
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Staff account not found."
        ]);
    }

} else {
    echo json_encode([
        "success" => false,
        "message" => "Failed to delete staff account."
    ]);
}

$stmt->close();
$conn->close();

?>
