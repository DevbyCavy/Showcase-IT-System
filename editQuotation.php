<?php
require_once 'php_action/auth_guard.php';
requireRole('Super Admin');
require_once 'php_action/db_connection.php';

$id = intval($_GET['id'] ?? 0);

$check = $conn->prepare("SELECT quotation_id FROM quotations WHERE quotation_id = ?");
$check->bind_param("i", $id);
$check->execute();
if ($check->get_result()->num_rows === 0) {
    die("Quotation not found");
}

require_once 'php_action/updateQuotation.php';

// Re-fetch fresh data (post-update if applicable)
$stmt = $conn->prepare("SELECT * FROM quotations WHERE quotation_id = ?");
$stmt->bind_param("i", $id);
$stmt->execute();
$quotation = $stmt->get_result()->fetch_assoc();

$itemStmt = $conn->prepare("SELECT * FROM quotation_items WHERE quotation_id = ? ORDER BY sort_order ASC");
$itemStmt->bind_param("i", $id);
$itemStmt->execute();
$items = [];
$itemsResult = $itemStmt->get_result();
while ($row = $itemsResult->fetch_assoc()) {
    $items[] = $row;
}
if (empty($items)) {
    $items[] = ['description' => '', 'quantity' => 1, 'unit_price' => 0];
}

$pageTitle = 'Edit Quotation';
require_once 'includes/sidebarSuper.php';
?>

<div class="dash-card mb-4">
    <div class="dash-card-head">
        <h5><i class="fas fa-pen me-2"></i>Edit Quotation <?= htmlspecialchars($quotation['quotation_number']) ?></h5>
        <span class="badge <?= $quotation['status'] === 'Approved' ? 'bg-success' : 'bg-warning text-dark' ?>">
            <?= htmlspecialchars($quotation['status']) ?>
        </span>
    </div>

    <?php foreach ($errors as $e): ?>
        <div class="alert alert-warning alert-dismissible fade show py-2" role="alert">
            <i class="fas fa-exclamation-triangle me-2"></i><?= htmlspecialchars($e) ?>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    <?php endforeach; ?>

    <?php if ($success): ?>
        <div class="alert alert-success alert-dismissible fade show py-2" role="alert">
            <i class="fas fa-check-circle me-2"></i><?= htmlspecialchars($success) ?>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    <?php endif; ?>

    <form method="POST" action="" enctype="multipart/form-data">

        <div class="row g-3">
            <div class="col-md-3">
                <label class="form-label fw-semibold">Quotation Number</label>
                <input type="text" class="form-control bg-light" value="<?= htmlspecialchars($quotation['quotation_number']) ?>" disabled>
            </div>
            <div class="col-md-3">
                <label class="form-label fw-semibold">Date <span class="text-danger">*</span></label>
                <input type="date" name="quote_date" class="form-control" value="<?= htmlspecialchars($quotation['quote_date']) ?>" required>
            </div>
            <div class="col-md-3">
                <label class="form-label fw-semibold">Order #</label>
                <input type="text" name="order_number" class="form-control" value="<?= htmlspecialchars($quotation['order_number']) ?>">
            </div>
            <div class="col-md-3">
                <label class="form-label fw-semibold">Customer ID</label>
                <input type="text" name="customer_id" class="form-control" value="<?= htmlspecialchars($quotation['customer_id']) ?>">
            </div>

            <div class="col-md-6">
                <label class="form-label fw-semibold">Customer Name <span class="text-danger">*</span></label>
                <input type="text" name="customer_name" class="form-control" value="<?= htmlspecialchars($quotation['customer_name']) ?>" required>
            </div>
            <div class="col-md-6">
                <label class="form-label fw-semibold">Project / Event Name</label>
                <input type="text" name="project_name" class="form-control" value="<?= htmlspecialchars($quotation['project_name']) ?>">
            </div>
        </div>

        <div class="mt-4">
            <label class="form-label fw-semibold">Items</label>
            <div class="table-responsive">
                <table class="table table-bordered align-middle quote-items-table" id="quote-items-table">
                    <thead class="table-dark">
                        <tr>
                            <th style="width:45%">Description</th>
                            <th style="width:15%">Quantity</th>
                            <th style="width:17%">Unit Price</th>
                            <th style="width:17%">Amount</th>
                            <th style="width:6%"></th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($items as $item): ?>
                        <tr>
                            <td><input type="text" name="item_description[]" class="form-control item-desc" value="<?= htmlspecialchars($item['description']) ?>"></td>
                            <td><input type="number" step="0.01" min="0" name="item_quantity[]" class="form-control item-qty" value="<?= htmlspecialchars($item['quantity']) ?>"></td>
                            <td><input type="number" step="0.01" min="0" name="item_unit_price[]" class="form-control item-price" value="<?= htmlspecialchars($item['unit_price']) ?>"></td>
                            <td><input type="text" class="form-control item-amount" value="0.00" disabled></td>
                            <td><button type="button" class="btn btn-outline-danger btn-sm quote-remove-row">&times;</button></td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="3" class="text-end fw-semibold">Subtotal</td>
                            <td id="quote-subtotal">0.00</td>
                            <td></td>
                        </tr>
                        <tr>
                            <td colspan="3" class="text-end fw-bold">TOTAL</td>
                            <td id="quote-total" class="fw-bold">0.00</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            <button type="button" class="btn btn-outline-secondary btn-sm" id="quote-add-row">
                <i class="fas fa-plus me-1"></i>Add Item
            </button>
        </div>

        <div class="row g-3 mt-1">
            <div class="col-md-8">
                <label class="form-label fw-semibold">Terms &amp; Conditions</label>
                <textarea name="terms_conditions" class="form-control" rows="7"><?= htmlspecialchars($quotation['terms_conditions']) ?></textarea>
            </div>
            <div class="col-md-4">
                <label class="form-label fw-semibold">Design Attachment</label>
                <?php if ($quotation['design_file']): ?>
                    <div class="mb-2">
                        <a href="<?= htmlspecialchars($quotation['design_file']) ?>" target="_blank">
                            <i class="fas fa-paperclip me-1"></i><?= htmlspecialchars(basename($quotation['design_file'])) ?>
                        </a>
                    </div>
                <?php endif; ?>
                <input type="file" name="design_file" class="form-control" accept="image/*,.pdf">
                <div class="form-text">Leave empty to keep the current attachment.</div>
            </div>
        </div>

        <button type="submit" name="quotation_update" class="btn w-100 mt-4" style="background:var(--brand-orange,#F15A2C); color:#fff; font-weight:600;">
            <i class="fas fa-save me-2"></i>Save Changes
        </button>

    </form>
