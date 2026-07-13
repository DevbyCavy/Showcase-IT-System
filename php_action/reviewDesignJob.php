<?php
/*
 * php_action/reviewDesignJob.php
 * AJAX endpoint — Marketer only, reviews their own design job's submission.
 * POST: design_job_id (int), action ('approve'|'revise'), review_notes (optional)
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

$jobId        = intval($_POST['design_job_id'] ?? 0);
$action       = $_POST['action'] ?? '';
$review_notes = trim($_POST['review_notes'] ?? '');
$marketerId   = intval($_SESSION['user_id'] ?? 0);

if ($jobId <= 0 || !in_array($action, ['approve', 'revise'], true)) {
    echo json_encode(['success' => false, 'error' => 'Invalid request.']);
    exit;
}

$newStatus = $action === 'approve' ? 'Approved' : 'Revision Requested';

$stmt = $conn->prepare("
    UPDATE design_jobs
    SET status = ?,
        review_notes = ?,
        reviewed_at = NOW()
    WHERE design_job_id = ?
      AND marketer_id = ?
      AND status = 'Submitted'
");
$stmt->bind_param("ssii", $newStatus, $review_notes, $jobId, $marketerId);

if ($stmt->execute() && $stmt->affected_rows > 0) {
    echo json_encode(['success' => true, 'design_job_id' => $jobId, 'status' => $newStatus]);
} else {
    echo json_encode(['success' => false, 'error' => 'Could not update — already reviewed or not found.']);
}

$stmt->close();
