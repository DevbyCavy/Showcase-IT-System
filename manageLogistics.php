<?php
require_once 'php_action/auth_guard.php';
requireRole('Logistics');
require_once 'php_action/db_connection.php';

$activeTab = $_GET['tab'] ?? 'vehicles';
if (!in_array($activeTab, ['vehicles', 'trips'], true)) {
    $activeTab = 'vehicles';
}

$pageTitle = 'Fleet Management';
require_once 'includes/sidebarLogistics.php';
?>

<div class="dash-card">
    <div class="dash-card-head">
        <h5><i class="fas fa-truck me-2"></i>Fleet Management</h5>
    </div>

    <ul class="nav nav-tabs modern-tabs">
        <li class="nav-item">
            <button class="nav-link modern-tab-btn<?= $activeTab === 'vehicles' ? ' active' : '' ?>" data-bs-toggle="tab" data-bs-target="#vehicles-tab">
                <i class="fas fa-truck me-1"></i> Vehicle Register
            </button>
        </li>
        <li class="nav-item">
            <button class="nav-link modern-tab-btn<?= $activeTab === 'trips' ? ' active' : '' ?>" data-bs-toggle="tab" data-bs-target="#trips-tab">
                <i class="fas fa-route me-1"></i> Trip Logbook
            </button>
        </li>
    </ul>

    <div class="tab-content pt-3">

        <div class="tab-pane fade<?= $activeTab === 'vehicles' ? ' show active' : '' ?>" id="vehicles-tab">
            <?php include 'includes/vehicles/vehicleRegister.php'; ?>
        </div>

        <div class="tab-pane fade<?= $activeTab === 'trips' ? ' show active' : '' ?>" id="trips-tab">
            <?php include 'includes/vehicles/tripLogbook.php'; ?>
        </div>

    </div>
</div>

<?php require_once 'includes/footerDashboard.php'; ?>
