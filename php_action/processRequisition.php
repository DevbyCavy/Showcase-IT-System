<?php
/*
 * php_action/processRequisition.php
 * AJAX endpoint — Super Admin only.
 * POST: requisition_id (int)
 * Returns JSON.
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json');

// Only Super Admin can process
if (($_SESSION['user_type'] ?? '') !== 'Super Admin') {
    echo json_encode(['success' => false, 'error' => 'Access denied.']);
    exit;
}

require_once 'db_connection.php';

$reqId = intval($_POST['requisition_id'] ?? 0);

if ($reqId <= 0) {
    echo json_encode(['success' => false, 'error' => 'Invalid requisition ID.']);
    exit;
}

$stmt = $conn->prepare("
    UPDATE requisitions
    SET status = 'Processed',
        processed_by = ?,
        processed_at = NOW()
    WHERE requisition_id = ?
      AND status = 'Pending'
");
$stmt->bind_param("ii", $_SESSION['user_id'], $reqId);

if ($stmt->execute() && $stmt->affected_rows > 0) {
    echo json_encode(['success' => true, 'requisition_id' => $reqId]);
} else {
    echo json_encode(['success' => false, 'error' => 'Could not process — already processed or not found.']);
}

$stmt->close();
