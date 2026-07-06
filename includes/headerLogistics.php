<?php
require_once __DIR__ . '/../php_action/auth_guard.php';
?>


<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Stock Inventory Dashboard</title>

    <!-- Bootstrap 5 -->
    <link rel="stylesheet" href="assets/bootstrap.min.css">

    <!-- Font Awesome 6 -->
    <link rel="stylesheet" href="assets/font-awesome/css/all.min.css">

    <!-- DataTables & FileInput -->
    <link rel="stylesheet" href="assets/plugins/databases/datatables.min.css">
    <link rel="stylesheet" href="assets/plugins/fileinput/css/fileinput.min.css">

    <!-- Custom CSS -->
    <link rel="stylesheet" href="custom/custom.css">
</head>
<body>

<nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
    <div class="container-fluid">

        <!-- Brand -->
        <a class="navbar-brand d-flex align-items-center" href="dashboard.php">
            <img src="images/showcaseit_icon.png" alt="Logo" class="me-2" style="height:40px;">
            <span class="fw-bold text-dark">Showcase IT</span>
        </a>

        <!-- Mobile Toggler -->
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarMenu"
                aria-controls="navbarMenu" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
        </button>

        <!-- Navbar Links -->
        <div class="collapse navbar-collapse justify-content-end" id="navbarMenu">
            <ul class="navbar-nav align-items-center">

                <li class="nav-item">
                    <a class="nav-link" href="prod_teamDashboard.php"><i class="fas fa-tachometer-alt"></i> Dashboard</a>
                </li>

                <!-- Log Books Dropdown -->
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                        <i class="fas fa-file-alt"></i> Log Books
                    </a>
                   <ul class="dropdown-menu dropdown-menu-end">
                    <li>
                        <a class="dropdown-item" href="manageLogistics.php">
                            <i class="fas fa-plus-circle me-2 text-warning"></i>
                            Trip Log
                        </a>
                            </li>
                            <li>
                                <a class="dropdown-item" href="includes/vehicles/fuelLog.php">
                                    <i class="fas fa-plus-circle me-2 text-warning"></i>
                                    Fuel Log
                                </a>
                            </li>
                            <li>
                                <a class="dropdown-item" href="includes/vehicles/maintananceLog.php">
                                    <i class="fas fa-plus-circle me-2 text-warning"></i>
                                    Maintenance Log
                                </a>
                            </li>
                        </ul>
                </li>
                
                <li class="nav-item">
                    <a class="nav-link" href="includes/vehicles/vehicleDocuments.php"><i class="fas fa-tachometer-alt"></i> Documents</a>
                </li>
                
                <li class="nav-item">
                    <a class="nav-link" href="includes/vehicles/vehicleReport.php"><i class="fas fa-tachometer-alt"></i> Reports</a>
                </li>
                
                

                <!-- User Dropdown -->
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                        <i class="fas fa-user-circle"></i> <?php echo $_SESSION['username']; ?>
                    </a>
                    <ul class="dropdown-menu dropdown-menu-end">
                        <li><a class="dropdown-item" href="setting.php"><i class="fas fa-cog"></i> Settings</a></li>
                        <li><a class="dropdown-item" href="logout.php"><i class="fas fa-sign-out-alt"></i> Logout</a></li>
                    </ul>
                </li>

            </ul>
        </div>
    </div>
</nav>

<!-- Bootstrap Bundle (with Popper) -->
<script src="assets/bootstrap/js/bootstrap.bundle.min.js"></script>
</body>
</html>
