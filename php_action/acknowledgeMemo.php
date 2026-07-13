<?php
/*
 * php_action/acknowledgeMemo.php
 * AJAX endpoint — Marketer only, acknowledges due-reminder pop-ups so they
 * stop reappearing (memo stays Pending in the to-do list).
 * POST: memo_ids (comma-separated ints)
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

$createdBy = intval($_SESSION['user_id'] ?? 0);
$rawIds    = explode(',', $_POST['memo_ids'] ?? '');

$stmt = $conn->prepare("UPDATE memos SET acknowledged_at = NOW() WHERE memo_id = ? AND created_by = ?");
$acknowledged = 0;
foreach ($rawIds as $rawId) {
    $memoId = intval(trim($rawId));
    if ($memoId <= 0) continue;
    $stmt->bind_param("ii", $memoId, $createdBy);
    $stmt->execute();
    $acknowledged += $stmt->affected_rows;
}
$stmt->close();

echo json_encode(['success' => true, 'acknowledged' => $acknowledged]);
