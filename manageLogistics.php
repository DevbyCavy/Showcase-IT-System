<?php
session_start();
require_once 'php_action/db_connection.php';
?>

<!DOCTYPE html>
<html lang="en">
<head>

<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">

<title>Logistics Management</title>

<link rel="stylesheet" href="assets/bootstrap/css/bootstrap.min.css">
<link rel="stylesheet" href="assets/font-awesome/css/all.min.css">

<style>

body{
    background:#f5f6fa;
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

<div class="container-fluid p-4">

    <!-- Breadcrumb -->

    <div class="card module-card mb-3">

        <div class="card-body">

            <nav aria-label="breadcrumb">

                <ol class="breadcrumb mb-0">

                    <li class="breadcrumb-item">
                        <a href="dashboard.php">Home</a>
                    </li>

                    <li class="breadcrumb-item active">
                        Logistics Management
                    </li>

                </ol>

            </nav>

        </div>

    </div>

    <!-- Page Title -->

    <h3 class="fw-bold mb-3">

        <i class="fas fa-truck me-2"></i>

        Logistics Management

    </h3>

    <!-- Tabs -->

    <ul class="nav nav-tabs modern-tabs">

        <li class="nav-item">
            <button class="nav-link modern-tab-btn active"
                    data-bs-toggle="tab"
                    data-bs-target="#dashboard">
                Dashboard
            </button>
        </li>

        <li class="nav-item">
            <button class="nav-link modern-tab-btn"
                    data-bs-toggle="tab"
                    data-bs-target="#vehicles">
                Vehicle Register
            </button>
        </li>

        <li class="nav-item">
            <button class="nav-link modern-tab-btn"
                    data-bs-toggle="tab"
                    data-bs-target="#trips">
                Trip Logbook
            </button>
        </li>

    <!-- Tab Content -->

    <div class="tab-content mt-3">

        <!-- Dashboard -->

        <div class="tab-pane fade show active"
             id="dashboard">

            <?php include 'includes/logisticsDashboard.php'; ?>

        </div>

        <!-- Vehicle Register -->

        <div class="tab-pane fade"
             id="vehicles">

            <?php include 'includes/vehicles/vehicleRegister.php'; ?>

        </div>

        <!-- Trip Logbook -->

        <div class="tab-pane fade"
             id="trips">

            <?php include 'includes/vehicles/tripLogbook.php'; ?>

        </div>

    </div>

</div>

<script src="assets/bootstrap/js/bootstrap.bundle.min.js"></script>

</body>
</html>