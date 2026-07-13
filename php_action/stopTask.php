<?php
/*
 * php_action/stopTask.php
 * AJAX endpoint — any logged-in user. Stops their own running task.
 * POST: task_id (int)
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
$taskId = intval($_POST['task_id'] ?? 0);

if ($taskId <= 0) {
    echo json_encode(['success' => false, 'error' => 'Invalid task ID.']);
    exit;
}

$stmt = $conn->prepare("
    UPDATE work_tasks
    SET end_time = NOW(), status = 'Completed'
    WHERE task_id = ? AND user_id = ? AND status = 'Running'
");
$stmt->bind_param("ii", $taskId, $userId);

if ($stmt->execute() && $stmt->affected_rows > 0) {
    $stmt->close();

    $endTimeStmt = $conn->prepare("SELECT end_time FROM work_tasks WHERE task_id = ?");
    $endTimeStmt->bind_param("i", $taskId);
    $endTimeStmt->execute();
    $endTime = $endTimeStmt->get_result()->fetch_assoc()['end_time'];
    $endTimeStmt->close();

    echo json_encode(['success' => true, 'task_id' => $taskId, 'end_time' => $endTime]);
} else {
    $stmt->close();
    echo json_encode(['success' => false, 'error' => 'Could not stop — not found or already stopped.']);
}
