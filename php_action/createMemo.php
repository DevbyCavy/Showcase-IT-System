<?php
/*
 * php_action/createMemo.php
 * Handles memo (reminder/to-do) form submission.
 * Include this file inside memos.php — do not call directly.
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once 'db_connection.php';

$errors  = [];
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['memo_submit'])) {

    $title      = trim($_POST['title']       ?? '');
    $description = trim($_POST['description'] ?? '');
    $due_date   = str_replace('T', ' ', trim($_POST['due_date'] ?? ''));
    $created_by = intval($_SESSION['user_id'] ?? 0);

    if ($title === '')    $errors[] = 'Title is required.';
    if ($due_date === '') $errors[] = 'Due date is required.';

    if (empty($errors)) {
        $stmt = $conn->prepare("
            INSERT INTO memos (title, description, due_date, status, created_by)
            VALUES (?, ?, ?, 'Pending', ?)
        ");
        $stmt->bind_param("sssi", $title, $description, $due_date, $created_by);

        if ($stmt->execute()) {
            $success = "Memo \"$title\" saved!";
        } else {
            $errors[] = 'Failed to save memo.';
        }
        $stmt->close();
    }
}
