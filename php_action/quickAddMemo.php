<?php
/*
 * php_action/quickAddMemo.php
 * AJAX endpoint — any logged-in user. Creates a memo from the Office Task
 * Calendar's "To-Do" modal (JSON twin of php_action/createMemo.php, which is
 * the form-POST handler included by memos.php).
 * POST: title, description, due_date (datetime-local, e.g. 2026-07-14T09:00)
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

$title       = trim($_POST['title']       ?? '');
$description = trim($_POST['description'] ?? '');
$due_date    = str_replace('T', ' ', trim($_POST['due_date'] ?? ''));
$createdBy   = intval($_SESSION['user_id']);

if ($title === '') {
    echo json_encode(['success' => false, 'error' => 'Title is required.']);
    exit;
}
if ($due_date === '') {
    echo json_encode(['success' => false, 'error' => 'Due date is required.']);
    exit;
}

$stmt = $conn->prepare("
    INSERT INTO memos (title, description, due_date, status, created_by)
    VALUES (?, ?, ?, 'Pending', ?)
");
$stmt->bind_param("sssi", $title, $description, $due_date, $createdBy);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'memo_id' => $conn->insert_id]);
} else {
    echo json_encode(['success' => false, 'error' => 'Failed to save memo.']);
}
$stmt->close();
