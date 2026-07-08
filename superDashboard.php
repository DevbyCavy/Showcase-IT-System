<?php
require_once 'php_action/auth_guard.php';
requireRole("Super Admin");
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

$totalJobsStmt = $conn->prepare("SELECT COUNT(*) c FROM order_assignments WHERE user_id = ?");
$totalJobsStmt->bind_param("i", $loggedUserId);
$totalJobsStmt->execute();
$totalJobs = $totalJobsStmt->get_result()->fetch_assoc()['c'];
$totalJobsStmt->close();

$currentJobsStmt = $conn->prepare("
    SELECT COUNT(*) c
    FROM order_assignments oa
    JOIN orders o ON oa.order_id = o.order_id
    WHERE oa.user_id = ? AND o.status IN ('New','Assigned','On Going')
");
$currentJobsStmt->bind_param("i", $loggedUserId);
$currentJobsStmt->execute();
$currentJobs = $currentJobsStmt->get_result()->fetch_assoc()['c'];
$currentJobsStmt->close();

$dummyRating = 4.8; // placeholder — real rating source TBD

/* ---------- Orders (auto-advance statuses, then group for the carousel) ---------- */
$conn->query("
    UPDATE orders
    SET status = 'On Going', ongoing_since = NOW()
    WHERE status IN ('New','Assigned')
      AND deadline_datetime IS NOT NULL
      AND deadline_datetime <= NOW()
      AND ongoing_since IS NULL
");
$conn->query("
    UPDATE orders
    SET status = 'Completed'
    WHERE status = 'On Going'
      AND ongoing_since IS NOT NULL
      AND ongoing_since <= NOW() - INTERVAL 24 HOUR
");

$ordersResult = $conn->query("
    SELECT order_id, order_number, order_name, location, deadline_datetime, status
    FROM orders
    ORDER BY created_at DESC
");
$tabOrders = ['new' => [], 'ongoing' => [], 'completed' => []];
while ($row = $ordersResult->fetch_assoc()) {
    switch ($row['status']) {
        case 'New':
        case 'Assigned':  $tabOrders['new'][]       = $row; break;
        case 'On Going':  $tabOrders['ongoing'][]   = $row; break;
        case 'Completed': $tabOrders['completed'][] = $row; break;
    }
}
$orderTabsMeta = [
    'new'       => ['label' => 'New Orders',  'icon' => 'fa-bolt',          'tile' => ''],
    'ongoing'   => ['label' => 'On Going',    'icon' => 'fa-person-digging','tile' => 'tile-ongoing'],
    'completed' => ['label' => 'Completed',   'icon' => 'fa-circle-check',  'tile' => 'tile-completed'],
];

/* ---------- Pending requisitions ---------- */
$reqResult = $conn->query("
    SELECT requisition_id, project_manager, event_name, location, event_date, req_type
    FROM requisitions
    WHERE status = 'Pending'
    ORDER BY created_at DESC
    LIMIT 6
");
$pendingRequisitions = [];
while ($row = $reqResult->fetch_assoc()) $pendingRequisitions[] = $row;

/* ---------- Recent BOQs ---------- */
$boqResult = $conn->query("
    SELECT boq_id, boq_number, order_number, event_name, location, created_at
    FROM boq
    ORDER BY created_at DESC
    LIMIT 5
");
$recentBoqs = [];
while ($row = $boqResult->fetch_assoc()) $recentBoqs[] = $row;

/* ---------- Calendar marker dates (order deadlines, +/-2 months) ---------- */
$calResult = $conn->query("
    SELECT DISTINCT DATE(deadline_datetime) d
    FROM orders
    WHERE deadline_datetime IS NOT NULL
      AND deadline_datetime BETWEEN (NOW() - INTERVAL 2 MONTH) AND (NOW() + INTERVAL 2 MONTH)
");
$markedDates = [];
while ($row = $calResult->fetch_assoc()) $markedDates[$row['d']] = true;

$pageTitle = 'Super Admin Dashboard';
require_once 'includes/sidebarSuper.php';
?>

<div class="dash-grid">

    <!-- ============ Main column ============ -->
    <div class="dash-col-main">

        <!-- Orders (replaces "Featured Course") -->
        <div class="dash-card">
            <div class="dash-card-head">
                <h5>Orders</h5>
                <div class="orders-nav">
                    <button class="orders-arrow" id="ordersPrevBtn" title="Previous"><i class="fas fa-chevron-left"></i></button>
                    <span class="orders-nav-label" id="ordersTabLabel"></span>
                    <button class="orders-arrow" id="ordersNextBtn" title="Next"><i class="fas fa-chevron-right"></i></button>
                </div>
            </div>

            <div class="orders-panels">
                <?php foreach ($orderTabsMeta as $tabKey => $meta): ?>
                    <div class="orders-panel<?= $tabKey === 'new' ? ' active' : '' ?>"
                         data-label="<?= htmlspecialchars($meta['label']) ?> (<?= count($tabOrders[$tabKey]) ?>)">
                        <?php if (empty($tabOrders[$tabKey])): ?>
                            <div class="orders-empty">
                                <i class="fas fa-inbox fa-2x mb-2 d-block"></i>Nothing here yet.
                            </div>
                        <?php else: ?>
                            <?php foreach (array_slice($tabOrders[$tabKey], 0, 6) as $order): ?>
                                <div class="order-tile <?= $meta['tile'] ?>">
                                    <div class="tile-icon"><i class="fas <?= $meta['icon'] ?>"></i></div>
                                    <h6><?= htmlspecialchars($order['order_name']) ?></h6>
                                    <div class="tile-meta">
                                        <?= htmlspecialchars($order['order_number']) ?> &middot; <?= htmlspecialchars($order['location']) ?>
                                    </div>
                                    <div class="tile-meta">
                                        <i class="far fa-clock me-1"></i>
                                        <?= $order['deadline_datetime'] ? date('d M, H:i', strtotime($order['deadline_datetime'])) : 'No deadline' ?>
                                    </div>
                                    <a class="tile-cta" href="manageOrder.php">Manage</a>
                                </div>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </div>
                <?php endforeach; ?>
            </div>
        </div>

        <!-- Pending Requisitions (replaces "Recommended Course") -->
        <div class="dash-card">
            <div class="dash-card-head">
                <h5>Pending Requisitions</h5>
                <a class="see-all" href="processRequisitions.php">See All</a>
            </div>

            <div id="reqList">
                <?php if (empty($pendingRequisitions)): ?>
                    <div class="req-empty">No pending requisitions right now.</div>
                <?php else: ?>
                    <?php foreach ($pendingRequisitions as $req): ?>
                        <div class="req-row">
                            <div class="req-icon"><i class="fas fa-file-signature"></i></div>
                            <div class="req-body">
                                <div class="req-type"><?= htmlspecialchars($req['req_type']) ?></div>
                                <div class="req-title"><?= htmlspecialchars($req['event_name']) ?> &mdash; <?= htmlspecialchars($req['project_manager']) ?></div>
                            </div>
                            <div class="req-meta">
                                <i class="far fa-calendar"></i> <?= date('d M Y', strtotime($req['event_date'])) ?>
                            </div>
                            <button class="req-process-btn" data-requisition-id="<?= $req['requisition_id'] ?>">Process</button>
                        </div>
                    <?php endforeach; ?>
                <?php endif; ?>
            </div>
        </div>

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
                <div class="stat-tile"><strong><?= (int)$totalJobs ?></strong><span>Total Jobs</span></div>
                <div class="stat-tile"><strong><?= (int)$currentJobs ?></strong><span>Current Jobs</span></div>
                <div class="stat-tile"><strong><?= number_format($dummyRating, 1) ?></strong><span>Rating</span></div>
            </div>
        </div>

        <!-- Calendar -->
        <div class="cal-card" id="dashCalendar" data-marked='<?= json_encode($markedDates) ?>'>
            <div class="cal-head">
                <button id="calPrevBtn"><i class="fas fa-chevron-left"></i></button>
                <span id="calMonthLabel"></span>
                <button id="calNextBtn"><i class="fas fa-chevron-right"></i></button>
            </div>
            <div class="cal-grid" id="calGrid"></div>
        </div>

        <!-- Bill of Quantities (replaces "Schedule class") -->
        <div class="dash-card">
            <div class="dash-card-head">
                <h5>Bill of Quantities</h5>
                <a class="see-all" href="manageOrder.php">See All</a>
            </div>

            <?php if (empty($recentBoqs)): ?>
                <div class="boq-empty">No BOQs saved yet.</div>
            <?php else: ?>
                <?php foreach ($recentBoqs as $boq): ?>
                    <div class="boq-row">
                        <div class="boq-date">
                            <strong><?= date('d', strtotime($boq['created_at'])) ?></strong>
                            <span><?= date('M', strtotime($boq['created_at'])) ?></span>
                        </div>
                        <div class="boq-body">
                            <div class="boq-title"><?= htmlspecialchars($boq['event_name']) ?></div>
                            <div class="boq-sub">BOQ #<?= htmlspecialchars($boq['boq_number']) ?> &middot; <?= htmlspecialchars($boq['order_number']) ?></div>
                        </div>
                        <a class="boq-link" href="php_action/downloadBOQ.php?id=<?= $boq['boq_id'] ?>" target="_blank" title="Download PDF">
                            <i class="fas fa-file-pdf"></i>
                        </a>
                    </div>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>

    </div>

</div>

<?php require_once 'includes/footerDashboard.php'; ?>
