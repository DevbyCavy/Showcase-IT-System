<?php
require_once 'db_connection.php';

$result = $conn->query("SELECT user_id, password FROM users WHERE LENGTH(password) = 32");
while ($user = $result->fetch_assoc()) {
    // Only migrate MD5 passwords (32 characters)
    if (preg_match('/^[a-f0-9]{32}$/', $user['password'])) {
        // Re-hash with password_hash
        $new_hash = password_hash($user['password'], PASSWORD_DEFAULT);
        
        $update_stmt = $conn->prepare("UPDATE users SET password = ? WHERE user_id = ?");
        $update_stmt->bind_param("si", $new_hash, $user['user_id']);
        $update_stmt->execute();
        $update_stmt->close();
        
        echo "Migrated user ID: " . $user['user_id'] . "<br>";
    }
}
echo "Migration complete!";
?>