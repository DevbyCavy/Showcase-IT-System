<?php
require_once 'php_action/auth_guard.php';
requireRole("Stores Admin");
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

/* ---------- Stock overview ---------- */
$totalProducts   = $conn->query("SELECT COUNT(*) c FROM product")->fetch_assoc()['c'];
$totalBrands     = $conn->query("SELECT COUNT(*) c FROM brand")->fetch_assoc()['c'];
$totalCategories = $conn->query("SELECT COUNT(*) c FROM category")->fetch_assoc()['c'];
$totalUnits      = $conn->query("SELECT SUM(CAST(quantity AS UNSIGNED)) c FROM product")->fetch_assoc()['c'] ?? 0;

/* ---------- Items issued this month (profile stat) ---------- */
$issuedThisMonth = $conn->query("
    SELECT COUNT(*) c FROM issued_tools
    WHERE MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())
")->fetch_assoc()['c'];

/* ---------- Low stock alerts ---------- */
$lowStockThreshold = 5;
$lowStockStmt = $conn->prepare("
    SELECT p.product_id, p.product_name, p.quantity, b.brand_name, c.categories_name
    FROM product p
    LEFT JOIN brand b ON p.brand_id = b.brand_id
    LEFT JOIN category c ON p.categories_id = c.categories_id
    WHERE CAST(p.quantity AS UNSIGNED) <= ?
    ORDER BY CAST(p.quantity AS UNSIGNED) ASC
    LIMIT 6
");
$lowStockStmt->bind_param("i", $lowStockThreshold);
$lowStockStmt->execute();
$lowStockResult = $lowStockStmt->get_result();
$lowStockItems = [];
while ($row = $lowStockResult->fetch_assoc()) $lowStockItems[] = $row;
$lowStockStmt->close();

/* ---------- Recently issued products ---------- */
$issuedResult = $conn->query("
    SELECT issue_id, tool_name, quantity_issued, collector_name, job_name, date_of_collection, created_at
    FROM issued_tools
    ORDER BY created_at DESC
    LIMIT 5
");
$recentIssued = [];
while ($row = $issuedResult->fetch_assoc()) $recentIssued[] = $row;

/* ---------- Calendar marker dates (order deadlines, +/-2 months) ---------- */
$calResult = $conn->query("
    SELECT DISTINCT DATE(deadline_datetime) d
    FROM orders
    WHERE deadline_datetime IS NOT NULL
      AND deadline_datetime BETWEEN (NOW() - INTERVAL 2 MONTH) AND (NOW() + INTERVAL 2 MONTH)
");
$markedDates = [];
while ($row = $calResult->fetch_assoc()) $markedDates[$row['d']] = true;

$pageTitle = 'Stores Dashboard';
require_once 'includes/sidebarStores.php';
?>

<div class="dash-grid">

    <!-- ============ Main column ============ -->
    <div class="dash-col-main">

        <!-- Stock Overview -->
        <div class="dash-card">
            <div class="dash-card-head">
                <h5>Stock Overview</h5>
                <a class="see-all" href="product.php">See All</a>
            </div>

            <div class="overview-stats">
                <div class="stat-box">
                    <i class="fas fa-box"></i>
                    <strong><?= (int)$totalProducts ?></strong>
                    <span>Products</span>
                </div>
                <div class="stat-box">
                    <i class="fas fa-building"></i>
                    <strong><?= (int)$totalBrands ?></strong>
                    <span>Brands</span>
                </div>
                <div class="stat-box">
                    <i class="fas fa-boxes"></i>
                    <strong><?= (int)$totalCategories ?></strong>
                    <span>Categories</span>
                </div>
                <div class="stat-box">
                    <i class="fas fa-warehouse"></i>
                    <strong><?= (int)$totalUnits ?></strong>
                    <span>Units in Stock</span>
                </div>
            </div>
        </div>

        <!-- Low Stock Alerts -->
        <div class="dash-card">
            <div class="dash-card-head">
                <h5>Low Stock Alerts</h5>
                <a class="see-all" href="product.php">See All</a>
            </div>

            <div id="reqList">
                <?php if (empty($lowStockItems)): ?>
                    <div class="req-empty">All products are well stocked.</div>
                <?php else: ?>
                    <?php foreach ($lowStockItems as $item): ?>
                        <?php $severity = $item['quantity'] <= 2 ? 'alert-critical' : 'alert-low'; ?>
                        <div class="req-row <?= $severity ?>">
                            <div class="req-icon icon-alert"><i class="fas fa-triangle-exclamation"></i></div>
                            <div class="req-body">
                                <div class="req-type"><?= htmlspecialchars($item['brand_name'] ?? 'Unbranded') ?> &middot; <?= htmlspecialchars($item['categories_name'] ?? 'Uncategorised') ?></div>
                                <div class="req-title"><?= htmlspecialchars($item['product_name']) ?></div>
                            </div>
                            <div class="qty-pill"><?= (int)$item['quantity'] ?> left</div>
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
                <div class="stat-tile"><strong><?= (int)$totalProducts ?></strong><span>Products Managed</span></div>
                <div class="stat-tile"><strong><?= (int)$issuedThisMonth ?></strong><span>Issued (Month)</span></div>
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

        <!-- Recently Issued Products -->
        <div class="dash-card">
            <div class="dash-card-head">
                <h5>Recently Issued</h5>
                <a class="see-all" href="IssueProductReport.php?o=add">See All</a>
            </div>

            <?php if (empty($recentIssued)): ?>
                <div class="boq-empty">No products issued yet.</div>
            <?php else: ?>
                <?php foreach ($recentIssued as $issue): ?>
                    <div class="boq-row">
                        <div class="boq-date">
                            <strong><?= date('d', strtotime($issue['date_of_collection'])) ?></strong>
                            <span><?= date('M', strtotime($issue['date_of_collection'])) ?></span>
                        </div>
                        <div class="boq-body">
                            <div class="boq-title"><?= htmlspecialchars($issue['tool_name']) ?></div>
                            <div class="boq-sub">Qty <?= (int)$issue['quantity_issued'] ?> &middot; <?= htmlspecialchars($issue['collector_name']) ?></div>
                        </div>
                    </div>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>

    </div>

</div>

<?php require_once 'includes/footerDashboard.php'; ?>
