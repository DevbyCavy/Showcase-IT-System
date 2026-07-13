<?php
require_once 'php_action/auth_guard.php';
requireRole('Logistics');
require_once 'php_action/db_connection.php';

$loggedUserId = $_SESSION['user_id'] ?? 0;

/* ---------- Profile ---------- */
$profileStmt = $conn->prepare("SELECT name, surname, user_type, department FROM users WHERE user_id = ?");
$profileStmt->bind_param("i", $loggedUserId);
$profileStmt->execute();
$profile = $profileStmt->get_result()->fetch_assoc();
$profileStmt->close();

if (!$profile) {
    $profile = ['name' => $_SESSION['username'] ?? 'User', 'surname' => '', 'user_type' => $_SESSION['user_type'] ?? '', 'department' => ''];
}

$dummyRating = 4.8; // placeholder — real rating source TBD

/* ---------- Total Orders (+ month-over-month change) ---------- */
$totalOrders = $conn->query("SELECT COUNT(*) c FROM orders")->fetch_assoc()['c'];
$ordersThisMonth = $conn->query("
    SELECT COUNT(*) c FROM orders
    WHERE MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())
")->fetch_assoc()['c'];
$ordersLastMonth = $conn->query("
    SELECT COUNT(*) c FROM orders
    WHERE MONTH(created_at) = MONTH(CURDATE() - INTERVAL 1 MONTH) AND YEAR(created_at) = YEAR(CURDATE() - INTERVAL 1 MONTH)
")->fetch_assoc()['c'];
if ($ordersLastMonth > 0) {
    $ordersChangePct = round((($ordersThisMonth - $ordersLastMonth) / $ordersLastMonth) * 100);
} else {
    $ordersChangePct = $ordersThisMonth > 0 ? 100 : 0;
}

/* ---------- Active Shipments (vehicle trips currently planned/active) ---------- */
$activeShipments = $conn->query("SELECT COUNT(*) c FROM vehicle_trips WHERE trip_status IN ('Planned','Active')")->fetch_assoc()['c'];
$totalTrips = $conn->query("SELECT COUNT(*) c FROM vehicle_trips")->fetch_assoc()['c'];
$completedTrips = $conn->query("SELECT COUNT(*) c FROM vehicle_trips WHERE trip_status = 'Completed'")->fetch_assoc()['c'];
$completedPct = $totalTrips > 0 ? round(($completedTrips / $totalTrips) * 100) : 0;

/* ---------- Fleet Availability ---------- */
$totalVehicles = $conn->query("SELECT COUNT(*) c FROM vehicles")->fetch_assoc()['c'];
$availableVehicles = $conn->query("SELECT COUNT(*) c FROM vehicles WHERE status = 'Available'")->fetch_assoc()['c'];
$maintenanceVehicles = $conn->query("SELECT COUNT(*) c FROM vehicles WHERE status IN ('Under Maintenance','Out of Service')")->fetch_assoc()['c'];
$fleetAvailabilityPct = $totalVehicles > 0 ? round(($availableVehicles / $totalVehicles) * 100) : 0;

/* ---------- Vehicle Usage Summary (donut) ---------- */
$onTripVehicles = $conn->query("SELECT COUNT(*) c FROM vehicles WHERE status = 'On Trip'")->fetch_assoc()['c'];
$usageTotal = max($totalVehicles, 1);
$pctAvailable   = round(($availableVehicles / $usageTotal) * 100);
$pctInUse       = round(($onTripVehicles / $usageTotal) * 100);
$pctMaintenance = max(0, 100 - $pctAvailable - $pctInUse);

$donutStop1 = $pctAvailable;
$donutStop2 = $donutStop1 + $pctInUse;

/* ---------- Shipment Tracking (recent vehicle trips) ---------- */
$shipResult = $conn->query("
    SELECT vt.trip_id, vt.destination, vt.departure_datetime, vt.return_datetime, vt.trip_status, v.registration_number
    FROM vehicle_trips vt
    JOIN vehicles v ON vt.vehicle_id = v.vehicle_id
    ORDER BY vt.departure_datetime DESC
    LIMIT 6
");
$shipments = [];
while ($row = $shipResult->fetch_assoc()) $shipments[] = $row;

/* ---------- Active Orders ---------- */
$activeOrdersResult = $conn->query("
    SELECT order_id, order_number, order_name, location, deadline_datetime, status
    FROM orders
    WHERE status IN ('New','Assigned','On Going')
    ORDER BY deadline_datetime ASC
    LIMIT 8
");
$activeOrdersList = [];
while ($row = $activeOrdersResult->fetch_assoc()) $activeOrdersList[] = $row;

/* ---------- All users, for the task calendar's department/assignee picker ---------- */
$calUsersResult = $conn->query("SELECT user_id, name, surname, department FROM users ORDER BY department, name");
$calUsers = [];
while ($row = $calUsersResult->fetch_assoc()) $calUsers[] = $row;

$pageTitle = 'Logistics Dashboard';
require_once 'includes/sidebarLogistics.php';

function ld_trip_badge($status) {
    switch ($status) {
        case 'Active':    return ['In Transit', 'badge-transit'];
        case 'Completed': return ['Delivered', 'badge-delivered'];
        case 'Cancelled': return ['Cancelled', 'badge-delayed'];
        default:          return ['Scheduled', 'badge-pending'];
    }
}
function ld_order_badge($status) {
    switch ($status) {
        case 'On Going': return ['In Transit', 'badge-transit'];
        case 'Completed': return ['Delivered', 'badge-delivered'];
        default:          return ['Pending', 'badge-pending'];
    }
}
?>

<div class="dash-grid">

    <!-- ============ Main column ============ -->
    <div class="dash-col-main">

        <!-- KPI Overview -->
        <div class="dash-card">
            <div class="overview-stats">
                <div class="stat-box">
                    <i class="fas fa-boxes-stacked"></i>
                    <strong><?= (int)$totalOrders ?></strong>
                    <span>Total Orders</span>
                    <span class="stat-sub<?= $ordersChangePct >= 0 ? ' up' : '' ?>">
                        <i class="fas <?= $ordersChangePct >= 0 ? 'fa-arrow-up' : 'fa-arrow-down' ?> me-1"></i><?= abs($ordersChangePct) ?>% from last month
                    </span>
                </div>
                <div class="stat-box">
                    <i class="fas fa-truck-fast"></i>
                    <strong><?= (int)$activeShipments ?></strong>
                    <span>Active Shipments</span>
                    <div class="stat-bar"><span style="width:<?= $completedPct ?>%;"></span></div>
                    <span class="stat-sub"><?= $completedPct ?>% completed</span>
                </div>
                <div class="stat-box">
                    <i class="fas fa-warehouse"></i>
                    <strong><?= $fleetAvailabilityPct ?>%</strong>
                    <span>Fleet Availability</span>
                    <span class="stat-sub"><?= (int)$maintenanceVehicles ?> vehicle<?= $maintenanceVehicles == 1 ? '' : 's' ?> under maintenance</span>
                </div>
            </div>
        </div>

        <!-- Vehicle Usage Summary + Shipment Tracking -->
        <div class="row g-3">
            <div class="col-lg-5">
                <div class="dash-card h-100">
                    <div class="dash-card-head">
                        <h5>Vehicle Usage Summary</h5>
                    </div>
                    <div class="donut-wrap">
                        <div class="donut-chart" style="background:conic-gradient(var(--brand-purple) 0% <?= $donutStop1 ?>%, #B7A6F5 <?= $donutStop1 ?>% <?= $donutStop2 ?>%, #E4DBFB <?= $donutStop2 ?>% 100%);"></div>
                        <div class="donut-legend">
                            <div class="donut-legend-item">
                                <span class="legend-label"><span class="dot" style="background:var(--brand-purple);"></span>Available</span>
                                <strong><?= (int)$availableVehicles ?> vehicle<?= $availableVehicles == 1 ? '' : 's' ?></strong>
                            </div>
                            <div class="donut-legend-item">
                                <span class="legend-label"><span class="dot" style="background:#B7A6F5;"></span>In Use</span>
                                <strong><?= (int)$onTripVehicles ?> vehicle<?= $onTripVehicles == 1 ? '' : 's' ?></strong>
                            </div>
                            <div class="donut-legend-item">
                                <span class="legend-label"><span class="dot" style="background:#E4DBFB;"></span>In Maintenance</span>
                                <strong><?= (int)$maintenanceVehicles ?> vehicle<?= $maintenanceVehicles == 1 ? '' : 's' ?></strong>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-lg-7">
                <div class="dash-card h-100">
                    <div class="dash-card-head">
                        <h5>Shipment Tracking</h5>
                        <a class="see-all" href="manageLogistics.php">See All</a>
                    </div>
                    <div class="table-responsive">
                        <table class="mini-table">
                            <thead>
                                <tr>
                                    <th>Shipment ID</th>
                                    <th>Current Location</th>
                                    <th>Est. Delivery</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php if (empty($shipments)): ?>
                                    <tr class="table-empty"><td colspan="4">No shipments logged yet.</td></tr>
                                <?php else: ?>
                                    <?php foreach ($shipments as $s): ?>
                                        <?php [$label, $cls] = ld_trip_badge($s['trip_status']); ?>
                                        <tr>
                                            <td>TRP-<?= str_pad($s['trip_id'], 3, '0', STR_PAD_LEFT) ?></td>
                                            <td><?= htmlspecialchars($s['destination']) ?></td>
                                            <td><?= $s['return_datetime'] ? date('d M, H:i', strtotime($s['return_datetime'])) : 'TBD' ?></td>
                                            <td><span class="mini-badge <?= $cls ?>"><?= $label ?></span></td>
                                        </tr>
                                    <?php endforeach; ?>
                                <?php endif; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <!-- Active Orders -->
        <div class="dash-card">
            <div class="dash-card-head">
                <h5>Active Orders</h5>
                <a class="see-all" href="manageOrder.php">See All</a>
            </div>
            <div class="table-responsive">
                <table class="mini-table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Order Name</th>
                            <th>Destination</th>
                            <th>Status</th>
                            <th>Deadline</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php if (empty($activeOrdersList)): ?>
                            <tr class="table-empty"><td colspan="6">No active orders right now.</td></tr>
                        <?php else: ?>
                            <?php foreach ($activeOrdersList as $o): ?>
                                <?php [$label, $cls] = ld_order_badge($o['status']); ?>
                                <tr>
                                    <td><?= htmlspecialchars($o['order_number']) ?></td>
                                    <td><?= htmlspecialchars($o['order_name']) ?></td>
                                    <td><?= htmlspecialchars($o['location']) ?></td>
                                    <td><span class="mini-badge <?= $cls ?>"><?= $label ?></span></td>
                                    <td><?= $o['deadline_datetime'] ? date('d M Y', strtotime($o['deadline_datetime'])) : 'No deadline' ?></td>
                                    <td><a class="row-action" href="manageOrder.php" title="Manage order"><i class="fas fa-arrow-up-right-from-square"></i></a></td>
                                </tr>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>

        <?php require_once 'includes/workLogSheet.php'; ?>

    </div>

    <!-- ============ Side column ============ -->
    <div class="dash-col-side">

        <!-- Profile -->
        <div class="profile-card">
            <div class="profile-avatar">
                <i class="fas fa-user"></i>
                <span class="verified-badge"><i class="fas fa-check"></i></span>
            </div>
            <h6><?= htmlspecialchars($profile['name'] . ' ' . $profile['surname']) ?></h6>
            <div class="job-title"><?= htmlspecialchars($profile['user_type']) ?></div>
            <div class="profile-stats">
                <div class="stat-tile"><strong><?= (int)$totalTrips ?></strong><span>Trips Logged</span></div>
                <div class="stat-tile"><strong><?= (int)$activeShipments ?></strong><span>Active Now</span></div>
                <div class="stat-tile"><strong><?= number_format($dummyRating, 1) ?></strong><span>Rating</span></div>
            </div>
        </div>

        <!-- Office Task Calendar -->
        <div class="cal-card" id="dashCalendar" data-users='<?= json_encode($calUsers) ?>'>
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
            <div class="cal-day-panel">
                <div id="calDayPanelBody"></div>
            </div>
        </div>

    </div>

</div>

<!-- Assign Task/To-Do Modal -->
<div class="modal fade" id="taskCalModal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow">
            <div class="modal-header text-white" style="background:linear-gradient(135deg, var(--brand-orange,#F15A2C), var(--brand-orange-dark,#D94E22));">
                <h5 class="modal-title" style="color:#fff;"><i class="fas fa-calendar-plus me-2"></i>Add to <span id="taskCalDateLabel"></span></h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body py-4">
                <div class="btn-group w-100 mb-3" role="group">
                    <input type="radio" class="btn-check" name="taskCalType" id="taskCalTypeTodo" checked>
                    <label class="btn btn-outline-secondary" for="taskCalTypeTodo"><i class="fas fa-note-sticky me-1"></i>To-Do</label>
                    <input type="radio" class="btn-check" name="taskCalType" id="taskCalTypeJob">
                    <label class="btn btn-outline-secondary" for="taskCalTypeJob"><i class="fas fa-briefcase me-1"></i>Job</label>
                </div>

                <div id="taskCalTodoFields">
                    <div class="mb-2">
                        <label class="form-label fw-semibold">Title <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" id="taskCalTodoTitle" placeholder="e.g. Follow up with printer">
                    </div>
                    <div class="mb-2">
                        <label class="form-label fw-semibold">Time</label>
                        <input type="time" class="form-control" id="taskCalTodoTime" value="09:00">
                    </div>
                    <div class="mb-2">
                        <label class="form-label fw-semibold">Notes</label>
                        <textarea class="form-control" id="taskCalTodoNotes" rows="2"></textarea>
                    </div>
                </div>

                <div id="taskCalJobFields" class="d-none">
                    <div class="mb-2">
                        <label class="form-label fw-semibold">Department <span class="text-danger">*</span></label>
                        <select class="form-select" id="taskCalDept">
                            <option value="">Select department...</option>
                        </select>
                    </div>
                    <div class="mb-2">
                        <label class="form-label fw-semibold">Assign To <span class="text-danger">*</span></label>
                        <select class="form-select" id="taskCalAssignee" disabled>
                            <option value="">Select department first...</option>
                        </select>
                    </div>
                    <div class="mb-2">
                        <label class="form-label fw-semibold">Task <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" id="taskCalJobTitle" placeholder="e.g. Prepare signage artwork">
                    </div>
                    <div class="mb-2">
                        <label class="form-label fw-semibold">Description</label>
                        <textarea class="form-control" id="taskCalJobNotes" rows="2"></textarea>
                    </div>
                </div>

                <input type="hidden" id="taskCalDate">
                <div class="text-danger small mt-2 d-none" id="taskCalError"></div>
            </div>
            <div class="modal-footer justify-content-center">
                <button type="button" class="btn btn-secondary px-4" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn text-white px-4" id="taskCalSaveBtn" style="background:var(--brand-orange,#F15A2C);">
                    <i class="fas fa-check me-1"></i> Save
                </button>
            </div>
        </div>
    </div>
</div>

<?php require_once 'includes/footerDashboard.php'; ?>
