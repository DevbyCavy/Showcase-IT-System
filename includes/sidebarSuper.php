<?php
require_once __DIR__ . '/../php_action/auth_guard.php';
require_once __DIR__ . '/../php_action/db_connection.php';

$pendingReqCount = $conn->query("SELECT COUNT(*) AS c FROM requisitions WHERE status = 'Pending'")->fetch_assoc()['c'];
$pendingQuoCount = $conn->query("SELECT COUNT(*) AS c FROM quotations WHERE status = 'Pending'")->fetch_assoc()['c'];
$currentPage = basename($_SERVER['PHP_SELF']);

$pendingQuotes = $conn->query("
    SELECT quotation_id, quotation_number, customer_name, project_name, created_at
    FROM quotations
    WHERE status = 'Pending'
    ORDER BY created_at DESC
    LIMIT 5
");

$selfEmailStmt = $conn->prepare("SELECT email FROM users WHERE user_id = ?");
$loggedUserId = $_SESSION['user_id'] ?? 0;
$selfEmailStmt->bind_param("i", $loggedUserId);
$selfEmailStmt->execute();
$selfEmail = $selfEmailStmt->get_result()->fetch_assoc()['email'] ?? '';
$selfEmailStmt->close();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($pageTitle ?? 'Super Admin Dashboard') ?> - Showcase IT</title>

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
            <a href="superDashboard.php" class="<?= $currentPage === 'superDashboard.php' ? 'active' : '' ?>">
                <i class="fas fa-grip"></i> Dashboard
            </a>
            <a href="storesManagement.php" class="<?= $currentPage === 'storesManagement.php' ? 'active' : '' ?>">
                <i class="fas fa-store"></i> Stores
            </a>
            <a href="manageOrder.php" class="<?= $currentPage === 'manageOrder.php' ? 'active' : '' ?>">
                <i class="fas fa-clipboard-list"></i> Manage Orders
            </a>
            <a href="processRequisitions.php" class="<?= $currentPage === 'processRequisitions.php' ? 'active' : '' ?>">
                <i class="fas fa-file-signature"></i> Requisitions
                <?php if ($pendingReqCount > 0): ?>
                    <span class="nav-badge"><?= $pendingReqCount ?></span>
                <?php endif; ?>
            </a>
            <a href="processQuotations.php" class="<?= $currentPage === 'processQuotations.php' ? 'active' : '' ?>">
                <i class="fas fa-file-invoice-dollar"></i> Quotations
                <?php if ($pendingQuoCount > 0): ?>
                    <span class="nav-badge"><?= $pendingQuoCount ?></span>
                <?php endif; ?>
            </a>
            <a href="IssueProductReport.php?o=add" class="<?= $currentPage === 'IssueProductReport.php' ? 'active' : '' ?>">
                <i class="fas fa-file-alt"></i> Reports
            </a>
            <a href="manage_users.php" class="<?= $currentPage === 'manage_users.php' ? 'active' : '' ?>">
                <i class="fas fa-users-cog"></i> Users
            </a>
        </nav>

        <div class="sidebar-footer">
            <a href="signup.php"><i class="fas fa-user-plus"></i> Add New User</a>
            <a href="logout.php"><i class="fas fa-arrow-right-from-bracket"></i> Logout</a>
        </div>
    </aside>

    <main class="app-main">

        <div class="app-topbar">
            <div class="topbar-search">
                <i class="fas fa-search"></i>
                <input type="text" id="globalSearch" placeholder="Search orders, requisitions...">
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
                <div class="dropdown d-inline-block">
                    <a href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false" title="Notifications">
                        <i class="fas fa-bell"></i>
                        <?php if ($pendingQuoCount > 0 || $pendingReqCount > 0): ?><span class="icon-dot"></span><?php endif; ?>
                    </a>
                    <ul class="dropdown-menu dropdown-menu-end" style="min-width:300px;">
                        <li><h6 class="dropdown-header">New Quotations</h6></li>
                        <?php if ($pendingQuotes && $pendingQuotes->num_rows > 0): ?>
                            <?php while ($pq = $pendingQuotes->fetch_assoc()): ?>
                                <li>
                                    <a class="dropdown-item" href="processQuotations.php">
                                        <div class="fw-semibold"><?= htmlspecialchars($pq['quotation_number']) ?> — <?= htmlspecialchars($pq['customer_name']) ?></div>
                                        <?php if ($pq['project_name']): ?>
                                            <div class="small text-muted"><?= htmlspecialchars($pq['project_name']) ?></div>
                                        <?php endif; ?>
                                    </a>
                                </li>
                            <?php endwhile; ?>
                        <?php else: ?>
                            <li><span class="dropdown-item-text text-muted small">No pending quotations</span></li>
                        <?php endif; ?>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item" href="processQuotations.php"><i class="fas fa-arrow-right me-1"></i>View all quotations</a></li>
                        <?php if ($pendingReqCount > 0): ?>
                            <li><hr class="dropdown-divider"></li>
                            <li>
                                <a class="dropdown-item" href="processRequisitions.php">
                                    <i class="fas fa-file-signature me-1"></i><?= $pendingReqCount ?> pending requisition<?= $pendingReqCount > 1 ? 's' : '' ?>
                                </a>
                            </li>
                        <?php endif; ?>
                    </ul>
                </div>
            </div>
        </div>
