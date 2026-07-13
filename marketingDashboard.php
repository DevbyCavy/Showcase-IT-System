<?php
require_once 'php_action/auth_guard.php';
requireRole('Marketer');
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

/* ---------- Quotation stats ---------- */
$statsStmt = $conn->prepare("
    SELECT
        COUNT(*) AS total,
        SUM(status = 'Pending')  AS pending,
        SUM(status = 'Approved') AS approved
    FROM quotations
    WHERE submitted_by = ?
");
$statsStmt->bind_param("i", $loggedUserId);
$statsStmt->execute();
$quoStats = $statsStmt->get_result()->fetch_assoc();
$statsStmt->close();

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

/* ---------- This marketer's pending requisitions ---------- */
$reqStmt = $conn->prepare("
    SELECT requisition_id, event_name, project_manager, location, event_date, req_type
    FROM requisitions
    WHERE submitted_by = ? AND status = 'Pending'
    ORDER BY created_at DESC
    LIMIT 6
");
$reqStmt->bind_param("i", $loggedUserId);
$reqStmt->execute();
$pendingRequisitions = [];
$reqRes = $reqStmt->get_result();
while ($row = $reqRes->fetch_assoc()) $pendingRequisitions[] = $row;

/* ---------- This marketer's approved quotations ---------- */
$quoStmt = $conn->prepare("
    SELECT quotation_id, quotation_number, customer_name, project_name, total, approved_at
    FROM quotations
    WHERE submitted_by = ? AND status = 'Approved'
    ORDER BY approved_at DESC
    LIMIT 6
");
$quoStmt->bind_param("i", $loggedUserId);
$quoStmt->execute();
$approvedQuotations = [];
$quoRes = $quoStmt->get_result();
while ($row = $quoRes->fetch_assoc()) $approvedQuotations[] = $row;

/* ---------- Calendar marker dates (this marketer's own quote dates, +/-2 months) ---------- */
$calStmt = $conn->prepare("
    SELECT DISTINCT quote_date d
    FROM quotations
    WHERE submitted_by = ?
      AND quote_date BETWEEN (CURDATE() - INTERVAL 2 MONTH) AND (CURDATE() + INTERVAL 2 MONTH)
");
$calStmt->bind_param("i", $loggedUserId);
$calStmt->execute();
$markedDates = [];
$calRes = $calStmt->get_result();
while ($row = $calRes->fetch_assoc()) $markedDates[$row['d']] = true;

$pageTitle = 'Marketer Dashboard';
require_once 'includes/sidebarMarketing.php';
?>

<div class="dash-grid">

    <!-- ============ Main column ============ -->
    <div class="dash-col-main">

        <div class="d-flex justify-content-end mb-1">
            <div class="dropdown">
                <button class="btn btn-sm rounded-circle d-inline-flex align-items-center justify-content-center"
                        type="button" data-bs-toggle="dropdown" aria-expanded="false"
                        style="width:38px; height:38px; background:var(--brand-orange,#F15A2C); color:#fff;"
                        title="New...">
                    <i class="fas fa-plus"></i>
                </button>
                <ul class="dropdown-menu dropdown-menu-end">
                    <li>
                        <a class="dropdown-item" href="makeQuotation.php">
                            <i class="fas fa-file-invoice-dollar me-2 text-warning"></i>New Quotation
                        </a>
                    </li>
                    <li>
                        <a class="dropdown-item" href="requisitions.php">
                            <i class="fas fa-file-signature me-2 text-secondary"></i>New Requisition
                        </a>
                    </li>
                </ul>
            </div>
        </div>

        <!-- Orders -->
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

        <?php require_once 'includes/workLogSheet.php'; ?>

        <!-- Pending Requisitions -->
        <div class="dash-card">
            <div class="dash-card-head">
                <h5>Pending Requisitions</h5>
                <a class="see-all" href="requisitions.php">See All</a>
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
                        </div>
                    <?php endforeach; ?>
                <?php endif; ?>
            </div>
        </div>

        <!-- Approved Quotations -->
        <div class="dash-card">
            <div class="dash-card-head">
                <h5>Approved Quotations</h5>
                <a class="see-all" href="makeQuotation.php">See All</a>
            </div>

            <div id="quoList">
                <?php if (empty($approvedQuotations)): ?>
                    <div class="req-empty">No approved quotations yet.</div>
                <?php else: ?>
                    <?php foreach ($approvedQuotations as $quo): ?>
                        <div class="req-row">
                            <div class="req-icon"><i class="fas fa-file-invoice-dollar"></i></div>
                            <div class="req-body">
                                <div class="req-type"><?= htmlspecialchars($quo['quotation_number']) ?></div>
                                <div class="req-title">
                                    <?= htmlspecialchars($quo['customer_name']) ?><?= $quo['project_name'] ? ' — ' . htmlspecialchars($quo['project_name']) : '' ?>
                                </div>
                            </div>
                            <div class="req-meta">
                                $<?= number_format($quo['total'], 2) ?>
                            </div>
                            <a href="viewQuotation.php?id=<?= $quo['quotation_id'] ?>" class="req-process-btn" style="text-decoration:none;" target="_blank">
                                <i class="fas fa-eye"></i> View
                            </a>
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
                <div class="stat-tile"><strong><?= (int)$quoStats['total'] ?></strong><span>Total Quotes</span></div>
                <div class="stat-tile"><strong><?= (int)$quoStats['pending'] ?></strong><span>Pending</span></div>
                <div class="stat-tile"><strong><?= (int)$quoStats['approved'] ?></strong><span>Approved</span></div>
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

    </div>

</div>

<?php require_once 'includes/footerDashboard.php'; ?>
