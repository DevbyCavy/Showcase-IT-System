<?php
require_once 'php_action/auth_guard.php';
requireRole('Super Admin');
require_once 'includes/header.php';
require_once 'php_action/db_connection.php';
?>

<link rel="stylesheet" href="custom/css/custom.css">

<div class="container-fluid px-4 mt-3">

    <!-- Breadcrumb -->
    <div class="p-3 mb-3 rounded d-flex justify-content-between align-items-center breadcrumb-custom">
        <nav aria-label="breadcrumb" class="mb-0">
            <ol class="breadcrumb mb-0 d-flex align-items-center">
                <li class="breadcrumb-item"><a href="superDashboard.php">Home</a></li>
                <li class="breadcrumb-item"><a href="requisitions.php">Requisitions</a></li>
                <li class="breadcrumb-item active">Process Requisitions</li>
            </ol>
        </nav>
        <?php
        $pendingCount = $conn->query("SELECT COUNT(*) AS c FROM requisitions WHERE status = 'Pending'")->fetch_assoc()['c'];
        ?>
        <span class="badge fs-6" style="background:#ff7b00;">
            <?= $pendingCount ?> Pending
        </span>
    </div>

    <!-- Tabs: Pending | All -->
    <ul class="nav nav-tabs modern-tabs mb-0">
        <li class="nav-item position-relative">
            <button class="nav-link modern-tab-btn active" data-bs-toggle="tab" data-bs-target="#pending-tab">
                <i class="fas fa-clock me-1"></i> Pending
            </button>
            <span class="tab-badge" id="pending-badge"><?= $pendingCount ?></span>
        </li>
        <li class="nav-item">
            <button class="nav-link modern-tab-btn" data-bs-toggle="tab" data-bs-target="#all-tab">
                <i class="fas fa-list me-1"></i> All Requisitions
            </button>
        </li>
    </ul>

    <div class="tab-content">

        <!-- ── PENDING TAB ── -->
        <div class="tab-pane fade show active" id="pending-tab">
            <div class="card shadow-sm" style="border-top: 4px solid #ff7b00; border-radius: 0 0 8px 8px;">
                <div class="card-header d-flex justify-content-between align-items-center"
                     style="background:#fff3e0;">
                    <span class="fw-bold text-dark">
                        <i class="fas fa-hourglass-half me-2 text-warning"></i>Awaiting Processing
                    </span>
                    <input type="text" class="form-control form-control-sm" id="pendingSearch"
                           placeholder="Search..." style="max-width:200px;">
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover align-middle mb-0" id="pendingTable">
                            <thead style="background:#fff3e0;">
                                <tr>
                                    <th class="ps-3">Req #</th>
                                    <th>Project Manager</th>
                                    <th>Event</th>
                                    <th>Location</th>
                                    <th>Date</th>
                                    <th>Type</th>
                                    <th>Submitted by</th>
                                    <th class="text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody id="pending-tbody">
                            <?php
                            $pending = $conn->query("
                                SELECT r.*, u.name AS sub_name, u.surname AS sub_surname
                                FROM requisitions r
                                LEFT JOIN users u ON r.submitted_by = u.user_id
                                WHERE r.status = 'Pending'
                                ORDER BY r.created_at ASC
                            ");

                            if ($pending && $pending->num_rows > 0):
                                while ($r = $pending->fetch_assoc()):
                            ?>
                            <tr id="req-row-<?= $r['requisition_id'] ?>">
                                <td class="ps-3 fw-bold"><?= htmlspecialchars($r['req_number']) ?></td>
                                <td><?= htmlspecialchars($r['project_manager']) ?></td>
                                <td><?= htmlspecialchars($r['event_name']) ?></td>
                                <td><?= htmlspecialchars($r['location']) ?></td>
                                <td><?= date('d M Y', strtotime($r['event_date'])) ?></td>
                                <td>
                                    <span class="badge bg-secondary">
                                        <?= htmlspecialchars($r['req_type']) ?>
                                    </span>
                                </td>
                                <td><?= htmlspecialchars(trim($r['sub_name'] . ' ' . $r['sub_surname'])) ?></td>
                                <td class="text-center">
                                    <button class="btn btn-sm btn-outline-primary me-1"
                                            onclick="viewRequisition(<?= $r['requisition_id'] ?>)"
                                            title="View details">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn btn-sm btn-success process-btn"
                                            data-id="<?= $r['requisition_id'] ?>"
                                            data-ref="<?= htmlspecialchars($r['req_number']) ?>"
                                            title="Mark as Processed">
                                        <i class="fas fa-check me-1"></i> Process
                                    </button>
                                </td>
                            </tr>
                            <?php
                                endwhile;
                            else:
                            ?>
                            <tr id="no-pending-row">
                                <td colspan="8" class="text-center text-muted py-5">
                                    <i class="fas fa-check-circle fa-3x d-block mb-2 text-success"></i>
                                    All requisitions have been processed.
                                </td>
                            </tr>
                            <?php endif; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <!-- ── ALL REQUISITIONS TAB ── -->
        <div class="tab-pane fade" id="all-tab">
            <div class="card shadow-sm" style="border-top: 4px solid #ff7b00; border-radius: 0 0 8px 8px;">
                <div class="card-header d-flex justify-content-between align-items-center"
                     style="background:#fff3e0;">
                    <span class="fw-bold text-dark">
                        <i class="fas fa-list me-2"></i>All Requisitions
                    </span>
                    <input type="text" class="form-control form-control-sm" id="allSearch"
                           placeholder="Search..." style="max-width:200px;">
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover align-middle mb-0" id="allTable">
                            <thead style="background:#fff3e0;">
                                <tr>
                                    <th class="ps-3">Req #</th>
                                    <th>Project Manager</th>
                                    <th>Event</th>
                                    <th>Date</th>
                                    <th>Type</th>
                                    <th>Submitted by</th>
                                    <th>Status</th>
                                    <th>Processed by</th>
                                    <th class="text-center">View</th>
                                </tr>
                            </thead>
                            <tbody>
                            <?php
                            $all = $conn->query("
                                SELECT r.*,
                                       u.name AS sub_name, u.surname AS sub_surname,
                                       p.name AS proc_name, p.surname AS proc_surname
                                FROM requisitions r
                                LEFT JOIN users u ON r.submitted_by = u.user_id
                                LEFT JOIN users p ON r.processed_by = p.user_id
                                ORDER BY r.created_at DESC
                            ");

                            if ($all && $all->num_rows > 0):
                                while ($r = $all->fetch_assoc()):
                                    $statusClass = match($r['status']) {
                                        'Processed' => 'bg-success',
                                        'Approved'  => 'bg-primary',
                                        'Rejected'  => 'bg-danger',
                                        default     => 'bg-warning text-dark',
                                    };
                            ?>
                            <tr>
                                <td class="ps-3 fw-bold"><?= htmlspecialchars($r['req_number']) ?></td>
                                <td><?= htmlspecialchars($r['project_manager']) ?></td>
                                <td>
                                    <?= htmlspecialchars($r['event_name']) ?>
                                    <div class="text-muted small">
                                        <i class="fas fa-map-marker-alt me-1"></i><?= htmlspecialchars($r['location']) ?>
                                    </div>
                                </td>
                                <td><?= date('d M Y', strtotime($r['event_date'])) ?></td>
                                <td><span class="badge bg-secondary"><?= htmlspecialchars($r['req_type']) ?></span></td>
                                <td><?= htmlspecialchars(trim($r['sub_name'] . ' ' . $r['sub_surname'])) ?></td>
                                <td><span class="badge <?= $statusClass ?>"><?= htmlspecialchars($r['status']) ?></span></td>
                                <td>
                                    <?php if ($r['proc_name']): ?>
                                        <?= htmlspecialchars(trim($r['proc_name'] . ' ' . $r['proc_surname'])) ?>
                                        <div class="text-muted small">
                                            <?= $r['processed_at'] ? date('d M Y H:i', strtotime($r['processed_at'])) : '' ?>
                                        </div>
                                    <?php else: ?>
                                        <span class="text-muted">—</span>
                                    <?php endif; ?>
                                </td>
                                <td class="text-center">
                                    <button class="btn btn-sm btn-outline-primary"
                                            onclick="viewRequisition(<?= $r['requisition_id'] ?>)">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </td>
                            </tr>
                            <?php
                                endwhile;
                            else:
                            ?>
                            <tr>
                                <td colspan="9" class="text-center text-muted py-4">No requisitions found.</td>
                            </tr>
                            <?php endif; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

    </div><!-- /tab-content -->
</div>

<!-- ── Detail Modal ── -->
<div class="modal fade" id="reqDetailModal" tabindex="-1">
    <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg">
            <div class="modal-header text-white" style="background:#ff7b00;">
                <h5 class="modal-title">
                    <i class="fas fa-file-signature me-2"></i>
                    Requisition Details
                </h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body" id="reqDetailBody">
                <div class="text-center py-4">
                    <i class="fas fa-spinner fa-spin fa-2x text-warning"></i>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            </div>
        </div>
    </div>
</div>

<!-- ── Confirm Process Modal ── -->
<div class="modal fade" id="confirmProcessModal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow">
            <div class="modal-header" style="background:#ff7b00; color:#fff;">
                <h5 class="modal-title"><i class="fas fa-tasks me-2"></i>Confirm Processing</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body text-center py-4">
                <i class="fas fa-check-circle fa-3x text-success mb-3 d-block"></i>
                <p class="mb-1">Mark requisition</p>
                <p class="fw-bold fs-5" id="confirmReqRef"></p>
                <p class="text-muted">as <strong>Processed</strong>?</p>
                <p class="small text-muted">This action cannot be undone.</p>
            </div>
            <div class="modal-footer justify-content-center">
                <button type="button" class="btn btn-secondary px-4" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-success px-4" id="confirmProcessBtn">
                    <i class="fas fa-check me-1"></i> Yes, Process It
                </button>
            </div>
        </div>
    </div>
</div>

<style>
.modern-tabs { border-bottom: none; gap: 10px; }
.modern-tab-btn {
    border: none; background: #f1f1f1; color: #444;
    padding: 12px 20px; border-radius: 15px 15px 0 0;
    font-weight: 600; transition: all 0.25s ease;
}
.modern-tab-btn:hover { background: #e0e0e0; }
.modern-tab-btn.active {
    background: #ff7b00 !important; color: #fff !important;
    box-shadow: 0px -2px 10px rgba(0,0,0,0.15); transform: translateY(-3px);
}
.nav-tabs { border-bottom: 0 !important; }
.tab-badge {
    position: absolute; top: -5px; right: -5px;
    background: #ff3b3b; color: #fff; font-size: 0.7rem; font-weight: bold;
    width: 20px; height: 20px; border-radius: 50%;
    display: flex; justify-content: center; align-items: center;
}
.breadcrumb-custom { background: #fff; box-shadow: 0 2px 5px rgba(0,0,0,0.08); }
</style>

<script>
// ── Live search ──
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

// ── View detail modal ──
const allReqs = <?php
    $allForJs = $conn->query("
        SELECT r.*, u.name AS sub_name, u.surname AS sub_surname
        FROM requisitions r
        LEFT JOIN users u ON r.submitted_by = u.user_id
        ORDER BY r.requisition_id DESC
    ");
    $jsData = [];
    while ($row = $allForJs->fetch_assoc()) $jsData[] = $row;
    echo json_encode($jsData);
?>;

function viewRequisition(id) {
    const r = allReqs.find(x => x.requisition_id == id);
    if (!r) return;

    document.getElementById('reqDetailBody').innerHTML = `
        <div class="row g-3">
            <div class="col-sm-6">
                <p class="text-muted small mb-0">Requisition Number</p>
                <p class="fw-bold">${r.req_number}</p>
            </div>
            <div class="col-sm-6">
                <p class="text-muted small mb-0">Status</p>
                <p><span class="badge ${r.status === 'Processed' ? 'bg-success' : r.status === 'Pending' ? 'bg-warning text-dark' : 'bg-secondary'}">${r.status}</span></p>
            </div>
            <div class="col-sm-6">
                <p class="text-muted small mb-0">Project Manager</p>
                <p class="fw-semibold">${r.project_manager}</p>
            </div>
            <div class="col-sm-6">
                <p class="text-muted small mb-0">Submitted by</p>
                <p class="fw-semibold">${(r.sub_name || '') + ' ' + (r.sub_surname || '')}</p>
            </div>
            <div class="col-sm-6">
                <p class="text-muted small mb-0">Event Name</p>
                <p class="fw-semibold">${r.event_name}</p>
            </div>
            <div class="col-sm-6">
                <p class="text-muted small mb-0">Location</p>
                <p class="fw-semibold">${r.location}</p>
            </div>
            <div class="col-sm-6">
                <p class="text-muted small mb-0">Event Date</p>
                <p class="fw-semibold">${r.event_date}</p>
            </div>
            <div class="col-sm-6">
                <p class="text-muted small mb-0">Type of Requisition</p>
                <p><span class="badge bg-secondary">${r.req_type}</span></p>
            </div>
            <div class="col-12">
                <p class="text-muted small mb-0">Team Members</p>
                <p class="fw-semibold">${r.team_members || '—'}</p>
            </div>
        </div>
    `;
    new bootstrap.Modal(document.getElementById('reqDetailModal')).show();
}

// ── Process button → confirm modal ──
let pendingReqId = null;

document.querySelectorAll('.process-btn').forEach(btn => {
    btn.addEventListener('click', function () {
        pendingReqId = this.dataset.id;
        document.getElementById('confirmReqRef').textContent = this.dataset.ref;
        new bootstrap.Modal(document.getElementById('confirmProcessModal')).show();
    });
});

document.getElementById('confirmProcessBtn').addEventListener('click', function () {
    if (!pendingReqId) return;

    const btn = this;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Processing...';

    fetch('php_action/processRequisition.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'requisition_id=' + pendingReqId
    })
    .then(r => r.json())
    .then(data => {
        bootstrap.Modal.getInstance(document.getElementById('confirmProcessModal')).hide();

        if (data.success) {
            // Remove the row from pending table with a fade
            const row = document.getElementById('req-row-' + pendingReqId);
            if (row) {
                row.style.transition = 'opacity 0.4s';
                row.style.opacity    = '0';
                setTimeout(() => {
                    row.remove();
                    // Update badge count
                    const badge = document.getElementById('pending-badge');
                    const count = document.querySelectorAll('#pending-tbody tr[id^="req-row-"]').length;
                    badge.textContent = count;

                    // Show empty state if no more rows
                    if (count === 0) {
                        document.getElementById('pending-tbody').innerHTML = `
                            <tr id="no-pending-row">
                                <td colspan="8" class="text-center text-muted py-5">
                                    <i class="fas fa-check-circle fa-3x d-block mb-2 text-success"></i>
                                    All requisitions have been processed.
                                </td>
                            </tr>`;
                    }
                }, 400);
            }
        } else {
            alert('Error: ' + (data.error || 'Something went wrong.'));
        }

        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check me-1"></i> Yes, Process It';
        pendingReqId  = null;
    })
    .catch(err => {
        console.error(err);
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check me-1"></i> Yes, Process It';
    });
});
</script>

<?php require_once 'includes/footer.php'; ?>
