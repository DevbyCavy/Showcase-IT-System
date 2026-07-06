<?php
session_start();
require_once __DIR__ . '/../../php_action/db_connection.php';

$message = '';

/*
|--------------------------------------------------------------------------
| SAVE FUEL ENTRY
|--------------------------------------------------------------------------
*/

if(isset($_POST['save_fuel'])){

    $vehicle_id       = (int)$_POST['vehicle_id'];
    $fuel_date        = $_POST['fuel_date'];
    $odometer_reading = (float)$_POST['odometer_reading'];
    $litres           = (float)$_POST['litres'];
    $fuel_cost        = (float)$_POST['fuel_cost'];
    $fuel_station     = trim($_POST['fuel_station']);
    $receipt_number   = trim($_POST['receipt_number']);
    $notes            = trim($_POST['notes']);

    $stmt = $conn->prepare("
        INSERT INTO fuel_logs
        (
            vehicle_id,
            fuel_date,
            odometer_reading,
            litres,
            fuel_cost,
            fuel_station,
            receipt_number,
            notes
        )
        VALUES
        (
            ?,?,?,?,?,?,?,?
        )
    ");

    $stmt->bind_param(
        "isdddsss",
        $vehicle_id,
        $fuel_date,
        $odometer_reading,
        $litres,
        $fuel_cost,
        $fuel_station,
        $receipt_number,
        $notes
    );

    if($stmt->execute()){

        $message =
        '<div class="alert alert-success">
            Fuel entry saved successfully.
        </div>';

    } else {

        $message =
        '<div class="alert alert-danger">
            Failed to save fuel entry.
        </div>';
    }
}

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

$totalFuelEntries =
$conn->query("
SELECT COUNT(*) total
FROM fuel_logs
")->fetch_assoc()['total'];

$totalLitres =
$conn->query("
SELECT IFNULL(SUM(litres),0) total
FROM fuel_logs
")->fetch_assoc()['total'];

$totalFuelCost =
$conn->query("
SELECT IFNULL(SUM(fuel_cost),0) total
FROM fuel_logs
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
    margin: 10px 20px;
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
                    Fuel Log
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
                
                    <h6>Total Entries</h6>
                    
                    <h3><?= $totalFuelEntries ?></h3>
                
                </div>
                
                </div>
                
                </div>
                
                <div class="col-md-4">
                
                    <div class="card shadow-sm">
                    
                            <div class="card-body">
                            
                            <h6>Total Litres</h6>
                            
                            <h3><?= number_format($totalLitres,2) ?></h3>
                        
                        </div>
                    
                    </div>
                
                </div>
                
                <div class="col-md-4">
                
                <div class="card shadow-sm">
                
                <div class="card-body">
                
                <h6>Total Fuel Cost</h6>
                
                <h3>$<?= number_format($totalFuelCost,2) ?></h3>
                
                </div>
            
            </div>
        
        </div>
    
    </div>
    
    <div class="card shadow-sm mb-4">

    <div class="card-header">

        <h5 class="mb-0">

            <i class="fas fa-gas-pump me-2"></i>

            Add Fuel Entry

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

                        <?php foreach($vehicles as $v): ?>

                        <option
                            value="<?= $v['vehicle_id'] ?>">

                            <?= $v['registration_number'] ?>
                            -
                            <?= $v['make'] ?>
                            <?= $v['model'] ?>

                        </option>

                        <?php endforeach; ?>

                    </select>

                </div>

                <div class="col-md-4 mb-3">

                    <label>Fuel Date</label>

                    <input
                        type="date"
                        name="fuel_date"
                        class="form-control"
                        required>

                </div>

                <div class="col-md-4 mb-3">

                    <label>Odometer Reading</label>

                    <input
                        type="number"
                        step="0.01"
                        name="odometer_reading"
                        class="form-control"
                        required>

                </div>

                <div class="col-md-3 mb-3">

                    <label>Litres</label>

                    <input
                        type="number"
                        step="0.01"
                        name="litres"
                        class="form-control"
                        required>

                </div>

                <div class="col-md-3 mb-3">

                    <label>Fuel Cost</label>

                    <input
                        type="number"
                        step="0.01"
                        name="fuel_cost"
                        class="form-control"
                        required>

                </div>

                <div class="col-md-3 mb-3">

                    <label>Fuel Station</label>

                    <input
                        type="text"
                        name="fuel_station"
                        class="form-control">

                </div>

                <div class="col-md-3 mb-3">

                    <label>Receipt Number</label>

                    <input
                        type="text"
                        name="receipt_number"
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
                class="btn btn-success"
                name="save_fuel">

                Save Fuel Entry

            </button>

        </form>

    </div>

</div>

<script src="assets/bootstrap/js/bootstrap.bundle.min.js"></script>

</body>
</html>