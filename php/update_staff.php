<?php

require_once "db.php";

header("Content-Type: application/json");

$data = json_decode(
    file_get_contents("php://input"),
    true
);

$staff_id  = intval(trim($data["staff_id"]  ?? 0));
$full_name = trim($data["full_name"] ?? "");
$email     = trim($data["email"]     ?? "");
$role      = trim($data["role"]      ?? "");
$password  = trim($data["password"]  ?? "");

if ($staff_id <= 0 || !$full_name || !$email || !$role) {
    echo json_encode([
        "success" => false,
        "message" => "All fields are required."
    ]);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid email address."
    ]);
    exit;
}

$check = $conn->prepare(
    "SELECT staff_id FROM staff WHERE email = ? AND staff_id != ?"
);
$check->bind_param("si", $email, $staff_id);
$check->execute();
$check->store_result();

if ($check->num_rows > 0) {
    echo json_encode([
        "success" => false,
        "message" => "Another account already uses this email."
    ]);
    $check->close();
    $conn->close();
    exit;
}

$check->close();

if ($password !== "") {

    if (strlen($password) < 6) {
        echo json_encode([
            "success" => false,
            "message" => "Password must be at least 6 characters."
        ]);
        exit;
    }

    $hashed = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $conn->prepare(
        "UPDATE staff
         SET full_name = ?, email = ?, role = ?, password = ?
         WHERE staff_id = ?"
    );
    $stmt->bind_param("ssssi", $full_name, $email, $role, $hashed, $staff_id);

} else {

    $stmt = $conn->prepare(
        "UPDATE staff
         SET full_name = ?, email = ?, role = ?
         WHERE staff_id = ?"
    );
    $stmt->bind_param("sssi", $full_name, $email, $role, $staff_id);

}

if ($stmt->execute()) {
    echo json_encode([
        "success" => true,
        "message" => "Staff account updated."
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Failed to update staff account."
    ]);
}

$stmt->close();
$conn->close();

?>
