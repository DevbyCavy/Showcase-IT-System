<?php
require_once 'php_action/auth_guard.php';
requireRole('Super Admin');
require_once 'php_action/db_connection.php';

$pendingCount = $conn->query("SELECT COUNT(*) AS c FROM quotations WHERE status = 'Pending'")->fetch_assoc()['c'];

$pageTitle = 'Process Quotations';
require_once 'includes/sidebarSuper.php';
?>

<div class="dash-card">
    <div class="dash-card-head">
        <h5>Process Quotations</h5>
        <span class="count-pill"><?= $pendingCount ?> Pending</span>
    </div>

    <!-- Tabs: Pending | All -->
    <ul class="nav nav-tabs modern-tabs">
        <li class="nav-item position-relative">
            <button class="nav-link modern-tab-btn active" data-bs-toggle="tab" data-bs-target="#pending-tab">
                <i class="fas fa-clock me-1"></i> Pending
            </button>
            <span class="tab-badge" id="pending-badge"><?= $pendingCount ?></span>
        </li>
        <li class="nav-item">
            <button class="nav-link modern-tab-btn" data-bs-toggle="tab" data-bs-target="#all-tab">
                <i class="fas fa-list me-1"></i> All Quotations
            </button>
        </li>
    </ul>

    <div class="tab-content pt-3">

        <!-- ── PENDING TAB ── -->
        <div class="tab-pane fade show active" id="pending-tab">
            <div class="d-flex justify-content-end mb-2">
                <input type="text" class="form-control form-control-sm" id="pendingSearch"
                       placeholder="Search..." style="max-width:200px;">
            </div>
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0" id="pendingTable">
                    <thead class="table-dark">
                        <tr>
                            <th class="ps-3">Quotation #</th>
                            <th>Customer</th>
                            <th>Project</th>
                            <th>Date</th>
                            <th>Total</th>
                            <th>Submitted by</th>
                            <th class="text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody id="pending-tbody">
                    <?php
                    $pending = $conn->query("
                        SELECT q.*, u.name AS sub_name, u.surname AS sub_surname
                        FROM quotations q
                        LEFT JOIN users u ON q.submitted_by = u.user_id
                        WHERE q.status = 'Pending'
                        ORDER BY q.created_at ASC
                    ");

                    if ($pending && $pending->num_rows > 0):
                        while ($qt = $pending->fetch_assoc()):
                    ?>
                    <tr id="quo-row-<?= $qt['quotation_id'] ?>">
                        <td class="ps-3 fw-bold"><?= htmlspecialchars($qt['quotation_number']) ?></td>
                        <td><?= htmlspecialchars($qt['customer_name']) ?></td>
                        <td><?= htmlspecialchars($qt['project_name']) ?></td>
                        <td><?= date('d M Y', strtotime($qt['quote_date'])) ?></td>
                        <td>$<?= number_format($qt['total'], 2) ?></td>
                        <td><?= htmlspecialchars(trim($qt['sub_name'] . ' ' . $qt['sub_surname'])) ?></td>
                        <td class="text-center">
                            <a href="viewQuotation.php?id=<?= $qt['quotation_id'] ?>" class="btn btn-sm btn-outline-primary me-1" target="_blank" title="View">
                                <i class="fas fa-eye"></i>
                            </a>
                            <button class="btn btn-sm btn-success approve-btn"
                                    data-id="<?= $qt['quotation_id'] ?>"
                                    data-ref="<?= htmlspecialchars($qt['quotation_number']) ?>"
                                    title="Approve">
                                <i class="fas fa-check me-1"></i> Approve
                            </button>
                        </td>
                    </tr>
                    <?php
                        endwhile;
                    else:
                    ?>
                    <tr id="no-pending-row">
                        <td colspan="7" class="text-center text-muted py-5">
                            <i class="fas fa-check-circle fa-3x d-block mb-2 text-success"></i>
                            All quotations have been approved.
                        </td>
                    </tr>
                    <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- ── ALL QUOTATIONS TAB ── -->
        <div class="tab-pane fade" id="all-tab">
            <div class="d-flex justify-content-end mb-2">
                <input type="text" class="form-control form-control-sm" id="allSearch"
                       placeholder="Search..." style="max-width:200px;">
            </div>
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0" id="allTable">
                    <thead class="table-dark">
                        <tr>
                            <th class="ps-3">Quotation #</th>
                            <th>Customer</th>
                            <th>Project</th>
                            <th>Date</th>
                            <th>Total</th>
                            <th>Submitted by</th>
                            <th>Status</th>
                            <th class="text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                    <?php
                    $all = $conn->query("
                        SELECT q.*,
                               u.name AS sub_name, u.surname AS sub_surname
                        FROM quotations q
                        LEFT JOIN users u ON q.submitted_by = u.user_id
                        ORDER BY q.created_at DESC
                    ");

                    if ($all && $all->num_rows > 0):
                        while ($qt = $all->fetch_assoc()):
                            $statusClass = $qt['status'] === 'Approved' ? 'bg-success' : 'bg-warning text-dark';
                    ?>
                    <tr>
                        <td class="ps-3 fw-bold"><?= htmlspecialchars($qt['quotation_number']) ?></td>
                        <td><?= htmlspecialchars($qt['customer_name']) ?></td>
                        <td><?= htmlspecialchars($qt['project_name']) ?></td>
                        <td><?= date('d M Y', strtotime($qt['quote_date'])) ?></td>
                        <td>$<?= number_format($qt['total'], 2) ?></td>
                        <td><?= htmlspecialchars(trim($qt['sub_name'] . ' ' . $qt['sub_surname'])) ?></td>
                        <td><span class="badge <?= $statusClass ?>"><?= htmlspecialchars($qt['status']) ?></span></td>
                        <td class="text-center">
                            <a href="viewQuotation.php?id=<?= $qt['quotation_id'] ?>" class="btn btn-sm btn-outline-primary me-1" target="_blank" title="View">
                                <i class="fas fa-eye"></i>
                            </a>
                            <?php if ($qt['status'] === 'Approved'): ?>
                                <a href="editQuotation.php?id=<?= $qt['quotation_id'] ?>" class="btn btn-sm btn-outline-secondary" title="Edit">
                                    <i class="fas fa-pen"></i> Edit
                                </a>
                            <?php endif; ?>
                        </td>
                    </tr>
                    <?php
                        endwhile;
                    else:
                    ?>
                    <tr>
                        <td colspan="8" class="text-center text-muted py-4">No quotations found.</td>
                    </tr>
                    <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>

    </div><!-- /tab-content -->
</div>

<!-- ── Confirm Approve Modal ── -->
<div class="modal fade" id="confirmApproveModal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow">
            <div class="modal-header text-white" style="background:linear-gradient(135deg, var(--brand-orange), var(--brand-orange-dark));">
                <h5 class="modal-title"><i class="fas fa-file-invoice-dollar me-2"></i>Confirm Approval</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body text-center py-4">
                <i class="fas fa-check-circle fa-3x text-success mb-3 d-block"></i>
                <p class="mb-1">Approve quotation</p>
                <p class="fw-bold fs-5" id="confirmQuoRef"></p>
                <p class="text-muted">This will mark it as <strong>Approved</strong>.</p>
            </div>
            <div class="modal-footer justify-content-center">
                <button type="button" class="btn btn-secondary px-4" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-success px-4" id="confirmApproveBtn">
                    <i class="fas fa-check me-1"></i> Yes, Approve It
                </button>
            </div>
        </div>
    </div>
</div>

<script>
document.getElementById('pendingSearch').addEventListener('input', function () {
    const q = this.value.toLowerCase();
    document.querySelectorAll('#pendingTable tbody tr').forEach(r => {
        r.style.display = r.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
});
document.getElementById('allSearch').addEventListener('input', function () {
    const q = this.value.toLowerCase();
    document.querySelectorAll('#allTable tbody tr').forEach(r => {
        r.style.display = r.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
});

let pendingQuoId = null;

document.querySelectorAll('.approve-btn').forEach(btn => {
    btn.addEventListener('click', function () {
        pendingQuoId = this.dataset.id;
        document.getElementById('confirmQuoRef').textContent = this.dataset.ref;
        new bootstrap.Modal(document.getElementById('confirmApproveModal')).show();
    });
});

document.getElementById('confirmApproveBtn').addEventListener('click', function () {
    if (!pendingQuoId) return;

    const btn = this;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Approving...';

    fetch('php_action/processQuotation.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'quotation_id=' + pendingQuoId
    })
    .then(r => r.json())
    .then(data => {
        bootstrap.Modal.getInstance(document.getElementById('confirmApproveModal')).hide();

        if (data.success) {
            const row = document.getElementById('quo-row-' + pendingQuoId);
            if (row) {
                row.style.transition = 'opacity 0.4s';
                row.style.opacity    = '0';
                setTimeout(() => {
                    row.remove();
                    const badge = document.getElementById('pending-badge');
                    const count = document.querySelectorAll('#pending-tbody tr[id^="quo-row-"]').length;
                    badge.textContent = count;

                    if (count === 0) {
                        document.getElementById('pending-tbody').innerHTML = `
                            <tr id="no-pending-row">
                                <td colspan="7" class="text-center text-muted py-5">
                                    <i class="fas fa-check-circle fa-3x d-block mb-2 text-success"></i>
                                    All quotations have been approved.
                                </td>
                            </tr>`;
                    }
                }, 400);
            }
        } else {
            alert('Error: ' + (data.error || 'Something went wrong.'));
        }

        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check me-1"></i> Yes, Approve It';
        pendingQuoId  = null;
    })
    .catch(err => {
        console.error(err);
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check me-1"></i> Yes, Approve It';
    });
});
</script>

<?php require_once 'includes/footerDashboard.php'; ?>
