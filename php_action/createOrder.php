<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once 'db_connection.php';

$errors = [];
$success = '';

// Generate next auto order number (e.g., 001, 002...)
$query = $conn->query("SELECT MAX(CAST(order_number AS UNSIGNED)) AS max_no FROM orders");
$row = $query->fetch_assoc();
$nextOrderNo = $row['max_no'] ? str_pad($row['max_no'] + 1, 3, '0', STR_PAD_LEFT) : '001';

// Handle Form Submit
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['order_submit'])) {

    $order_number    = $nextOrderNo;
    $order_name      = trim($_POST['order_name']);
    $description     = trim($_POST['description']);
    $location        = trim($_POST['location']);
    $deadline_datetime = str_replace('T', ' ', $_POST['deadline_datetime']);
    $assigned_users  = isset($_POST['assigned_users']) ? $_POST['assigned_users'] : [];

    $status      = 'New';
    $boq_file    = '';
    $artwork_file = '';

    // --- FILE UPLOADS ---
    // Make sure the uploads folder exists
    if (!is_dir('uploads')) {
        mkdir('uploads', 0755, true);
    }

    if (!empty($_FILES['boq_file']['name'])) {
        $boq_file = 'uploads/boq_' . time() . '_' . basename($_FILES['boq_file']['name']);
        move_uploaded_file($_FILES['boq_file']['tmp_name'], $boq_file);
    }
    if (!empty($_FILES['artwork_file']['name'])) {
        $artwork_file = 'uploads/artwork_' . time() . '_' . basename($_FILES['artwork_file']['name']);
        move_uploaded_file($_FILES['artwork_file']['tmp_name'], $artwork_file);
    }

    // --- VALIDATION ---
    if ($order_name === '')      $errors[] = "Order Name is required";
    if ($location === '')        $errors[] = "Location is required";
    if (empty($assigned_users))  $errors[] = "Please assign at least one person";
    if ($deadline_datetime === '') $errors[] = "Deadline is required";

    // --- INSERT ORDER (no assigned_users column — uses order_assignments table) ---
    if (empty($errors)) {
        $conn->begin_transaction();
        try {
            // 1. Insert the order
            $stmt = $conn->prepare("
                INSERT INTO orders
                    (order_number, order_name, description, location, deadline_datetime, boq_file, artwork_file, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->bind_param(
                "ssssssss",
                $order_number, $order_name, $description, $location,
                $deadline_datetime, $boq_file, $artwork_file, $status
            );
            $stmt->execute();
            $newOrderId = $conn->insert_id;
            $stmt->close();

            // 2. Insert one row per assigned user into order_assignments
            $assignStmt = $conn->prepare("
                INSERT INTO order_assignments (order_id, user_id) VALUES (?, ?)
            ");
            foreach ($assigned_users as $userId) {
                $userId = intval($userId);
                if ($userId > 0) {
                    $assignStmt->bind_param("ii", $newOrderId, $userId);
                    $assignStmt->execute();
                }
            }
            $assignStmt->close();

            $conn->commit();
            $success = "Order #$order_number created successfully!";

        } catch (Exception $e) {
            $conn->rollback();
            $errors[] = "Failed to create order: " . $e->getMessage();
        }
    }
}
?>

<div class="container mt-3">

    <?php foreach ($errors as $error): ?>
        <div class="alert alert-warning"><?= htmlspecialchars($error) ?></div>
    <?php endforeach; ?>

    <?php if ($success): ?>
        <div class="alert alert-success"><?= htmlspecialchars($success) ?></div>
    <?php endif; ?>

    <form action="" method="POST" enctype="multipart/form-data">

        <div class="mb-3">
            <label class="form-label">Order Number</label>
            <input type="text" class="form-control" value="<?= htmlspecialchars($nextOrderNo) ?>" disabled>
        </div>

        <div class="mb-3">
            <label class="form-label">Order Name</label>
            <input type="text" name="order_name" class="form-control" required>
        </div>

        <div class="mb-3">
            <label class="form-label">Description</label>
            <textarea name="description" class="form-control" rows="3"></textarea>
        </div>

        <div class="mb-3">
            <label class="form-label">Location</label>
            <input type="text" name="location" class="form-control" required>
        </div>

        <div class="mb-3">
            <label class="form-label">Deadline (Date &amp; Time)</label>
            <input type="datetime-local" name="deadline_datetime" class="form-control" value="<?= date('Y-m-d\TH:i') ?>" required>
        </div>

        <!-- Multi User Assignment -->
        <div class="mb-3">
            <label class="form-label">Assign People</label>
            <small class="text-muted d-block mb-1">Hold Ctrl / Cmd to select multiple people</small>
            <select class="form-select" name="assigned_users[]" multiple required size="5">
                <?php
                $users = $conn->query("SELECT user_id, name, surname FROM users ORDER BY name ASC");
                while ($u = $users->fetch_assoc()): ?>
                    <option value="<?= $u['user_id'] ?>">
                        <?= htmlspecialchars($u['name'] . ' ' . $u['surname']) ?>
                    </option>
                <?php endwhile; ?>
            </select>
        </div>

        <div class="mb-3">
            <label class="form-label">B.O.Q File <span class="text-muted">(optional)</span></label>
            <input type="file" name="boq_file" class="form-control" accept=".pdf,.doc,.docx,.xls,.xlsx">
        </div>

        <div class="mb-3">
            <label class="form-label">Artwork File <span class="text-muted">(optional)</span></label>
            <input type="file" name="artwork_file" class="form-control" accept=".pdf,.jpg,.jpeg,.png,.ai,.eps,.svg">
        </div>

        <button type="submit" name="order_submit" class="btn w-100" style="background:#ff9100; color:white; font-weight:bold;">
            <i class="fas fa-plus me-2"></i>Add Order
        </button>

    </form>
</div>
