<?php
session_start();
require_once 'php_action/db_connection.php';

$loggedUserId = $_SESSION['user_id'];

// Fetch all orders, with assigned team names/ids via order_assignments
$result = $conn->query("
    SELECT o.*,
           GROUP_CONCAT(CONCAT(u.name, ' ', u.surname) ORDER BY u.name SEPARATOR '||') AS assigned_names,
           GROUP_CONCAT(u.user_id ORDER BY u.name SEPARATOR ',')                        AS assigned_user_ids
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

// Fetch all users for sidebar and assignment
$usersResult = $conn->query("SELECT user_id, name, surname, email FROM users ORDER BY name ASC");
$allUsers = [];
while ($u = $usersResult->fetch_assoc()) {
    $allUsers[] = $u;
}

// Keep the user on the tab whose form they just submitted
$activeTab = isset($_POST['boq_submit']) ? 'bill-of-quantities' : 'add-order';
?>

<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Manage Orders</title>
<link rel="stylesheet" href="assets/bootstrap/css/bootstrap.min.css">
<link rel="stylesheet" href="assets/font-awesome/css/all.min.css">
<style>
body { background-color: #f8f9fa; }
.main-container { display: flex; gap: 1rem; margin: 20px; justify-content: center; }

/* Sidebar */
.sidebar {
    width: 260px;
    background-color: #fff;
    border-radius: 0.5rem;
    padding: 15px;
    max-height: 90vh;
    overflow-y: auto;
}

/* User Cards */
.user-card {
    display: flex;
    flex-direction: column;
    background-color: #f9f9f9;
    border-radius: 0.75rem;
    padding: 12px;
    margin-bottom: 12px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}
.user-card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
.user-card-header i { font-size: 2.5rem; color: #6c757d; }
.user-name { font-weight: 700; font-size: 1rem; margin: 0; }
.user-surname { font-weight: 300; font-size: 0.85rem; color: #6c757d; margin: 0; }
.user-divider { border-top: 1px solid #dee2e6; margin: 8px 0; }
.user-info { display: flex; justify-content: space-between; font-size: 0.85rem; }

/* Content */
.content-area { width: 850px; }

/* Modern Tabs */
.modern-tabs {
    border-bottom: none;
    gap: 10px;
}
.modern-tab-btn {
    border: none;
    background: #f1f1f1;
    color: #444;
    padding: 12px 20px;
    border-radius: 15px 15px 0 0;
    font-weight: 600;
    transition: all 0.25s ease;
}
.modern-tab-btn:hover { background: #e0e0e0; }
.modern-tab-btn.active {
    background: #ff7b00 !important;
    color: #fff !important;
    box-shadow: 0px -2px 10px rgba(0,0,0,0.15);
    transform: translateY(-3px);
}

/* Breadcrumb */
.breadcrumb-custom {
    background: #fff;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

/* Table */
.table thead th {
    background-color: #ff7b00;
    color: #fff;
}
</style>
</head>
<body>

<?php include 'includes/header.php'; ?>

<div class="container-fluid p-4">
    <!-- Breadcrumb -->
    <div class="p-3 mx-4 mb-3 mt-3 rounded d-flex justify-content-between align-items-center breadcrumb-custom">
      <nav aria-label="breadcrumb" class="mb-0">
        <ol class="breadcrumb mb-0 d-flex align-items-center">
          <li class="breadcrumb-item">
            <a href="dashboard.php">Home</a>
          </li>
          <li class="breadcrumb-item active" aria-current="page">Manage Orders</li>
        </ol>
      </nav>
    </div>

    <div class="main-container">
        <!-- Content Area -->
        <div class="content-area">
            <h3 class="mb-4 fw-bold">Manage Orders</h3>

            <!-- Tabs -->
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

            <!-- Tab Content -->
            <div class="tab-content p-3">
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
                    <h5 class="mb-3">Edit Orders</h5>
                    <table class="table table-striped table-bordered">
                        <thead>
                            <tr>
                                <th>Order #</th>
                                <th>Name</th>
                                <th>Description</th>
                                <th>Location</th>
                                <th>Deadline</th>
                                <th>Assigned Users</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                        <?php foreach ($orders as $order): ?>
                            <tr>
                                <td><?= $order['order_number'] ?></td>
                                <td><?= $order['order_name'] ?></td>
                                <td><?= $order['description'] ?></td>
                                <td><?= $order['location'] ?></td>
                                <td><?= date('Y-m-d H:i', strtotime($order['deadline_datetime'])) ?></td>
                                <td>
                                    <?= !empty($order['assigned_names']) ? htmlspecialchars(implode(', ', explode('||', $order['assigned_names']))) : '' ?>
                                </td>
                                <td>
                                    <a href="editOrder.php?id=<?= $order['order_id'] ?>" class="btn btn-sm btn-warning"><i class="fas fa-edit"></i> Edit</a>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>

                <!-- VIEW ORDER -->
                <div class="tab-pane fade" id="view-order">
                    <h5 class="mb-3">View Orders Assigned to You</h5>
                    <table class="table table-striped table-bordered">
                        <thead>
                            <tr>
                                <th>Order #</th>
                                <th>Name</th>
                                <th>Description</th>
                                <th>Location</th>
                                <th>Deadline</th>
                                <th>Assigned Users</th>
                            </tr>
                        </thead>
                        <tbody>
                        <?php foreach ($orders as $order):
                            $assignedIds = !empty($order['assigned_user_ids']) ? explode(',', $order['assigned_user_ids']) : [];
                            if (in_array($loggedUserId, $assignedIds)):
                        ?>
                            <tr>
                                <td><?= $order['order_number'] ?></td>
                                <td><?= $order['order_name'] ?></td>
                                <td><?= $order['description'] ?></td>
                                <td><?= $order['location'] ?></td>
                                <td><?= date('Y-m-d H:i', strtotime($order['deadline_datetime'])) ?></td>
                                <td>
                                    <?= !empty($order['assigned_names']) ? htmlspecialchars(implode(', ', explode('||', $order['assigned_names']))) : '' ?>
                                </td>
                            </tr>
                        <?php endif; endforeach; ?>
                        </tbody>
                    </table>
                </div>
                
               
                
            </div>
        </div>

        <!-- Sidebar -->
        <div class="sidebar">
            <input type="text" class="form-control form-control-sm mb-3" placeholder="Search Users..." id="searchUser">

            <?php foreach ($allUsers as $u):
                $assignedCount = 0;
                foreach ($orders as $o) {
                    $assignedIds = explode(',', $o['assigned_users']);
                    if (in_array($u['user_id'], $assignedIds)) $assignedCount++;
                }
            ?>
            <div class="user-card" data-user-id="<?= $u['user_id'] ?>">
                <div class="user-card-header">
                    <i class="fas fa-user-circle"></i>
                    <div>
                        <p class="user-name"><?= $u['name'] ?></p>
                        <p class="user-surname"><?= $u['surname'] ?></p>
                    </div>
                </div>
                <div class="user-divider"></div>
                <div class="user-info">
                    <span><?= $u['email'] ?></span>
                    <span>Jobs: <?= $assignedCount ?></span>
                </div>
            </div>
            <?php endforeach; ?>
        </div>
    </div>
</div>

<script src="assets/bootstrap/js/bootstrap.bundle.min.js"></script>
<script>
// Sidebar user search
document.getElementById('searchUser').addEventListener('input', function () {
    const q = this.value.toLowerCase();
    document.querySelectorAll('.user-card').forEach(card => {
        const name = card.querySelector('.user-name').textContent.toLowerCase();
        const surname = card.querySelector('.user-surname').textContent.toLowerCase();
        card.style.display = name.includes(q) || surname.includes(q) ? "" : "none";
    });
});
</script>

</body>
</html>
