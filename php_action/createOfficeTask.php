<?php
/*
 * php_action/createOfficeTask.php
 * AJAX endpoint — any logged-in user. Assigns a general office task ("job")
 * to another user, from the Office Task Calendar's "Job" modal.
 * POST: title, description, due_date (date, e.g. 2026-07-14), assigned_to (user_id)
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
require_once 'notify.php';

$title       = trim($_POST['title']       ?? '');
$description = trim($_POST['description'] ?? '');
$dueDate     = trim($_POST['due_date']    ?? '');
$assignedTo  = intval($_POST['assigned_to'] ?? 0);
$assignedBy  = intval($_SESSION['user_id']);

if ($title === '') {
    echo json_encode(['success' => false, 'error' => 'Task title is required.']);
    exit;
}
if ($dueDate === '') {
    echo json_encode(['success' => false, 'error' => 'Due date is required.']);
    exit;
}
if ($assignedTo <= 0) {
    echo json_encode(['success' => false, 'error' => 'Please select who to assign this to.']);
    exit;
}

$checkUser = $conn->prepare("SELECT user_id FROM users WHERE user_id = ?");
$checkUser->bind_param("i", $assignedTo);
$checkUser->execute();
if ($checkUser->get_result()->num_rows === 0) {
    $checkUser->close();
    echo json_encode(['success' => false, 'error' => 'Selected assignee is invalid.']);
    exit;
}
$checkUser->close();

$stmt = $conn->prepare("
    INSERT INTO office_tasks (title, description, due_date, status, assigned_by, assigned_to)
    VALUES (?, ?, ?, 'Pending', ?, ?)
");
$stmt->bind_param("sssii", $title, $description, $dueDate, $assignedBy, $assignedTo);

if ($stmt->execute()) {
    notifyUser(
        $conn, $assignedTo, $assignedBy, 'office_task_assigned',
        "assigned you a task: {$title}",
        null
    );
    echo json_encode(['success' => true, 'task_id' => $conn->insert_id]);
} else {
    echo json_encode(['success' => false, 'error' => 'Failed to assign task.']);
}
$stmt->close();
