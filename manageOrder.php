<?php
require_once 'php_action/auth_guard.php';
require_once 'php_action/db_connection.php';

$loggedUserId = $_SESSION['user_id'] ?? 0;
$activeTab = isset($_POST['boq_submit']) ? 'bill-of-quantities' : 'add-order';

// Orders with assigned team (via order_assignments — the `orders` table has no assigned_users column)
$result = $conn->query("
    SELECT o.*,
           GROUP_CONCAT(CONCAT(u.name, ' ', u.surname) ORDER BY u.name SEPARATOR ', ') AS assigned_names,
           GROUP_CONCAT(u.user_id ORDER BY u.name SEPARATOR ',')                       AS assigned_user_ids
    FROM orders o
    LEFT JOIN order_assignments oa ON o.order_id = oa.order_id
    LEFT JOIN users u ON oa.user_id = u.user_id
    GROUP BY o.order_id
    ORDER BY o.order_id DESC
");
$orders = [];
while ($row = $result->fetch_assoc()) {
    $orders[] = $row;
}

// All users for the team roster, plus how many orders each is assigned to
$usersResult = $conn->query("SELECT user_id, name, surname, email, user_type FROM users ORDER BY name ASC");
$allUsers = [];
while ($u = $usersResult->fetch_assoc()) {
    $allUsers[] = $u;
}

$jobsByUser = [];
$jobsResult = $conn->query("SELECT user_id, COUNT(*) c FROM order_assignments GROUP BY user_id");
while ($row = $jobsResult->fetch_assoc()) {
    $jobsByUser[$row['user_id']] = (int)$row['c'];
}

$statusBadgeClass = [
    'New'       => 'bg-primary',
    'Assigned'  => 'bg-info text-dark',
    'On Going'  => 'bg-warning text-dark',
    'Completed' => 'bg-success',
];

$pageTitle = 'Manage Orders';
if (($_SESSION['user_type'] ?? '') === 'Marketer') {
    require_once 'includes/sidebarMarketing.php';
} else {
    require_once 'includes/sidebarSuper.php';
}
?>

<div class="dash-grid">

    <!-- ============ Main column ============ -->
    <div class="dash-col-main">
        <div class="dash-card">
            <div class="dash-card-head">
                <h5>Manage Orders</h5>
            </div>

            <ul class="nav nav-tabs modern-tabs">
                <li class="nav-item">
                    <button class="nav-link modern-tab-btn<?= $activeTab === 'add-order' ? ' active' : '' ?>" data-bs-toggle="tab" data-bs-target="#add-order">Add New Order</button>
                </li>
                <li class="nav-item">
                    <button class="nav-link modern-tab-btn" data-bs-toggle="tab" data-bs-target="#edit-order">Edit Order</button>
                </li>
                <li class="nav-item">
                    <button class="nav-link modern-tab-btn" data-bs-toggle="tab" data-bs-target="#view-order">View Order</button>
                </li>
                <li class="nav-item">
                    <button class="nav-link modern-tab-btn<?= $activeTab === 'bill-of-quantities' ? ' active' : '' ?>" data-bs-toggle="tab" data-bs-target="#bill-of-quantities">Bill Of Quantities</button>
                </li>
            </ul>

            <div class="tab-content pt-3">

                <!-- ADD NEW ORDER -->
                <div class="tab-pane fade<?= $activeTab === 'add-order' ? ' show active' : '' ?>" id="add-order">
                    <?php include 'php_action/createOrder.php'; ?>
                </div>

                <!-- ADD NEW BOQ -->
                <div class="tab-pane fade<?= $activeTab === 'bill-of-quantities' ? ' show active' : '' ?>" id="bill-of-quantities">
                    <?php include 'php_action/createBOQ.php'; ?>
                </div>

                <!-- EDIT ORDER -->
                <div class="tab-pane fade" id="edit-order">
                    <h6 class="fw-bold mb-3">Edit Orders</h6>
                    <div class="table-responsive">
                        <table class="table table-striped align-middle">
                            <thead class="table-dark">
                                <tr>
                                    <th>Order #</th>
                                    <th>Name</th>
                                    <th>Location</th>
                                    <th>Deadline</th>
                                    <th>Status</th>
                                    <th>Assigned Team</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                            <?php foreach ($orders as $order): ?>
                                <tr>
                                    <td><?= htmlspecialchars($order['order_number']) ?></td>
                                    <td><?= htmlspecialchars($order['order_name']) ?></td>
                                    <td><?= htmlspecialchars($order['location']) ?></td>
                                    <td><?= $order['deadline_datetime'] ? date('d M Y, H:i', strtotime($order['deadline_datetime'])) : '—' ?></td>
                                    <td><span class="badge <?= $statusBadgeClass[$order['status']] ?? 'bg-secondary' ?>"><?= htmlspecialchars($order['status']) ?></span></td>
                                    <td><?= htmlspecialchars($order['assigned_names'] ?: 'Unassigned') ?></td>
                                    <td>
                                        <a href="editOrder.php?id=<?= $order['order_id'] ?>" class="btn btn-sm btn-outline-warning"><i class="fas fa-edit"></i></a>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                            <?php if (empty($orders)): ?>
                                <tr><td colspan="7" class="text-center text-muted py-4">No orders yet.</td></tr>
                            <?php endif; ?>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- VIEW ORDER -->
                <div class="tab-pane fade" id="view-order">
                    <h6 class="fw-bold mb-3">Orders Assigned to You</h6>
                    <div class="table-responsive">
                        <table class="table table-striped align-middle">
                            <thead class="table-dark">
                                <tr>
                                    <th>Order #</th>
                                    <th>Name</th>
                                    <th>Location</th>
                                    <th>Deadline</th>
                                    <th>Status</th>
                                    <th>Team</th>
                                </tr>
                            </thead>
                            <tbody>
                            <?php
                            $myOrders = array_filter($orders, function ($order) use ($loggedUserId) {
                                $ids = $order['assigned_user_ids'] ? explode(',', $order['assigned_user_ids']) : [];
                                return in_array((string)$loggedUserId, $ids, true);
                            });
                            ?>
                            <?php foreach ($myOrders as $order): ?>
                                <tr>
                                    <td><?= htmlspecialchars($order['order_number']) ?></td>
                                    <td><?= htmlspecialchars($order['order_name']) ?></td>
                                    <td><?= htmlspecialchars($order['location']) ?></td>
                                    <td><?= $order['deadline_datetime'] ? date('d M Y, H:i', strtotime($order['deadline_datetime'])) : '—' ?></td>
                                    <td><span class="badge <?= $statusBadgeClass[$order['status']] ?? 'bg-secondary' ?>"><?= htmlspecialchars($order['status']) ?></span></td>
                                    <td><?= htmlspecialchars($order['assigned_names'] ?: '') ?></td>
                                </tr>
                            <?php endforeach; ?>
                            <?php if (empty($myOrders)): ?>
                                <tr><td colspan="6" class="text-center text-muted py-4">No orders assigned to you.</td></tr>
                            <?php endif; ?>
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    </div>

    <!-- ============ Side column: Team roster ============ -->
    <div class="dash-col-side">
        <div class="dash-card">
            <div class="dash-card-head">
                <h5>Team</h5>
            </div>

            <input type="text" class="form-control form-control-sm mb-3" placeholder="Search team..." id="searchUser">

            <div id="teamList">
                <?php foreach ($allUsers as $u): ?>
                    <div class="team-card" data-user-id="<?= $u['user_id'] ?>">
                        <div class="team-card-head">
                            <div class="team-avatar"><?= strtoupper(substr($u['name'], 0, 1)) ?></div>
                            <div>
                                <p class="team-name"><?= htmlspecialchars($u['name'] . ' ' . $u['surname']) ?></p>
                                <p class="team-email"><?= htmlspecialchars($u['email']) ?></p>
                            </div>
                        </div>
                        <div class="team-foot">
                            <span><?= htmlspecialchars($u['user_type']) ?></span>
                            <span class="jobs-pill">Jobs: <?= $jobsByUser[$u['user_id']] ?? 0 ?></span>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
        </div>
    </div>

</div>

<script>
document.getElementById('searchUser').addEventListener('input', function () {
    const q = this.value.toLowerCase();
    document.querySelectorAll('#teamList .team-card').forEach(card => {
        card.style.display = card.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
});
</script>

<?php require_once 'includes/footerDashboard.php'; ?>
