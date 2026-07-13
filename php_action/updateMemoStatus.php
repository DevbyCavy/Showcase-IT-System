<?php
/*
 * php_action/updateMemoStatus.php
 * AJAX endpoint — Marketer only, marks their own memo as Done.
 * POST: memo_id (int)
 * Returns JSON.
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json');

if (($_SESSION['user_type'] ?? '') !== 'Marketer') {
    echo json_encode(['success' => false, 'error' => 'Access denied.']);
    exit;
}

require_once 'db_connection.php';

$memoId    = intval($_POST['memo_id'] ?? 0);
$createdBy = intval($_SESSION['user_id'] ?? 0);

if ($memoId <= 0) {
    echo json_encode(['success' => false, 'error' => 'Invalid memo ID.']);
    exit;
}

$stmt = $conn->prepare("UPDATE memos SET status = 'Done' WHERE memo_id = ? AND created_by = ?");
$stmt->bind_param("ii", $memoId, $createdBy);

if ($stmt->execute() && $stmt->affected_rows > 0) {
    echo json_encode(['success' => true, 'memo_id' => $memoId]);
} else {
    echo json_encode(['success' => false, 'error' => 'Could not update — not found.']);
}

$stmt->close();
