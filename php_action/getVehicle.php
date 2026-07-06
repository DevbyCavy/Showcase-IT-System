<?php

require_once 'db_connection.php';

if(isset($_GET['id'])){

    $id = (int)$_GET['id'];

    $stmt = $conn->prepare("
        SELECT *
        FROM vehicles
        WHERE vehicle_id = ?
    ");

    $stmt->bind_param("i", $id);
    $stmt->execute();

    $result = $stmt->get_result();

    echo json_encode(
        $result->fetch_assoc()
    );
}