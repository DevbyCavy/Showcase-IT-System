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
    <link rel="stylesheet" href="assets/bootstrap/css/bootstrap.min.css">

    <!-- Font Awesome 6 -->
    <link rel="stylesheet" href="assets/font-awesome/css/all.min.css">

    <!-- DataTables & FileInput -->
    <link rel="stylesheet" href="assets/plugins/databases/datatables.min.css">
    <link rel="stylesheet" href="assets/plugins/fileinput/css/fileinput.min.css">

    <!-- Custom CSS -->
    <link rel="stylesheet" href="custom/custom.css">

    <!-- jQuery (needed for some plugins) -->
    <script src="assets/jquery/jquery.min.js"></script>

    <!-- Bootstrap Bundle (includes Popper) -->
    <script src="assets/bootstrap/js/bootstrap.bundle.min.js"></script>
</head>

<body>

<nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm mb-4">
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
                    <a class="nav-link" href="<?= ($_SESSION['user_type'] ?? '') === 'Marketer' ? 'marketingDashboard.php' : 'superDashboard.php' ?>">
                        <i class="fas fa-tachometer-alt"></i> Dashboard
                    </a>
                </li>

                <li class="nav-item">
                    <a class="nav-link" href="storesManagement.php">
                        <i class="fas fa-circle-plus"></i> Store
                    </a>
                </li>

                <li class="nav-item">
                    <a class="nav-link" href="manageOrder.php">
                        <i class="fas fa-circle-plus"></i> Manage Orders
                    </a>
                </li>

                <?php if (($_SESSION['user_type'] ?? '') === 'Marketer'): ?>
                <li class="nav-item">
                    <a class="nav-link" href="makeQuotation.php">
                        <i class="fas fa-file-invoice-dollar"></i> Make Quotation
                    </a>
                </li>
                <?php endif; ?>

                <!-- Requisitions Dropdown -->
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                        <i class="fas fa-file-signature"></i> Requisitions
                        <?php
                        // Show pending badge count to Super Admin
                        if (($_SESSION['user_type'] ?? '') === 'Super Admin') {
                            require_once __DIR__ . '/../php_action/db_connection.php';
                            $pendingCount = $conn->query("SELECT COUNT(*) AS c FROM requisitions WHERE status = 'Pending'")->fetch_assoc()['c'];
                            if ($pendingCount > 0):
                        ?>
                            <span class="badge rounded-pill ms-1"
                                  style="background:#ff3b3b; font-size:0.7rem;">
                                <?= $pendingCount ?>
                            </span>
                        <?php endif; } ?>
                    </a>
                    <ul class="dropdown-menu dropdown-menu-end">
                        <li>
                            <a class="dropdown-item" href="requisitions.php">
                                <i class="fas fa-plus-circle me-2 text-warning"></i>
                                Submit Requisition
                            </a>
                        </li>
                        <?php if (($_SESSION['user_type'] ?? '') === 'Super Admin'): ?>
                        <li><hr class="dropdown-divider"></li>
                        <li>
                            <a class="dropdown-item" href="processRequisitions.php">
                                <i class="fas fa-tasks me-2 text-success"></i>
                                Process Requisitions
                                <?php if ($pendingCount > 0): ?>
                                    <span class="badge ms-1"
                                          style="background:#ff3b3b; font-size:0.7rem;">
                                        <?= $pendingCount ?>
                                    </span>
                                <?php endif; ?>
                            </a>
                        </li>
                        <?php endif; ?>
                    </ul>
                </li>

                <!-- Reports Dropdown -->
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                        <i class="fas fa-file-alt"></i> Reports
                    </a>
                    <ul class="dropdown-menu dropdown-menu-end">
                        <li>
                            <a class="dropdown-item" href="IssueProductReport.php?o=add">
                                <i class="fas fa-list"></i> Products Report
                            </a>
                        </li>
                    </ul>
                </li>

                <!-- User Dropdown -->
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                        <i class="fas fa-user-circle"></i> <?= htmlspecialchars($_SESSION['username']) ?>
                    </a>
                    <ul class="dropdown-menu dropdown-menu-end">
                        <li><a class="dropdown-item" href="signup.php"><i class="fas fa-user-plus"></i> Add New User</a></li>
                        <li><a class="dropdown-item" href="manage_users.php"><i class="fas fa-cog"></i> Manage Users</a></li>
                        <li><a class="dropdown-item" href="logout.php"><i class="fas fa-sign-out-alt"></i> Logout</a></li>
                    </ul>
                </li>

            </ul>
        </div>
    </div>
</nav>
