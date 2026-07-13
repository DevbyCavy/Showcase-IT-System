<?php
require_once 'php_action/auth_guard.php';
requireRole('Logistics');
require_once 'php_action/db_connection.php';

$pageTitle = 'Fuel Log';
require_once 'includes/sidebarLogistics.php';
?>

<?php include 'includes/vehicles/fuelLog.php'; ?>

<?php require_once 'includes/footerDashboard.php'; ?>
