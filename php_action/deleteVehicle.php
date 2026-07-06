<?php

session_start();
require_once 'db_connection.php';

if(isset($_GET['id'])) {

    $vehicle_id = (int)$_GET['id'];

    $stmt = $conn->prepare("
        DELETE FROM vehicles
        WHERE vehicle_id = ?
    ");

    $stmt->bind_param("i", $vehicle_id);

    $stmt->execute();

    $stmt->close();
}

header("Location: ../manageLogistics.php");
exit;