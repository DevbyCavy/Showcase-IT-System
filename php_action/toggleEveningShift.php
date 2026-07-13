<?php
/*
 * php_action/toggleEveningShift.php
 * AJAX endpoint — any logged-in user. Marks today's shift as an evening shift,
 * which extends the Work Log Sheet timeline/adherence window past the normal
 * shift end for that day.
 * Returns JSON.
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'Not logged in.']);
    exit;
}

require_once 'db_connection.php';

$userId = intval($_SESSION['user_id']);

$stmt = $conn->prepare("UPDATE work_shifts SET evening_shift = 1 WHERE user_id = ? AND shift_date = CURDATE()");
$stmt->bind_param("i", $userId);

if ($stmt->execute() && $stmt->affected_rows > 0) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'error' => 'Log in first.']);
}
