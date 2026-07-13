<?php
require_once __DIR__ . '/../php_action/auth_guard.php';
require_once __DIR__ . '/../php_action/db_connection.php';

$loggedUserId = $_SESSION['user_id'] ?? 0;
$currentPage = basename($_SERVER['PHP_SELF']);

$selfEmailStmt = $conn->prepare("SELECT email FROM users WHERE user_id = ?");
$selfEmailStmt->bind_param("i", $loggedUserId);
$selfEmailStmt->execute();
$selfEmail = $selfEmailStmt->get_result()->fetch_assoc()['email'] ?? '';
$selfEmailStmt->close();

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
    <title><?= htmlspecialchars($pageTitle ?? 'Logistics Dashboard') ?> - Showcase IT</title>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap">

    <!-- Bootstrap 5 -->
    <link rel="stylesheet" href="assets/bootstrap/css/bootstrap.min.css">

    <!-- Font Awesome 6 -->
    <link rel="stylesheet" href="assets/font-awesome/css/all.min.css">

    <!-- DataTables & FileInput -->
    <link rel="stylesheet" href="assets/plugins/databases/datatables.min.css">
    <link rel="stylesheet" href="assets/plugins/fileinput/css/fileinput.min.css">

    <!-- Custom CSS -->
    <link rel="stylesheet" href="custom/css/custom.css">
    <link rel="stylesheet" href="custom/css/modern-dashboard.css">

    <!-- jQuery (needed for some plugins) -->
    <script src="assets/jquery/jquery.min.js"></script>

    <!-- Bootstrap Bundle (includes Popper) -->
    <script src="assets/bootstrap/js/bootstrap.bundle.min.js"></script>
</head>
<body class="modern-dash">

<button class="sidebar-toggle-btn" id="sidebarToggle"><i class="fas fa-bars"></i></button>

<div class="app-shell">

    <aside class="app-sidebar" id="appSidebar">
        <div class="sidebar-brand">
            <img src="images/showcaseit_icon.png" alt="Showcase IT">
            <span>Showcase <strong>IT</strong></span>
        </div>

        <nav class="sidebar-nav">
            <a href="logisticsDashboard.php" class="<?= $currentPage === 'logisticsDashboard.php' ? 'active' : '' ?>">
                <i class="fas fa-grip"></i> Dashboard
            </a>
            <a href="manageLogistics.php" class="<?= $currentPage === 'manageLogistics.php' ? 'active' : '' ?>">
                <i class="fas fa-truck"></i> Fleet Management
            </a>
            <a href="fuelLog.php" class="<?= $currentPage === 'fuelLog.php' ? 'active' : '' ?>">
                <i class="fas fa-gas-pump"></i> Fuel Log
            </a>
            <a href="maintananceLog.php" class="<?= $currentPage === 'maintananceLog.php' ? 'active' : '' ?>">
                <i class="fas fa-screwdriver-wrench"></i> Maintenance Log
            </a>
            <a href="vehicleDocuments.php" class="<?= $currentPage === 'vehicleDocuments.php' ? 'active' : '' ?>">
                <i class="fas fa-file-shield"></i> Documents
            </a>
        </nav>

        <div class="sidebar-footer">
            <a href="setting.php"><i class="fas fa-cog"></i> Settings</a>
            <a href="#" data-bs-toggle="modal" data-bs-target="#logoutConfirmModal"><i class="fas fa-arrow-right-from-bracket"></i> Logout</a>
        </div>
    </aside>

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

    <main class="app-main">

        <div class="app-topbar">
            <div class="topbar-search">
                <i class="fas fa-search"></i>
                <input type="text" id="globalSearch" placeholder="Search orders, vehicles, shipments...">
            </div>
            <div class="topbar-icons">
                <?php if ($selfEmail): ?>
                    <a href="mailto:<?= htmlspecialchars($selfEmail) ?>" title="Email <?= htmlspecialchars($selfEmail) ?>">
                        <i class="fas fa-comment-dots"></i>
                    </a>
                <?php else: ?>
                    <a href="#" title="No email on file" onclick="return false;">
                        <i class="fas fa-comment-dots"></i>
                    </a>
                <?php endif; ?>
                <div class="dropdown d-inline-block" id="notifDropdown">
                    <a href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false" title="Notifications">
                        <i class="fas fa-bell"></i>
                        <?php if ($unseenNotifCount > 0): ?><span class="icon-dot"></span><?php endif; ?>
                    </a>
                    <ul class="dropdown-menu dropdown-menu-end notif-menu" id="notifList" style="min-width:320px; max-height:380px; overflow-y:auto;">
                        <li class="text-center text-muted small py-3">Loading…</li>
                    </ul>
                </div>
                <a href="setting.php" title="Account Settings">
                    <i class="fas fa-gear"></i>
                </a>
            </div>
        </div>
