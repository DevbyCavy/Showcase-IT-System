<?php
require_once 'php_action/auth_guard.php';
requireRole('Stores Admin');
require_once 'php_action/db_connection.php';

$pageTitle = 'Bill of Quantities';
require_once 'includes/sidebarStores.php';
?>

<div class="dash-card">
    <div class="dash-card-head">
        <h5><i class="fas fa-file-invoice me-2"></i>Bill of Quantities</h5>
    </div>

    <?php include 'php_action/createBOQ.php'; ?>
</div>

<?php require_once 'includes/footerDashboard.php'; ?>
