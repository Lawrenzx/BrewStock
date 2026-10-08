<?php
// GET /php/get_staff.php
// Names only (for the "Recorded by" dropdown). Never returns passwords.
// TODO: remove once login exists and recorded_by comes from the session.

require_once __DIR__ . "/helpers.php";

$conn = get_connection();

try {
    $result = $conn->query("SELECT staff_id, full_name FROM staff ORDER BY full_name");
    $staff = [];
    while ($row = $result->fetch_assoc()) {
        $staff[] = $row;
    }
    json_response($staff);
} catch (Throwable $e) {
    error_log("get_staff failed: " . $e->getMessage());
    json_error("Could not load staff.", 500);
} finally {
    $conn->close();
}