</div>

<style>
.quote-items-table thead th { font-size: 0.85rem; }
.quote-items-table tfoot td { background: #f8f9fa; }
</style>

<script>
(function() {
    var table  = document.getElementById('quote-items-table');
    var addBtn = document.getElementById('quote-add-row');

    function recalcRow(row) {
        var qty   = parseFloat(row.querySelector('.item-qty').value) || 0;
        var price = parseFloat(row.querySelector('.item-price').value) || 0;
        var amount = qty * price;
        row.querySelector('.item-amount').value = amount.toFixed(2);
        return amount;
    }

    function recalcTotals() {
        var subtotal = 0;
        table.querySelectorAll('tbody tr').forEach(function(row) {
            subtotal += recalcRow(row);
        });
        document.getElementById('quote-subtotal').textContent = subtotal.toFixed(2);
        document.getElementById('quote-total').textContent = subtotal.toFixed(2);
    }

    table.addEventListener('input', function(e) {
        if (e.target.classList.contains('item-qty') || e.target.classList.contains('item-price')) {
            recalcTotals();
        }
    });

    addBtn.addEventListener('click', function() {
        var firstRow = table.querySelector('tbody tr');
        var newRow = firstRow.cloneNode(true);
        newRow.querySelectorAll('input').forEach(function(input) {
            if (input.classList.contains('item-qty')) input.value = '1';
            else if (input.classList.contains('item-amount')) input.value = '0.00';
            else input.value = '';
        });
        table.querySelector('tbody').appendChild(newRow);
    });

    table.addEventListener('click', function(e) {
        if (e.target.classList.contains('quote-remove-row')) {
            var tbody = table.querySelector('tbody');
            if (tbody.rows.length > 1) {
                e.target.closest('tr').remove();
                recalcTotals();
            }
        }
    });

    recalcTotals();
})();
</script>

<?php require_once 'includes/footerDashboard.php'; ?>
