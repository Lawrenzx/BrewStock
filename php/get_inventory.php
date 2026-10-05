<?php

require_once "db.php";

$sql = "SELECT * FROM inventory ORDER BY item_id DESC";

$result = $conn->query($sql);

$items = [];

while ($row = $result->fetch_assoc()) {
    $items[] = $row;
}

header("Content-Type: application/json");

echo json_encode($items);

$conn->close();

?>