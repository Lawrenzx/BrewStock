<?php

require_once "db.php";

header("Content-Type: application/json");

$sql = "SELECT
            staff_id,
            full_name,
            email,
            role,
            created_at
        FROM staff
        ORDER BY created_at DESC";

$result = $conn->query($sql);

$staff = [];

while ($row = $result->fetch_assoc()) {
    $staff[] = $row;
}

echo json_encode($staff);

$conn->close();

?>
