<?php
require_once 'php_action/auth_guard.php';
requireRole('Marketer');

$pageTitle = 'Make Quotation';
require_once 'includes/header.php';
?>
<link rel="stylesheet" href="custom/css/custom.css">
<link rel="stylesheet" href="custom/css/modern-dashboard.css">
<div class="container-fluid px-4 mt-3">

<?php require_once 'php_action/createQuotation.php'; ?>

<div class="dash-card mb-4">
    <div class="dash-card-head">
        <h5><i class="fas fa-file-invoice-dollar me-2"></i>New Quotation</h5>
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
                <input type="text" class="form-control bg-light" value="<?= htmlspecialchars($nextQuoNo) ?>" disabled>
            </div>
            <div class="col-md-3">
                <label class="form-label fw-semibold">Date <span class="text-danger">*</span></label>
                <input type="date" name="quote_date" class="form-control"
                       value="<?= htmlspecialchars($_POST['quote_date'] ?? date('Y-m-d')) ?>" required>
            </div>
            <div class="col-md-3">
                <label class="form-label fw-semibold">Order #</label>
                <input type="text" name="order_number" class="form-control"
                       value="<?= htmlspecialchars($_POST['order_number'] ?? '') ?>">
            </div>
            <div class="col-md-3">
                <label class="form-label fw-semibold">Customer ID</label>
                <input type="text" name="customer_id" class="form-control"
                       value="<?= htmlspecialchars($_POST['customer_id'] ?? '') ?>">
            </div>

            <div class="col-md-6">
                <label class="form-label fw-semibold">Customer Name <span class="text-danger">*</span></label>
                <input type="text" name="customer_name" class="form-control"
                       placeholder="e.g. Minister Mahendere"
                       value="<?= htmlspecialchars($_POST['customer_name'] ?? '') ?>" required>
            </div>
            <div class="col-md-6">
                <label class="form-label fw-semibold">Project / Event Name</label>
                <input type="text" name="project_name" class="form-control"
                       placeholder="e.g. July Worship Festival"
                       value="<?= htmlspecialchars($_POST['project_name'] ?? '') ?>">
            </div>
        </div>

        <!-- ── Line items (spreadsheet-style grid) ── -->
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
                        <tr>
                            <td><input type="text" name="item_description[]" class="form-control item-desc"></td>
                            <td><input type="number" step="0.01" min="0" name="item_quantity[]" class="form-control item-qty" value="1"></td>
                            <td><input type="number" step="0.01" min="0" name="item_unit_price[]" class="form-control item-price" value="0"></td>
                            <td><input type="text" class="form-control item-amount" value="0.00" disabled></td>
                            <td><button type="button" class="btn btn-outline-danger btn-sm quote-remove-row">&times;</button></td>
                        </tr>
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
                <textarea name="terms_conditions" class="form-control" rows="7"><?= htmlspecialchars($_POST['terms_conditions'] ?? $defaultTerms) ?></textarea>
            </div>
            <div class="col-md-4">
                <label class="form-label fw-semibold">Design Attachment <span class="text-danger">*</span></label>
                <input type="file" name="design_file" class="form-control" accept="image/*,.pdf" required>
                <div class="form-text">Attach the design/artwork for this quotation (image or PDF).</div>
            </div>
        </div>

        <button type="submit" name="quotation_submit" class="btn w-100 mt-4" style="background:var(--brand-orange,#F15A2C); color:#fff; font-weight:600;">
            <i class="fas fa-paper-plane me-2"></i>Submit for Approval
        </button>

    </form>
</div>

<div class="dash-card mb-4">
    <div class="dash-card-head">
        <h5><i class="fas fa-list me-2"></i>My Submitted Quotations</h5>
        <input type="text" id="quoSearch" class="form-control form-control-sm w-auto"
               placeholder="Search..." style="max-width:200px;">
    </div>

    <div class="table-responsive">
        <table class="table table-hover align-middle mb-0" id="quoTable">
            <thead class="table-dark">
                <tr>
                    <th class="ps-3">Quotation #</th>
                    <th>Customer</th>
                    <th>Project</th>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th class="text-center">View</th>
                </tr>
            </thead>
            <tbody>
            <?php
            $myQuotes = $conn->prepare("SELECT * FROM quotations WHERE submitted_by = ? ORDER BY created_at DESC");
            $myQuotes->bind_param("i", $_SESSION['user_id']);
            $myQuotes->execute();
            $myQuotesResult = $myQuotes->get_result();

            if ($myQuotesResult && $myQuotesResult->num_rows > 0):
                while ($qt = $myQuotesResult->fetch_assoc()):
            ?>
            <tr>
                <td class="ps-3 fw-bold"><?= htmlspecialchars($qt['quotation_number']) ?></td>
                <td><?= htmlspecialchars($qt['customer_name']) ?></td>
                <td><?= htmlspecialchars($qt['project_name']) ?></td>
                <td><?= date('d M Y', strtotime($qt['quote_date'])) ?></td>
                <td>$<?= number_format($qt['total'], 2) ?></td>
                <td>
                    <span class="badge <?= $qt['status'] === 'Approved' ? 'bg-success' : 'bg-warning text-dark' ?>">
                        <?= htmlspecialchars($qt['status']) ?>
                    </span>
                </td>
                <td class="text-center">
                    <a href="viewQuotation.php?id=<?= $qt['quotation_id'] ?>" class="btn btn-sm btn-outline-primary" target="_blank">
                        <i class="fas fa-eye"></i>
                    </a>
                </td>
            </tr>
            <?php
                endwhile;
            else:
            ?>
            <tr>
                <td colspan="7" class="text-center text-muted py-4">
                    <i class="fas fa-inbox fa-2x d-block mb-2"></i>
                    No quotations submitted yet.
                </td>
            </tr>
            <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

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

document.getElementById('quoSearch').addEventListener('input', function() {
    const q = this.value.toLowerCase();
    document.querySelectorAll('#quoTable tbody tr').forEach(function(row) {
        row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
});
</script>

<?php require_once 'includes/footer.php'; ?>
