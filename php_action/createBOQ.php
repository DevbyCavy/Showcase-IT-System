<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once 'db_connection.php';

$boqErrors = [];
$boqSuccess = '';

// Generate next auto BOQ number (e.g., 001, 002...)
$boqNoQuery = $conn->query("SELECT MAX(CAST(boq_number AS UNSIGNED)) AS max_no FROM boq");
$boqNoRow = $boqNoQuery->fetch_assoc();
$nextBoqNo = $boqNoRow['max_no'] ? str_pad($boqNoRow['max_no'] + 1, 3, '0', STR_PAD_LEFT) : '001';

// Orders available to attach a BOQ to
$boqOrdersResult = $conn->query("SELECT order_id, order_number, order_name, location FROM orders ORDER BY order_id DESC");
$boqOrders = [];
while ($row = $boqOrdersResult->fetch_assoc()) {
    $boqOrders[] = $row;
}

// Handle Form Submit
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['boq_submit'])) {

    $boq_number  = $nextBoqNo;
    $order_id    = intval($_POST['order_id']);
    $event_name  = trim($_POST['event_name']);
    $client_name = trim($_POST['client_name']);
    $location    = trim($_POST['location']);

    $item_products     = $_POST['item_product_name'] ?? [];
    $item_descriptions = $_POST['item_description'] ?? [];
    $item_units        = $_POST['item_unit'] ?? [];
    $item_quantities   = $_POST['item_quantity'] ?? [];

    // --- VALIDATION ---
    if ($order_id <= 0)      $boqErrors[] = "Please select an order";
    if ($event_name === '')  $boqErrors[] = "Name of Event is required";
    if ($location === '')    $boqErrors[] = "Location is required";

    $hasItem = false;
    foreach ($item_products as $i => $name) {
        if (trim($name) !== '') {
            $hasItem = true;
            break;
        }
    }
    if (!$hasItem) $boqErrors[] = "Please add at least one item";

    $order_number = '';
    if ($order_id > 0) {
        foreach ($boqOrders as $o) {
            if ($o['order_id'] == $order_id) {
                $order_number = $o['order_number'];
                break;
            }
        }
        if ($order_number === '') $boqErrors[] = "Selected order could not be found";
    }

    // --- INSERT BOQ + ITEMS ---
    if (empty($boqErrors)) {
        $conn->begin_transaction();
        try {
            $stmt = $conn->prepare("
                INSERT INTO boq
                    (boq_number, order_id, order_number, event_name, client_name, location, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            $createdBy = $_SESSION['user_id'];
            $stmt->bind_param(
                "sissssi",
                $boq_number, $order_id, $order_number, $event_name, $client_name, $location, $createdBy
            );
            $stmt->execute();
            $newBoqId = $conn->insert_id;
            $stmt->close();

            $itemStmt = $conn->prepare("
                INSERT INTO boq_items (boq_id, product_name, description, unit, quantity)
                VALUES (?, ?, ?, ?, ?)
            ");
            foreach ($item_products as $i => $name) {
                $name = trim($name);
                if ($name === '') continue;

                $description = trim($item_descriptions[$i] ?? '');
                $unit        = trim($item_units[$i] ?? '');
                $quantity    = floatval($item_quantities[$i] ?? 0);

                $itemStmt->bind_param("isssd", $newBoqId, $name, $description, $unit, $quantity);
                $itemStmt->execute();
            }
            $itemStmt->close();

            $conn->commit();
            $boqSuccess = "BOQ #$boq_number saved successfully!";

            // Refresh next number / list after a successful save
            $boqNoQuery = $conn->query("SELECT MAX(CAST(boq_number AS UNSIGNED)) AS max_no FROM boq");
            $boqNoRow = $boqNoQuery->fetch_assoc();
            $nextBoqNo = $boqNoRow['max_no'] ? str_pad($boqNoRow['max_no'] + 1, 3, '0', STR_PAD_LEFT) : '001';

        } catch (Exception $e) {
            $conn->rollback();
            $boqErrors[] = "Failed to save BOQ: " . $e->getMessage();
        }
    }
}

// Existing BOQs for the list below the form
$boqListResult = $conn->query("SELECT * FROM boq ORDER BY boq_id DESC");
$boqList = [];
while ($row = $boqListResult->fetch_assoc()) {
    $boqList[] = $row;
}
?>

<div class="container mt-3">

    <?php foreach ($boqErrors as $error): ?>
        <div class="alert alert-warning"><?= htmlspecialchars($error) ?></div>
    <?php endforeach; ?>

    <?php if ($boqSuccess): ?>
        <div class="alert alert-success"><?= htmlspecialchars($boqSuccess) ?></div>
    <?php endif; ?>

    <form action="" method="POST">

        <div class="mb-3">
            <label class="form-label">BOQ Number</label>
            <input type="text" class="form-control" value="<?= htmlspecialchars($nextBoqNo) ?>" disabled>
        </div>

        <div class="mb-3">
            <label class="form-label">Order</label>
            <select class="form-select" name="order_id" required>
                <option value="">-- Select Order --</option>
                <?php foreach ($boqOrders as $o): ?>
                    <option value="<?= $o['order_id'] ?>" data-location="<?= htmlspecialchars($o['location']) ?>">
                        <?= htmlspecialchars($o['order_number'] . ' - ' . $o['order_name']) ?>
                    </option>
                <?php endforeach; ?>
            </select>
        </div>

        <div class="mb-3">
            <label class="form-label">Name Of Event</label>
            <input type="text" name="event_name" class="form-control" required>
        </div>

        <div class="mb-3">
            <label class="form-label">Client Name <span class="text-muted">(optional)</span></label>
            <input type="text" name="client_name" class="form-control">
        </div>

        <div class="mb-3">
            <label class="form-label">Location</label>
            <input type="text" name="location" id="boq_location" class="form-control" required>
        </div>

        <!-- BOQ Items -->
        <div class="mb-3">
            <label class="form-label">Items</label>
            <table class="table table-bordered" id="boq-items-table">
                <thead>
                    <tr>
                        <th style="width:25%">Product Name</th>
                        <th style="width:35%">Description</th>
                        <th style="width:15%">Unit</th>
                        <th style="width:15%">Quantity</th>
                        <th style="width:10%"></th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><input type="text" name="item_product_name[]" class="form-control"></td>
                        <td><input type="text" name="item_description[]" class="form-control"></td>
                        <td><input type="text" name="item_unit[]" class="form-control"></td>
                        <td><input type="number" step="0.001" min="0" name="item_quantity[]" class="form-control"></td>
                        <td><button type="button" class="btn btn-outline-danger btn-sm boq-remove-row">&times;</button></td>
                    </tr>
                </tbody>
            </table>
            <button type="button" class="btn btn-outline-secondary btn-sm" id="boq-add-row">
                <i class="fas fa-plus me-1"></i>Add Item
            </button>
        </div>

        <button type="submit" name="boq_submit" class="btn w-100" style="background:#ff9100; color:white; font-weight:bold;">
            <i class="fas fa-save me-2"></i>Save BOQ
        </button>

    </form>

    <hr class="my-4">

    <h5 class="mb-3">Saved Bills Of Quantities</h5>
    <table class="table table-striped table-bordered">
        <thead>
            <tr>
                <th>BOQ #</th>
                <th>Order #</th>
                <th>Event</th>
                <th>Client</th>
                <th>Location</th>
                <th>Date Created</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($boqList as $b): ?>
                <tr>
                    <td><?= htmlspecialchars($b['boq_number']) ?></td>
                    <td><?= htmlspecialchars($b['order_number']) ?></td>
                    <td><?= htmlspecialchars($b['event_name']) ?></td>
                    <td><?= htmlspecialchars($b['client_name']) ?></td>
                    <td><?= htmlspecialchars($b['location']) ?></td>
                    <td><?= htmlspecialchars($b['created_at']) ?></td>
                    <td>
                        <a href="php_action/downloadBOQ.php?id=<?= $b['boq_id'] ?>" target="_blank" class="btn btn-sm btn-outline-secondary">
                            <i class="fas fa-file-pdf me-1"></i>PDF
                        </a>
                    </td>
                </tr>
            <?php endforeach; ?>
            <?php if (empty($boqList)): ?>
                <tr>
                    <td colspan="7" class="text-center text-muted">No BOQs saved yet</td>
                </tr>
            <?php endif; ?>
        </tbody>
    </table>
</div>

<script>
(function() {
    var table = document.getElementById('boq-items-table');
    var addBtn = document.getElementById('boq-add-row');
    var orderSelect = document.querySelector('select[name="order_id"]');
    var locationInput = document.getElementById('boq_location');

    addBtn.addEventListener('click', function() {
        var firstRow = table.querySelector('tbody tr');
        var newRow = firstRow.cloneNode(true);
        newRow.querySelectorAll('input').forEach(function(input) {
            input.value = '';
        });
        table.querySelector('tbody').appendChild(newRow);
    });

    table.addEventListener('click', function(e) {
        if (e.target.classList.contains('boq-remove-row')) {
            var tbody = table.querySelector('tbody');
            if (tbody.rows.length > 1) {
                e.target.closest('tr').remove();
            }
        }
    });

    if (orderSelect && locationInput) {
        orderSelect.addEventListener('change', function() {
            var selected = orderSelect.options[orderSelect.selectedIndex];
            var loc = selected ? selected.getAttribute('data-location') : '';
            if (loc) locationInput.value = loc;
        });
    }
})();
</script>
