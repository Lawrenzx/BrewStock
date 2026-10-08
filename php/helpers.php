<?php
// php/helpers.php
// Shared helpers for the Stock Alerts and Usage & Waste endpoints.
// Does NOT change db.php or get_inventory.php.

// TODO: when the front-end and back-end are in separate repos, replace "*"
// with the front-end's real origin (e.g. "http://localhost:5500").
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

function json_response($data, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($data);
    exit;
}

function json_error(string $message, int $status = 400): void
{
    json_response(["error" => $message], $status);
}

// Opens the connection using groupmate's db.php, but returns a JSON error
// instead of dying with plain text (which would break response.json()).
function get_connection(): mysqli
{
    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

    try {
        require __DIR__ . "/db.php"; // defines $conn in this function's scope
    } catch (Throwable $e) {
        error_log("BrewStock DB connection failed: " . $e->getMessage());
        json_error("Database connection failed.", 500);
    }

    return $conn;
}

// Status is computed from live numbers so it can't go stale.
//   critical = at or below half of the minimum threshold
//   low      = below the minimum threshold
function compute_status(float $stock, float $min): string
{
    if ($min <= 0) {
        return "in-stock";
    }
    if ($stock <= $min * 0.5) {
        return "critical";
    }
    if ($stock < $min) {
        return "low";
    }
    return "in-stock";
}
