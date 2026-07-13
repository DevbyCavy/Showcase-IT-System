<?php
/*
 * php_action/updateAccount.php
 * Handles the "change username / password" form submission.
 * Include this file inside setting.php — do not call directly.
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if (!isset($_SESSION['user_id'])) {
    header('Location: index.php');
    exit;
}

require_once 'db_connection.php';

$errors  = [];
$success = '';

$userId = intval($_SESSION['user_id']);

$userStmt = $conn->prepare("SELECT username, password FROM users WHERE user_id = ?");
$userStmt->bind_param("i", $userId);
$userStmt->execute();
$currentUser = $userStmt->get_result()->fetch_assoc();
$userStmt->close();

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['account_submit'])) {

    $currentPassword = trim($_POST['current_password'] ?? '');
    $newUsername     = trim($_POST['new_username']     ?? '');
    $newPassword     = trim($_POST['new_password']      ?? '');
    $confirmPassword = trim($_POST['confirm_password']  ?? '');

    if ($currentPassword === '') {
        $errors[] = 'Please enter your current password to confirm changes.';
    } elseif (!password_verify($currentPassword, $currentUser['password'])) {
        $errors[] = 'Current password is incorrect.';
    }

    $wantsUsernameChange = $newUsername !== '' && $newUsername !== $currentUser['username'];
    $wantsPasswordChange = $newPassword !== '' || $confirmPassword !== '';

    if (empty($errors) && !$wantsUsernameChange && !$wantsPasswordChange) {
        $errors[] = 'No changes to save.';
    }

    if ($wantsUsernameChange) {
        $checkStmt = $conn->prepare("SELECT user_id FROM users WHERE username = ? AND user_id != ?");
        $checkStmt->bind_param("si", $newUsername, $userId);
        $checkStmt->execute();
        if ($checkStmt->get_result()->num_rows > 0) {
            $errors[] = 'That username is already taken.';
        }
        $checkStmt->close();
    }

    if ($wantsPasswordChange) {
        if (strlen($newPassword) < 6) {
            $errors[] = 'New password must be at least 6 characters.';
        } elseif ($newPassword !== $confirmPassword) {
            $errors[] = 'New password and confirmation do not match.';
        }
    }

    if (empty($errors)) {
        $setParts = [];
        $params   = [];
        $types    = '';

        if ($wantsUsernameChange) {
            $setParts[] = 'username = ?';
            $types     .= 's';
            $params[]   = $newUsername;
        }
        if ($wantsPasswordChange) {
            $setParts[] = 'password = ?';
            $types     .= 's';
            $params[]   = password_hash($newPassword, PASSWORD_DEFAULT);
        }

        $types   .= 'i';
        $params[] = $userId;

        $stmt = $conn->prepare("UPDATE users SET " . implode(', ', $setParts) . " WHERE user_id = ?");
        $stmt->bind_param($types, ...$params);

        if ($stmt->execute()) {
            if ($wantsUsernameChange) {
                $_SESSION['username']      = $newUsername;
                $currentUser['username']   = $newUsername;
            }
            $success = 'Your account has been updated.';
        } else {
            $errors[] = 'Failed to update account.';
        }
        $stmt->close();
    }
}
