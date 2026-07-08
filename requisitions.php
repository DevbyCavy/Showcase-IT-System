<?php
require_once 'php_action/auth_guard.php';

$userType = $_SESSION['user_type'] ?? '';
$pageTitle = 'Requisitions';

if ($userType === 'Super Admin') {
    require_once 'includes/sidebarSuper.php';
} elseif ($userType === 'Stores Admin') {
    require_once 'includes/sidebarStores.php';
} else {
    require_once 'includes/header.php';
    echo '<link rel="stylesheet" href="custom/css/custom.css">';
    echo '<link rel="stylesheet" href="custom/css/modern-dashboard.css">';
    echo '<div class="container-fluid px-4 mt-3">';
}

require_once 'php_action/createRequisition.php';
?>

<div class="row g-4">

    <!-- ── LEFT: Form ── -->
    <div class="col-lg-5">
        <div class="dash-card h-100">
            <div class="dash-card-head">
                <h5><i class="fas fa-file-signature me-2"></i>New Requisition</h5>
            </div>

            <!-- Alerts -->
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

            <form method="POST" action="">

                <!-- Req Number (auto) -->
                <div class="mb-3">
                    <label class="form-label fw-semibold">Requisition Number</label>
                    <input type="text" class="form-control bg-light"
                           value="<?= htmlspecialchars($nextReqNo) ?>" disabled>
                </div>

                <!-- Project Manager -->
                <div class="mb-3">
                    <label class="form-label fw-semibold">
                        Project Manager Name <span class="text-danger">*</span>
                    </label>
                    <input type="text" name="project_manager" class="form-control"
                           placeholder="e.g. John Doe"
                           value="<?= htmlspecialchars($_POST['project_manager'] ?? '') ?>"
                           required>
                </div>

                <!-- Event Name -->
                <div class="mb-3">
                    <label class="form-label fw-semibold">
                        Name of Event <span class="text-danger">*</span>
                    </label>
                    <input type="text" name="event_name" class="form-control"
                           placeholder="e.g. Annual Company Gala"
                           value="<?= htmlspecialchars($_POST['event_name'] ?? '') ?>"
                           required>
                </div>

                <!-- Location -->
                <div class="mb-3">
                    <label class="form-label fw-semibold">
                        Location <span class="text-danger">*</span>
                    </label>
                    <input type="text" name="location" class="form-control"
                           placeholder="e.g. Harare CBD"
                           value="<?= htmlspecialchars($_POST['location'] ?? '') ?>"
                           required>
                </div>

                <!-- Event Date -->
                <div class="mb-3">
                    <label class="form-label fw-semibold">
                        Date of Event <span class="text-danger">*</span>
                    </label>
                    <input type="date" name="event_date" class="form-control"
                           value="<?= htmlspecialchars($_POST['event_date'] ?? '') ?>"
                           required>
                </div>

                <!-- Team Members -->
                <div class="mb-3">
                    <label class="form-label fw-semibold">Team Members</label>
                    <textarea name="team_members" class="form-control" rows="3"
                              placeholder="List team members, one per line or comma separated"><?= htmlspecialchars($_POST['team_members'] ?? '') ?></textarea>
                    <div class="form-text">Optional — list everyone involved in this event.</div>
                </div>

                <!-- Type of Requisition -->
                <div class="mb-3">
                    <label class="form-label fw-semibold">
                        Type of Requisition <span class="text-danger">*</span>
                    </label>
                    <div class="d-flex flex-wrap gap-2 mt-1">

                        <?php
                        $types     = ['Food', 'Transport', 'Tool', 'Other'];
                        $icons     = ['fa-utensils', 'fa-car', 'fa-tools', 'fa-ellipsis-h'];
                        $selected  = $_POST['req_type'] ?? '';
                        foreach ($types as $i => $type):
                            $checked = ($selected === $type) ? 'checked' : '';
                        ?>
                        <div class="form-check req-type-option">
                            <input class="form-check-input req-type-radio"
                                   type="radio"
                                   name="req_type"
                                   id="type_<?= $type ?>"
                                   value="<?= $type ?>"
                                   <?= $checked ?>
                                   required>
                            <label class="form-check-label req-type-label"
                                   for="type_<?= $type ?>">
                                <i class="fas <?= $icons[$i] ?> me-1"></i> <?= $type ?>
                            </label>
                        </div>
                        <?php endforeach; ?>

                    </div>
                </div>

                <!-- Other type textbox (hidden unless Other is selected) -->
                <div class="mb-3" id="other-type-box"
                     style="display: <?= ($selected === 'Other') ? 'block' : 'none' ?>;">
                    <label class="form-label fw-semibold">
                        Please specify <span class="text-danger">*</span>
                    </label>
                    <input type="text"
                           name="req_type_other"
                           id="req_type_other"
                           class="form-control"
                           placeholder="Describe the type of requisition"
                           value="<?= htmlspecialchars($_POST['req_type_other'] ?? '') ?>">
                </div>

                <button type="submit" name="submit_requisition" class="btn-issue-req w-100">
                    <i class="fas fa-paper-plane me-2"></i>Submit Requisition
                </button>

            </form>
        </div>
    </div>

    <!-- ── RIGHT: Submissions table ── -->
    <div class="col-lg-7">
        <div class="dash-card">
            <div class="dash-card-head">
                <h5><i class="fas fa-list me-2"></i>Submitted Requisitions</h5>
                <input type="text" id="reqSearch" class="form-control form-control-sm w-auto"
                       placeholder="Search..." style="max-width:200px;">
            </div>

            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0" id="reqTable">
                    <thead class="table-dark">
                        <tr>
                            <th class="ps-3">Req #</th>
                            <th>Project Manager</th>
                            <th>Event</th>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                    <?php
                    require_once 'php_action/db_connection.php';
                    $reqs = $conn->query("
                        SELECT r.*, u.name, u.surname
                        FROM requisitions r
                        LEFT JOIN users u ON r.submitted_by = u.user_id
                        ORDER BY r.created_at DESC
                    ");

                    if ($reqs && $reqs->num_rows > 0):
                        while ($r = $reqs->fetch_assoc()):
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
                        <td>
                            <span class="badge bg-secondary">
                                <?= htmlspecialchars($r['req_type']) ?>
                            </span>
                        </td>
                        <td>
                            <span class="badge <?= $statusClass ?>">
                                <?= htmlspecialchars($r['status']) ?>
                            </span>
                        </td>
                    </tr>
                    <?php
                        endwhile;
                    else:
                    ?>
                    <tr>
                        <td colspan="6" class="text-center text-muted py-4">
                            <i class="fas fa-inbox fa-2x d-block mb-2"></i>
                            No requisitions submitted yet.
                        </td>
                    </tr>
                    <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

</div>

<style>
/* Req type radio pills */
.req-type-label {
    cursor: pointer;
    padding: 6px 16px;
    border: 2px solid #dee2e6;
    border-radius: 20px;
    font-weight: 600;
    font-size: 0.875rem;
    transition: all 0.2s;
    user-select: none;
}
.req-type-radio { display: none; }
.req-type-radio:checked + .req-type-label {
    background: var(--brand-orange, #F15A2C);
    border-color: var(--brand-orange, #F15A2C);
    color: #fff;
}
.req-type-label:hover {
    border-color: var(--brand-orange, #F15A2C);
    color: var(--brand-orange, #F15A2C);
}
.btn-issue-req {
    background: linear-gradient(135deg, var(--brand-orange, #F15A2C), var(--brand-orange-dark, #D94E22));
    color: #fff;
    border: none;
    border-radius: 12px;
    padding: 10px;
    font-weight: 700;
}
.btn-issue-req:hover {
    color: #fff;
    opacity: .92;
}
</style>

<script>
// Show/hide the "Other" textbox
document.querySelectorAll('.req-type-radio').forEach(function(radio) {
    radio.addEventListener('change', function() {
        const otherBox   = document.getElementById('other-type-box');
        const otherInput = document.getElementById('req_type_other');
        if (this.value === 'Other') {
            otherBox.style.display   = 'block';
            otherInput.required      = true;
        } else {
            otherBox.style.display   = 'none';
            otherInput.required      = false;
            otherInput.value         = '';
        }
    });
});

// Live search on the table
document.getElementById('reqSearch').addEventListener('input', function() {
    const q    = this.value.toLowerCase();
    const rows = document.querySelectorAll('#reqTable tbody tr');
    rows.forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
});
</script>

<?php
if (in_array($userType, ['Super Admin', 'Stores Admin'], true)) {
    require_once 'includes/footerDashboard.php';
} else {
    echo '</div>'; // close the container-fluid opened above
    require_once 'includes/footer.php';
}
?>
