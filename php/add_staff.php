<?php

require_once "db.php";

header("Content-Type: application/json");

$data = json_decode(
    file_get_contents("php://input"),
    true
);

if (!$data) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid request data."
    ]);
    exit;
}

$full_name = trim($data["full_name"] ?? "");
$email     = trim($data["email"]     ?? "");
$password  = trim($data["password"]  ?? "");
$role      = trim($data["role"]      ?? "Staff");

// Basic validation
if (!$full_name || !$email || !$password || !$role) {
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

if (strlen($password) < 6) {
    echo json_encode([
        "success" => false,
        "message" => "Password must be at least 6 characters."
    ]);
    exit;
}

// Check duplicate email
$check = $conn->prepare(
    "SELECT staff_id FROM staff WHERE email = ?"
);
$check->bind_param("s", $email);
$check->execute();
$check->store_result();

if ($check->num_rows > 0) {
    echo json_encode([
        "success" => false,
        "message" => "A staff account with this email already exists."
    ]);
    $check->close();
    $conn->close();
    exit;
}

$check->close();

// Hash password
$hashed = password_hash($password, PASSWORD_DEFAULT);

$stmt = $conn->prepare(
    "INSERT INTO staff (full_name, email, password, role)
     VALUES (?, ?, ?, ?)"
);

$stmt->bind_param(
    "ssss",
    $full_name,
    $email,
    $hashed,
    $role
);

if ($stmt->execute()) {
    echo json_encode([
        "success"  => true,
        "message"  => "Staff account created successfully.",
        "staff_id" => $conn->insert_id
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Failed to create staff account."
    ]);
}

$stmt->close();
$conn->close();

?>
