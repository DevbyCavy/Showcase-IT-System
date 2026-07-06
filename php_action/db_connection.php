<?php
// Database connection settings
$servername = "localhost";
$username   = "root";   
$password   = "";       
$dbname     = "stock";  

// Enable MySQLi error reporting (important for debugging)
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

try {
    // Create connection using MySQLi object-oriented
    $conn = new mysqli($servername, $username, $password, $dbname);

    // Set charset to prevent encoding issues & SQL injection edge cases
    $conn->set_charset("utf8mb4");

} catch (Exception $e) {
    // Log error (optional but recommended)
    error_log("Database Connection Error: " . $e->getMessage());

    // Generic error message for security
    die("Database connection failed. Please try again later.");
}
?>

