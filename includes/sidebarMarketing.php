<?php
require_once __DIR__ . '/../php_action/auth_guard.php';
require_once __DIR__ . '/../php_action/db_connection.php';

$loggedUserId = $_SESSION['user_id'] ?? 0;
$currentPage = basename($_SERVER['PHP_SELF']);

$myPendingReqStmt = $conn->prepare("SELECT COUNT(*) AS c FROM requisitions WHERE submitted_by = ? AND status = 'Pending'");
$myPendingReqStmt->bind_param("i", $loggedUserId);
$myPendingReqStmt->execute();
$myPendingReqCount = $myPendingReqStmt->get_result()->fetch_assoc()['c'];
$myPendingReqStmt->close();

$myPendingQuoStmt = $conn->prepare("SELECT COUNT(*) AS c FROM quotations WHERE submitted_by = ? AND status = 'Pending'");
$myPendingQuoStmt->bind_param("i", $loggedUserId);
$myPendingQuoStmt->execute();
$myPendingQuoCount = $myPendingQuoStmt->get_result()->fetch_assoc()['c'];
$myPendingQuoStmt->close();

$myPendingJobStmt = $conn->prepare("SELECT COUNT(*) AS c FROM design_jobs WHERE marketer_id = ? AND status = 'Submitted'");
$myPendingJobStmt->bind_param("i", $loggedUserId);
$myPendingJobStmt->execute();
$myPendingJobCount = $myPendingJobStmt->get_result()->fetch_assoc()['c'];
$myPendingJobStmt->close();

$myPendingMemoStmt = $conn->prepare("SELECT COUNT(*) AS c FROM memos WHERE created_by = ? AND status = 'Pending'");
$myPendingMemoStmt->bind_param("i", $loggedUserId);
$myPendingMemoStmt->execute();
$myPendingMemoCount = $myPendingMemoStmt->get_result()->fetch_assoc()['c'];
$myPendingMemoStmt->close();

$dueMemosStmt = $conn->prepare("
    SELECT memo_id, title, description, due_date FROM memos
    WHERE created_by = ? AND status = 'Pending' AND acknowledged_at IS NULL AND due_date <= NOW()
    ORDER BY due_date ASC
");
$dueMemosStmt->bind_param("i", $loggedUserId);
$dueMemosStmt->execute();
$dueMemos = $dueMemosStmt->get_result()->fetch_all(MYSQLI_ASSOC);
$dueMemosStmt->close();

$selfEmailStmt = $conn->prepare("SELECT email FROM users WHERE user_id = ?");
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
    <title><?= htmlspecialchars($pageTitle ?? 'Marketer Dashboard') ?> - Showcase IT</title>

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
            <a href="marketingDashboard.php" class="<?= $currentPage === 'marketingDashboard.php' ? 'active' : '' ?>">
                <i class="fas fa-grip"></i> Dashboard
            </a>
            <a href="manageOrder.php" class="<?= $currentPage === 'manageOrder.php' ? 'active' : '' ?>">
                <i class="fas fa-clipboard-list"></i> Manage Orders
            </a>
            <a href="makeQuotation.php" class="<?= $currentPage === 'makeQuotation.php' ? 'active' : '' ?>">
                <i class="fas fa-file-invoice-dollar"></i> Make Quotation
                <?php if ($myPendingQuoCount > 0): ?>
                    <span class="nav-badge"><?= $myPendingQuoCount ?></span>
                <?php endif; ?>
            </a>
            <a href="requisitions.php" class="<?= $currentPage === 'requisitions.php' ? 'active' : '' ?>">
                <i class="fas fa-file-signature"></i> Requisitions
                <?php if ($myPendingReqCount > 0): ?>
                    <span class="nav-badge"><?= $myPendingReqCount ?></span>
                <?php endif; ?>
            </a>
            <a href="assignDesignJob.php" class="<?= $currentPage === 'assignDesignJob.php' ? 'active' : '' ?>">
                <i class="fas fa-pen-ruler"></i> Design Jobs
                <?php if ($myPendingJobCount > 0): ?>
                    <span class="nav-badge"><?= $myPendingJobCount ?></span>
                <?php endif; ?>
            </a>
            <a href="memos.php" class="<?= $currentPage === 'memos.php' ? 'active' : '' ?>">
                <i class="fas fa-note-sticky"></i> Memos
                <?php if ($myPendingMemoCount > 0): ?>
                    <span class="nav-badge"><?= $myPendingMemoCount ?></span>
                <?php endif; ?>
            </a>
        </nav>

        <div class="sidebar-footer">
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

    <!-- Due Memos Reminder Modal -->
    <div class="modal fade" id="dueMemosModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content border-0 shadow">
                <div class="modal-header text-white" style="background:linear-gradient(135deg, var(--brand-orange,#F15A2C), var(--brand-orange-dark,#D94E22));">
                    <h5 class="modal-title" style="color:#fff;"><i class="fas fa-bell me-2"></i>Reminder<?= count($dueMemos) > 1 ? 's' : '' ?></h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body py-4">
                    <?php foreach ($dueMemos as $dm): ?>
                        <div class="mb-3 pb-3 border-bottom">
                            <p class="fw-bold mb-1"><i class="fas fa-note-sticky me-2 text-warning"></i><?= htmlspecialchars($dm['title']) ?></p>
                            <?php if (!empty($dm['description'])): ?>
                                <p class="mb-1 text-muted"><?= nl2br(htmlspecialchars($dm['description'])) ?></p>
                            <?php endif; ?>
                            <p class="mb-0 small text-muted">Due <?= date('d M Y H:i', strtotime($dm['due_date'])) ?></p>
                        </div>
                    <?php endforeach; ?>
                </div>
                <div class="modal-footer justify-content-center">
                    <button type="button" class="btn btn-success px-4" id="dueMemosGotItBtn">
                        <i class="fas fa-check me-1"></i> Got it
                    </button>
                </div>
            </div>
        </div>
    </div>

    <main class="app-main">

        <div class="app-topbar">
            <div class="topbar-search">
                <i class="fas fa-search"></i>
                <input type="text" id="globalSearch" placeholder="Search quotations, requisitions...">
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
                <a href="makeQuotation.php" title="Your pending quotations">
                    <i class="fas fa-bell"></i>
                    <?php if ($myPendingQuoCount > 0 || $myPendingReqCount > 0 || $myPendingJobCount > 0 || count($dueMemos) > 0): ?><span class="icon-dot"></span><?php endif; ?>
                </a>
            </div>
        </div>

<?php if (count($dueMemos) > 0): ?>
<script>
document.addEventListener('DOMContentLoaded', function() {
    var dueMemoIds = <?= json_encode(array_column($dueMemos, 'memo_id')) ?>;
    var modalEl = document.getElementById('dueMemosModal');
    var modal = new bootstrap.Modal(modalEl);
    modal.show();

    document.getElementById('dueMemosGotItBtn').addEventListener('click', function() {
        fetch('php_action/acknowledgeMemo.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'memo_ids=' + encodeURIComponent(dueMemoIds.join(','))
        })
        .catch(function(err) { console.error(err); })
        .finally(function() { modal.hide(); });
    });
});
</script>
<?php endif; ?>
