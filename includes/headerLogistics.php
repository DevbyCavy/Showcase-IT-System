<?php
require_once __DIR__ . '/../php_action/auth_guard.php';
require_once __DIR__ . '/../php_action/db_connection.php';

$loggedUserId = $_SESSION['user_id'] ?? 0;
$notifCountStmt = $conn->prepare("SELECT COUNT(*) AS c FROM notifications WHERE recipient_id = ? AND seen_at IS NULL");
$notifCountStmt->bind_param("i", $loggedUserId);
$notifCountStmt->execute();
$unseenNotifCount = (int) $notifCountStmt->get_result()->fetch_assoc()['c'];
$notifCountStmt->close();
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
                
                

                <!-- Notifications -->
                <li class="nav-item dropdown" id="notifDropdown">
                    <a class="nav-link dropdown-toggle position-relative" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false" title="Notifications">
                        <i class="fas fa-bell"></i>
                        <?php if ($unseenNotifCount > 0): ?><span class="notif-badge-dot"></span><?php endif; ?>
                    </a>
                    <ul class="dropdown-menu dropdown-menu-end notif-menu" id="notifList" style="min-width:320px; max-height:380px; overflow-y:auto;">
                        <li class="text-center text-muted small py-3">Loading…</li>
                    </ul>
                </li>

                <!-- User Dropdown -->
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                        <i class="fas fa-user-circle"></i> <?php echo $_SESSION['username']; ?>
                    </a>
                    <ul class="dropdown-menu dropdown-menu-end">
                        <li><a class="dropdown-item" href="setting.php"><i class="fas fa-cog"></i> Settings</a></li>
                        <li><a class="dropdown-item" href="#" data-bs-toggle="modal" data-bs-target="#logoutConfirmModal"><i class="fas fa-sign-out-alt"></i> Logout</a></li>
                    </ul>
                </li>

            </ul>
        </div>
    </div>
</nav>

<!-- Logout Confirmation Modal -->
<div class="modal fade" id="logoutConfirmModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow">
            <div class="modal-header text-white" style="background:linear-gradient(135deg, var(--brand-orange,#F15A2C), var(--brand-orange-dark,#D94E22));">
                <h5 class="modal-title" style="color:#fff;"><i class="fas fa-arrow-right-from-bracket me-2"></i>Confirm Logout</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body text-center py-4">
                <p class="mb-0 fs-5"><i class="fas fa-sign-out-alt text-warning me-2"></i>Are you sure you want to log out?</p>
            </div>
            <div class="modal-footer justify-content-center">
                <button type="button" class="btn btn-secondary px-4" data-bs-dismiss="modal">Cancel</button>
                <a href="logout.php" class="btn btn-danger px-4"><i class="fas fa-arrow-right-from-bracket me-1"></i> Yes, Log Out</a>
            </div>
        </div>
    </div>
</div>

<!-- Bootstrap Bundle (with Popper) -->
<script src="assets/bootstrap/js/bootstrap.bundle.min.js"></script>
</body>
</html>
