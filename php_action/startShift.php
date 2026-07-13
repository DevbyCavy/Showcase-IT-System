<?php
/*
 * php_action/startShift.php
 * AJAX endpoint — any logged-in user. Idempotently logs the shift in for today.
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

$existing = $conn->prepare("SELECT shift_id, login_time FROM work_shifts WHERE user_id = ? AND shift_date = CURDATE()");
$existing->bind_param("i", $userId);
$existing->execute();
$row = $existing->get_result()->fetch_assoc();
$existing->close();

if ($row) {
    echo json_encode(['success' => true, 'shift_id' => (int)$row['shift_id'], 'login_time' => $row['login_time']]);
    exit;
}

$stmt = $conn->prepare("INSERT INTO work_shifts (user_id, shift_date, login_time) VALUES (?, CURDATE(), NOW())");
$stmt->bind_param("i", $userId);

if ($stmt->execute()) {
    $shiftId = $conn->insert_id;
    $stmt->close();

    $loginTimeStmt = $conn->prepare("SELECT login_time FROM work_shifts WHERE shift_id = ?");
    $loginTimeStmt->bind_param("i", $shiftId);
    $loginTimeStmt->execute();
    $loginTime = $loginTimeStmt->get_result()->fetch_assoc()['login_time'];
    $loginTimeStmt->close();

    echo json_encode(['success' => true, 'shift_id' => $shiftId, 'login_time' => $loginTime]);
} else {
    $stmt->close();
    echo json_encode(['success' => false, 'error' => 'Failed to log in.']);
}
