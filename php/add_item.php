<?php

require_once "db.php";

$data = json_decode(
    file_get_contents("php://input"),
    true
);

$item_name =
    $data["item_name"];

$category =
    $data["category"];

$current_stock =
    $data["current_stock"];

$min_threshold =
    $data["min_threshold"];

$unit =
    $data["unit"];


if ($current_stock <= 0) {

    $status = "critical";

} elseif ($current_stock <= $min_threshold) {

    $status = "low";

} else {

    $status = "in-stock";

}


$sql = "INSERT INTO inventory
        (
            item_name,
            category,
            current_stock,
            min_threshold,
            unit,
            status
        )
        VALUES (?, ?, ?, ?, ?, ?)";


$stmt =
    $conn->prepare($sql);


$stmt->bind_param(
    "ssddss",
    $item_name,
    $category,
    $current_stock,
    $min_threshold,
    $unit,
    $status
);


if ($stmt->execute()) {

    echo json_encode([
        "success" => true,
        "message" =>
            "Item added successfully"
    ]);

} else {

    echo json_encode([
        "success" => false,
        "message" =>
            "Failed to add item"
    ]);

}


$stmt->close();

$conn->close();

?>