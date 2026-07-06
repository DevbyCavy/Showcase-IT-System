<?php

require_once __DIR__ . '/../../php_action/db_connection.php';

$message = '';

if(isset($_POST['save_maintenance'])){

    $vehicle_id            = (int)$_POST['vehicle_id'];
    $maintenance_type      = trim($_POST['maintenance_type']);
    $service_provider      = trim($_POST['service_provider']);
    $service_date          = $_POST['service_date'];
    $odometer_reading      = (float)$_POST['odometer_reading'];
    $service_cost          = (float)$_POST['service_cost'];
    $next_service_date     = $_POST['next_service_date'];
    $next_service_odometer = (float)$_POST['next_service_odometer'];
    $notes                 = trim($_POST['notes']);

    $stmt = $conn->prepare("
        INSERT INTO maintenance_logs
        (
            vehicle_id,
            maintenance_type,
            service_provider,
            service_date,
            odometer_reading,
            service_cost,
            next_service_date,
            next_service_odometer,
            notes
        )
        VALUES
        (
            ?,?,?,?,?,?,?,?,?
        )
    ");

    $stmt->bind_param(
        "isssddsss",
        $vehicle_id,
        $maintenance_type,
        $service_provider,
        $service_date,
        $odometer_reading,
        $service_cost,
        $next_service_date,
        $next_service_odometer,
        $notes
    );

    if($stmt->execute()){

        $message =
        '<div class="alert alert-success">
            Maintenance record saved successfully.
        </div>';

    }else{

        $message =
        '<div class="alert alert-danger">
            Failed to save maintenance record.
        </div>';
    }
}
?>

<?php

$vehicles = [];

$result = $conn->query("
    SELECT
        vehicle_id,
        registration_number,
        make,
        model
    FROM vehicles
    ORDER BY registration_number
");

while($row = $result->fetch_assoc()){
    $vehicles[] = $row;
}
?>

<?php

$totalMaintenance =
$conn->query("
SELECT COUNT(*) total
FROM maintenance_logs
")->fetch_assoc()['total'];

$totalCost =
$conn->query("
SELECT IFNULL(SUM(service_cost),0) total
FROM maintenance_logs
")->fetch_assoc()['total'];

$dueServices =
$conn->query("
SELECT COUNT(*) total
FROM maintenance_logs
WHERE next_service_date <= DATE_ADD(CURDATE(),INTERVAL 30 DAY)
")->fetch_assoc()['total'];

?>


<!DOCTYPE html>
<html lang="en">
<head>

<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">

<title>Logistics Management</title>

<link rel="stylesheet" href="/../../assets/bootstrap/css/bootstrap.min.css">
<link rel="stylesheet" href="/../../assets/font-awesome/css/all.min.css">

<style>

body{
    background:#f5f6fa;
    margin:10px 20px;
}

.module-card{
    border:none;
    border-radius:12px;
    box-shadow:0 3px 12px rgba(0,0,0,.08);
}

.modern-tabs{
    border-bottom:none;
}

.modern-tab-btn{
    border:none !important;
    margin-right:5px;
    border-radius:10px 10px 0 0 !important;
    background:#e9ecef;
    color:#333;
    font-weight:600;
}

.modern-tab-btn.active{
    background:#ff7b00 !important;
    color:#fff !important;
}

</style>

</head>

<body>

<?php include 'includes/headerLogistics.php'; ?>
    
<!-- Breadcrumb -->

<div class="card module-card mb-3">

    <div class="card-body">

        <nav aria-label="breadcrumb">

            <ol class="breadcrumb mb-0">

                <li class="breadcrumb-item">
                    <a href="logisticsDashboard.php">Home</a>
                </li>

                <li class="breadcrumb-item active">
                    Maintenance Log
                </li>

            </ol>

        </nav>

    </div>

</div>

<!-- Page Title -->

<h3 class="fw-bold mb-3">

    <i class="fas fa-truck me-2"></i>

    Fuel Log

</h3>


<div class="row mb-4">

<div class="col-md-4">

<div class="card shadow-sm">

<div class="card-body">

<h6>Total Services</h6>

<h3><?= $totalMaintenance ?></h3>

</div>

</div>

</div>

<div class="col-md-4">

<div class="card shadow-sm">

<div class="card-body">

<h6>Total Maintenance Cost</h6>

<h3>$<?= number_format($totalCost,2) ?></h3>

</div>

</div>

</div>

<div class="col-md-4">

<div class="card shadow-sm">

<div class="card-body">

<h6>Services Due Soon</h6>

<h3><?= $dueServices ?></h3>

</div>

</div>

</div>

</div>


<div class="card shadow-sm">

<div class="card-header">

<h5 class="mb-0">

<i class="fas fa-tools me-2"></i>

Maintenance Log

</h5>

</div>

<div class="card-body">

<?= $message ?>

<form method="POST">

<div class="row">

<div class="col-md-4 mb-3">

<label>Vehicle</label>

<select
name="vehicle_id"
class="form-select"
required>

<option value="">
Select Vehicle
</option>

<?php foreach($vehicles as $vehicle): ?>

<option value="<?= $vehicle['vehicle_id'] ?>">

<?= $vehicle['registration_number'] ?>
-
<?= $vehicle['make'] ?>
<?= $vehicle['model'] ?>

</option>

<?php endforeach; ?>

</select>

</div>

<div class="col-md-4 mb-3">

<label>Maintenance Type</label>

<select
name="maintenance_type"
class="form-select"
required>

<option value="">
Select Type
</option>

<option>Service</option>
<option>Oil Change</option>
<option>Tyre Replacement</option>
<option>Brake Repair</option>
<option>Engine Repair</option>
<option>Accident Repair</option>
<option>Other</option>

</select>

</div>

<div class="col-md-4 mb-3">

<label>Service Provider</label>

<input
type="text"
name="service_provider"
class="form-control">

</div>

<div class="col-md-3 mb-3">

<label>Service Date</label>

<input
type="date"
name="service_date"
class="form-control"
required>

</div>

<div class="col-md-3 mb-3">

<label>Odometer</label>

<input
type="number"
step="0.01"
name="odometer_reading"
class="form-control">

</div>

<div class="col-md-3 mb-3">

<label>Service Cost</label>

<input
type="number"
step="0.01"
name="service_cost"
class="form-control">

</div>

<div class="col-md-3 mb-3">

<label>Next Service Date</label>

<input
type="date"
name="next_service_date"
class="form-control">

</div>

<div class="col-md-6 mb-3">

<label>Next Service Odometer</label>

<input
type="number"
step="0.01"
name="next_service_odometer"
class="form-control">

</div>

<div class="col-md-12 mb-3">

<label>Notes</label>

<textarea
name="notes"
class="form-control"></textarea>

</div>

</div>

<button
class="btn btn-warning"
name="save_maintenance">

Save Maintenance Record

</button>

</form>

</div>

</div>


<?php

$history = $conn->query("
SELECT
    m.*,
    v.registration_number
FROM maintenance_logs m
INNER JOIN vehicles v
ON m.vehicle_id = v.vehicle_id
ORDER BY m.service_date DESC
");
?>

<div class="card shadow-sm mt-4">

<div class="card-header">

Maintenance History

</div>

<div class="card-body">

<table class="table table-bordered table-striped">

<thead>

<tr>

<th>Date</th>
<th>Vehicle</th>
<th>Type</th>
<th>Provider</th>
<th>Cost</th>
<th>Next Service</th>

</tr>

</thead>

<tbody>

<?php while($row = $history->fetch_assoc()): ?>

<tr>

<td><?= $row['service_date'] ?></td>

<td><?= $row['registration_number'] ?></td>

<td><?= $row['maintenance_type'] ?></td>

<td><?= $row['service_provider'] ?></td>

<td>$<?= number_format($row['service_cost'],2) ?></td>

<td><?= $row['next_service_date'] ?></td>

</tr>

<?php endwhile; ?>

</tbody>

</table>

</div>

</div>

<script src="assets/bootstrap/js/bootstrap.bundle.min.js"></script>

</body>
</html>
