<?php
require_once 'php_action/auth_guard.php';
requireRole('Logistics');
require_once 'php_action/db_connection.php';

$loggedUserId = $_SESSION['user_id'] ?? 0;

$profileStmt = $conn->prepare("SELECT name, surname, user_type, department FROM users WHERE user_id = ?");
$profileStmt->bind_param("i", $loggedUserId);
$profileStmt->execute();
$profile = $profileStmt->get_result()->fetch_assoc();
$profileStmt->close();

if (!$profile) {
    $profile = ['name' => $_SESSION['username'] ?? 'User', 'surname' => '', 'user_type' => $_SESSION['user_type'] ?? '', 'department' => ''];
}

$assignedTotalStmt = $conn->prepare("SELECT COUNT(*) c FROM office_tasks WHERE assigned_to = ?");
$assignedTotalStmt->bind_param("i", $loggedUserId);
$assignedTotalStmt->execute();
$assignedTotal = (int) $assignedTotalStmt->get_result()->fetch_assoc()['c'];
$assignedTotalStmt->close();

$pendingStmt = $conn->prepare("SELECT COUNT(*) c FROM office_tasks WHERE assigned_to = ? AND status = 'Pending'");
$pendingStmt->bind_param("i", $loggedUserId);
$pendingStmt->execute();
$pendingCount = (int) $pendingStmt->get_result()->fetch_assoc()['c'];
$pendingStmt->close();

$completedStmt = $conn->prepare("SELECT COUNT(*) c FROM office_tasks WHERE assigned_to = ? AND status = 'Completed'");
$completedStmt->bind_param("i", $loggedUserId);
$completedStmt->execute();
$completedCount = (int) $completedStmt->get_result()->fetch_assoc()['c'];
$completedStmt->close();

$pageTitle = 'Office Task Management';
require_once 'includes/sidebarLogistics.php';
?>

<div class="dash-grid">

    <div class="dash-col-main">
        <div class="dash-card cal-page">
            <div class="dash-card-head">
                <h5><i class="fas fa-calendar-days me-2"></i>Office Task Management</h5>
                <span class="mini-badge badge-pending"><i class="fas fa-eye me-1"></i>View only</span>
            </div>

            <div class="cal-page-legend">
                <span><span class="legend-dot" style="background:#e74c3c;"></span>Your to-dos</span>
                <span><span class="legend-dot" style="background:#3498db;"></span>Assigned to you</span>
                <span><span class="legend-dot" style="background:#2ecc71;"></span>Tasks you assigned</span>
            </div>

            <div class="cal-page-main" id="dashCalendar" data-readonly="true" data-style="boxed">
                <div class="cal-head">
                    <div class="cal-head-nav">
                        <button class="cal-nav-btn" id="calPrevBtn"><i class="fas fa-chevron-left"></i></button>
                        <span id="calMonthLabel"></span>
                        <button class="cal-nav-btn" id="calNextBtn"><i class="fas fa-chevron-right"></i></button>
                    </div>
                    <div class="cal-view-toggle">
                        <button type="button" id="calWeekViewBtn">Week</button>
                        <button type="button" id="calMonthViewBtn" class="active">Month</button>
                    </div>
                </div>
                <div class="cal-grid" id="calGrid"></div>
            </div>

            <div class="cal-page-daypanel">
                <div class="cal-page-side-head" id="calSelectedDateLabel"></div>
                <div id="calDayPanelBody"></div>
            </div>
        </div>
    </div>

    <div class="dash-col-side">
        <div class="profile-card">
            <div class="profile-avatar">
                <i class="fas fa-user"></i>
                <span class="verified-badge"><i class="fas fa-check"></i></span>
            </div>
            <h6><?= htmlspecialchars($profile['name'] . ' ' . $profile['surname']) ?></h6>
            <div class="job-title"><?= htmlspecialchars($profile['user_type']) ?></div>
            <div class="profile-stats">
                <div class="stat-tile"><strong><?= $assignedTotal ?></strong><span>Assigned Tasks</span></div>
                <div class="stat-tile"><strong><?= $pendingCount ?></strong><span>Pending</span></div>
                <div class="stat-tile"><strong><?= $completedCount ?></strong><span>Completed</span></div>
            </div>
        </div>
    </div>

</div>

<?php require_once 'includes/footerDashboard.php'; ?>
