<?php
/*
 * php_action/notify.php
 * Shared helper for inserting a notification row. Include from any
 * endpoint whose action affects another user.
 */

function notifyUser($conn, $recipientId, $actorId, $type, $message, $link = null) {
    $recipientId = intval($recipientId);
    if ($recipientId <= 0) {
        return;
    }
    $actorId = $actorId ? intval($actorId) : null;

    $stmt = $conn->prepare("
        INSERT INTO notifications (recipient_id, actor_id, type, message, link)
        VALUES (?, ?, ?, ?, ?)
    ");
    $stmt->bind_param("iisss", $recipientId, $actorId, $type, $message, $link);
    $stmt->execute();
    $stmt->close();
}
