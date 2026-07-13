<?php
/*
 * php_action/getNotifications.php
 * AJAX endpoint — any logged-in user. Returns their notifications, oldest
 * to newest (capped to the 30 most recent so the list can't grow forever).
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

$stmt = $conn->prepare("
    SELECT n.notification_id, n.type, n.message, n.link, n.seen_at, n.created_at,
           u.name AS actor_name, u.surname AS actor_surname
    FROM notifications n
    LEFT JOIN users u ON n.actor_id = u.user_id
    WHERE n.recipient_id = ?
    ORDER BY n.created_at DESC, n.notification_id DESC
    LIMIT 30
");
$stmt->bind_param("i", $userId);
$stmt->execute();
$result = $stmt->get_result();

$notifications = [];
while ($row = $result->fetch_assoc()) {
    $notifications[] = [
        'id'         => (int) $row['notification_id'],
        'type'       => $row['type'],
        'message'    => $row['message'],
        'link'       => $row['link'],
        'actor_name' => trim(($row['actor_name'] ?? '') . ' ' . ($row['actor_surname'] ?? '')) ?: 'System',
        'seen'       => $row['seen_at'] !== null,
        'created_at' => $row['created_at'],
    ];
}
$stmt->close();

$notifications = array_reverse($notifications);

echo json_encode(['success' => true, 'notifications' => $notifications]);
