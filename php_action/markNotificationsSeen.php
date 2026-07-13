<?php
/*
 * php_action/markNotificationsSeen.php
 * AJAX endpoint — any logged-in user. Marks all their unseen notifications
 * as seen (called when the notification dropdown is opened).
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

$stmt = $conn->prepare("UPDATE notifications SET seen_at = NOW() WHERE recipient_id = ? AND seen_at IS NULL");
$stmt->bind_param("i", $userId);
$stmt->execute();
$updated = $stmt->affected_rows;
$stmt->close();

echo json_encode(['success' => true, 'updated' => $updated]);
