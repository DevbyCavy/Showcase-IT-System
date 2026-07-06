<?php
/*
 * php_action/update_order_status.php
 * AJAX endpoint — updates order status and sets ongoing_since when relevant.
 * POST: order_id (int), status (string)
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'Not authenticated']);
    exit;
}

require_once 'db_connection.php';

$allowed   = ['New', 'Assigned', 'On Going', 'Completed'];
$orderId   = intval($_POST['order_id'] ?? 0);
$newStatus = trim($_POST['status'] ?? '');

if ($orderId <= 0 || !in_array($newStatus, $allowed, true)) {
    echo json_encode(['success' => false, 'error' => 'Invalid parameters']);
    exit;
}

if ($newStatus === 'On Going') {
    // Record the exact moment it became On Going — drives the 24hr countdown
    $stmt = $conn->prepare("
        UPDATE orders
        SET status = 'On Going', ongoing_since = NOW()
        WHERE order_id = ?
    ");
} else {
    $stmt = $conn->prepare("UPDATE orders SET status = ? WHERE order_id = ?");
    $stmt->bind_param("si", $newStatus, $orderId);
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'order_id' => $orderId, 'status' => $newStatus]);
    } else {
        echo json_encode(['success' => false, 'error' => $stmt->error]);
    }
    $stmt->close();
    exit;
}

$stmt->bind_param("i", $orderId);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'order_id' => $orderId, 'status' => $newStatus]);
} else {
    echo json_encode(['success' => false, 'error' => $stmt->error]);
}

$stmt->close();
