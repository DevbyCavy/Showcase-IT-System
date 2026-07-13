<?php
/*
 * php_action/processQuotation.php
 * AJAX endpoint — Super Admin only.
 * POST: quotation_id (int)
 * Returns JSON.
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json');

if (($_SESSION['user_type'] ?? '') !== 'Super Admin') {
    echo json_encode(['success' => false, 'error' => 'Access denied.']);
    exit;
}

require_once 'db_connection.php';
require_once 'notify.php';

$quoId = intval($_POST['quotation_id'] ?? 0);

if ($quoId <= 0) {
    echo json_encode(['success' => false, 'error' => 'Invalid quotation ID.']);
    exit;
}

$lookupStmt = $conn->prepare("SELECT submitted_by, quotation_number FROM quotations WHERE quotation_id = ?");
$lookupStmt->bind_param("i", $quoId);
$lookupStmt->execute();
$quo = $lookupStmt->get_result()->fetch_assoc();
$lookupStmt->close();

$stmt = $conn->prepare("
    UPDATE quotations
    SET status = 'Approved',
        approved_by = ?,
        approved_at = NOW()
    WHERE quotation_id = ?
      AND status = 'Pending'
");
$stmt->bind_param("ii", $_SESSION['user_id'], $quoId);

if ($stmt->execute() && $stmt->affected_rows > 0) {
    if ($quo) {
        notifyUser(
            $conn, $quo['submitted_by'], $_SESSION['user_id'], 'quotation_approved',
            "approved your quotation {$quo['quotation_number']}",
            'viewQuotation.php?id=' . $quoId
        );
    }
    echo json_encode(['success' => true, 'quotation_id' => $quoId]);
} else {
    echo json_encode(['success' => false, 'error' => 'Could not approve — already approved or not found.']);
}

$stmt->close();
