<?php

$host = "localhost";
$username = "root";
$password = "";
$database = "brewstock";

$conn = new mysqli(
    $host,
    $username,
    $password,
    $database,
    3307
);

if ($conn->connect_error) {
    die("Database connection failed: " . $conn->connect_error);
}

$conn->set_charset("utf8mb4");

?>