<?php

require_once 'db_connection.php';

$id = (int)$_GET['id'];

$stmt = $conn->prepare("
    SELECT
        v.*,
        CONCAT(u.name,' ',u.surname) AS assigned_name
    FROM vehicles v
    LEFT JOIN users u
        ON u.user_id = v.assigned_user
    WHERE vehicle_id = ?
");

$stmt->bind_param("i", $id);
$stmt->execute();

$result = $stmt->get_result();
$row = $result->fetch_assoc();

?>

<div class="row">

    <div class="col-md-6 mb-2">
        <strong>Registration:</strong><br>
        <?= htmlspecialchars($row['registration_number']) ?>
    </div>

    <div class="col-md-6 mb-2">
        <strong>Vehicle:</strong><br>
        <?= htmlspecialchars($row['make']) ?>
        <?= htmlspecialchars($row['model']) ?>
    </div>

    <div class="col-md-6 mb-2">
        <strong>Year:</strong><br>
        <?= htmlspecialchars($row['vehicle_year']) ?>
    </div>

    <div class="col-md-6 mb-2">
        <strong>Colour:</strong><br>
        <?= htmlspecialchars($row['color']) ?>
    </div>

    <div class="col-md-6 mb-2">
        <strong>Fuel Type:</strong><br>
        <?= htmlspecialchars($row['fuel_type']) ?>
    </div>

    <div class="col-md-6 mb-2">
        <strong>Status:</strong><br>
        <?= htmlspecialchars($row['status']) ?>
    </div>

    <div class="col-md-6 mb-2">
        <strong>Department:</strong><br>
        <?= htmlspecialchars($row['department']) ?>
    </div>

    <div class="col-md-6 mb-2">
        <strong>Assigned User:</strong><br>
        <?= htmlspecialchars($row['assigned_name']) ?>
    </div>

    <div class="col-md-12 mt-3">
        <strong>Notes:</strong><br>
        <?= nl2br(htmlspecialchars($row['notes'])) ?>
    </div>

</div>