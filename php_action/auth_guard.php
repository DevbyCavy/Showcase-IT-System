<?php
// Start session only if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

/**
 * Check if the user has a specific role
 * @param string $role
 */
function requireRole($role) {
    // No need to call session_start() here
    if (!isset($_SESSION['user_id']) || $_SESSION['user_type'] !== $role) {
        header("Location: index.php?error=AccessDenied");
        exit();
    }
}
?>


