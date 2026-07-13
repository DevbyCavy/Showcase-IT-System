<?php
require_once 'php_action/auth_guard.php';
requireRole('Graphic Designer');

require_once 'php_action/submitDesignWork.php';

$pageTitle = 'My Design Jobs';
require_once 'includes/sidebarDesign.php';
?>

<div class="dash-card mb-4">
    <div class="dash-card-head">
        <h5><i class="fas fa-pen-ruler me-2"></i>My Design Jobs</h5>
        <input type="text" id="jobSearch" class="form-control form-control-sm w-auto"
               placeholder="Search..." style="max-width:200px;">
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

    <div class="table-responsive">
        <table class="table table-hover align-middle mb-0" id="jobTable">
            <thead class="table-dark">
                <tr>
                    <th class="ps-3">Job #</th>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Deadline</th>
                    <th>Brief</th>
                    <th>Status</th>
                    <th class="text-center">Action</th>
                </tr>
            </thead>
            <tbody>
            <?php
            $myJobs = $conn->prepare("SELECT * FROM design_jobs WHERE designer_id = ? ORDER BY deadline ASC");
            $myJobs->bind_param("i", $_SESSION['user_id']);
            $myJobs->execute();
            $myJobsResult = $myJobs->get_result();

            $statusClasses = [
                'Assigned'            => 'bg-secondary',
                'Submitted'           => 'bg-info text-dark',
                'Revision Requested'  => 'bg-warning text-dark',
                'Approved'            => 'bg-success',
            ];

            if ($myJobsResult && $myJobsResult->num_rows > 0):
                while ($jb = $myJobsResult->fetch_assoc()):
                    $isOverdue = $jb['status'] !== 'Approved' && strtotime($jb['deadline']) < time();
            ?>
            <tr>
                <td class="ps-3 fw-bold"><?= htmlspecialchars($jb['job_number']) ?></td>
                <td>
                    <?= htmlspecialchars($jb['title']) ?>
                    <?php if ($jb['status'] === 'Revision Requested' && !empty($jb['review_notes'])): ?>
                        <br><small class="text-danger"><i class="fas fa-rotate-left me-1"></i><?= htmlspecialchars($jb['review_notes']) ?></small>
                    <?php endif; ?>
                </td>
                <td><?= htmlspecialchars($jb['design_type']) ?></td>
                <td class="<?= $isOverdue ? 'text-danger fw-bold' : '' ?>"><?= date('d M Y H:i', strtotime($jb['deadline'])) ?></td>
                <td>
                    <?php if (!empty($jb['brief_file'])): ?>
                        <a href="<?= htmlspecialchars($jb['brief_file']) ?>" class="btn btn-sm btn-outline-primary" target="_blank">
                            <i class="fas fa-paperclip"></i>
                        </a>
                    <?php endif; ?>
                </td>
                <td>
                    <span class="badge <?= $statusClasses[$jb['status']] ?? 'bg-secondary' ?>">
                        <?= htmlspecialchars($jb['status']) ?>
                    </span>
                </td>
                <td class="text-center">
                    <?php if (in_array($jb['status'], ['Assigned', 'Revision Requested'], true)): ?>
                        <button type="button" class="btn btn-sm btn-outline-success submit-work-btn"
                                data-id="<?= $jb['design_job_id'] ?>"
                                data-ref="<?= htmlspecialchars($jb['job_number']) ?>">
                            <i class="fas fa-upload me-1"></i>Submit Work
                        </button>
                    <?php elseif (!empty($jb['submission_file'])): ?>
                        <a href="<?= htmlspecialchars($jb['submission_file']) ?>" class="btn btn-sm btn-outline-secondary" target="_blank">
                            <i class="fas fa-eye me-1"></i>My Submission
                        </a>
                    <?php endif; ?>
                </td>
            </tr>
            <?php
                endwhile;
            else:
            ?>
            <tr>
                <td colspan="7" class="text-center text-muted py-4">
                    <i class="fas fa-inbox fa-2x d-block mb-2"></i>
                    No design jobs assigned yet.
                </td>
            </tr>
            <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

<!-- ── Submit Work Modal ── -->
<div class="modal fade" id="submitWorkModal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
        <form method="POST" action="" enctype="multipart/form-data">
            <div class="modal-content border-0 shadow">
                <div class="modal-header text-white" style="background:linear-gradient(135deg, var(--brand-orange,#F15A2C), var(--brand-orange-dark,#D94E22));">
                    <h5 class="modal-title" style="color:#fff;"><i class="fas fa-upload me-2"></i>Submit Work — <span id="submitJobRef"></span></h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body py-4">
                    <input type="hidden" name="design_job_id" id="submitJobId" value="">
                    <div class="mb-3">
                        <label class="form-label fw-semibold">Design File <span class="text-danger">*</span></label>
                        <input type="file" name="submission_file" class="form-control" accept="image/*,.pdf,.ai,.eps,.svg" required>
                    </div>
                    <div class="mb-1">
                        <label class="form-label fw-semibold">Notes</label>
                        <textarea name="submission_notes" class="form-control" rows="3" placeholder="Anything the marketer should know before approving."></textarea>
                    </div>
                </div>
                <div class="modal-footer justify-content-center">
                    <button type="button" class="btn btn-secondary px-4" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" name="submit_work" class="btn btn-success px-4">
                        <i class="fas fa-paper-plane me-1"></i> Submit for Approval
                    </button>
                </div>
            </div>
        </form>
    </div>
</div>

<script>
document.getElementById('jobSearch').addEventListener('input', function() {
    const q = this.value.toLowerCase();
    document.querySelectorAll('#jobTable tbody tr').forEach(function(row) {
        row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
});

document.querySelectorAll('.submit-work-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
        document.getElementById('submitJobId').value = this.dataset.id;
        document.getElementById('submitJobRef').textContent = this.dataset.ref;
        new bootstrap.Modal(document.getElementById('submitWorkModal')).show();
    });
});
</script>

<?php require_once 'includes/footerDashboard.php'; ?>
