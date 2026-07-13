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

/* ---------- Pending quotations ---------- */
$quoResult = $conn->query("
    SELECT quotation_id, quotation_number, customer_name, project_name, quote_date
    FROM quotations
    WHERE status = 'Pending'
    ORDER BY created_at DESC
    LIMIT 6
");
$pendingQuotations = [];
while ($row = $quoResult->fetch_assoc()) $pendingQuotations[] = $row;

/* ---------- Recent BOQs ---------- */
$boqResult = $conn->query("
    SELECT boq_id, boq_number, order_number, event_name, location, created_at
    FROM boq
    ORDER BY created_at DESC
    LIMIT 5
");
$recentBoqs = [];
while ($row = $boqResult->fetch_assoc()) $recentBoqs[] = $row;

/* ---------- All users, for the task calendar's department/assignee picker ---------- */
$calUsersResult = $conn->query("SELECT user_id, name, surname, department FROM users ORDER BY department, name");
$calUsers = [];
while ($row = $calUsersResult->fetch_assoc()) $calUsers[] = $row;

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

        <?php require_once 'includes/workLogSheet.php'; ?>

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

        <!-- Pending Quotations -->
        <div class="dash-card">
            <div class="dash-card-head">
                <h5>Pending Quotations</h5>
                <a class="see-all" href="processQuotations.php">See All</a>
            </div>

            <div id="quoList">
                <?php if (empty($pendingQuotations)): ?>
                    <div class="req-empty">No pending quotations right now.</div>
                <?php else: ?>
                    <?php foreach ($pendingQuotations as $quo): ?>
                        <div class="req-row quo-row" data-quotation-id="<?= $quo['quotation_id'] ?>">
                            <div class="req-icon"><i class="fas fa-file-invoice-dollar"></i></div>
                            <div class="req-body">
                                <div class="req-type"><?= htmlspecialchars($quo['quotation_number']) ?></div>
                                <div class="req-title">
                                    <?= htmlspecialchars($quo['customer_name']) ?><?= $quo['project_name'] ? ' — ' . htmlspecialchars($quo['project_name']) : '' ?>
                                </div>
                            </div>
                            <div class="req-meta">
                                <i class="far fa-calendar"></i> <?= date('d M Y', strtotime($quo['quote_date'])) ?>
                            </div>
                            <button class="req-process-btn quo-approve-btn" data-quotation-id="<?= $quo['quotation_id'] ?>">Approve</button>
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
            </div>        </div>

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
