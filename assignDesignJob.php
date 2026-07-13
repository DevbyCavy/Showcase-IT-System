<?php
require_once 'php_action/auth_guard.php';
requireRole('Marketer');

require_once 'php_action/createDesignJob.php';

$pageTitle = 'Design Jobs';
require_once 'includes/sidebarMarketing.php';
?>

<div class="dash-card mb-4">
    <div class="dash-card-head">
        <h5><i class="fas fa-pen-ruler me-2"></i>Assign Design Job</h5>
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
                <label class="form-label fw-semibold">Job Number</label>
                <input type="text" class="form-control bg-light" value="<?= htmlspecialchars($nextJobNo) ?>" disabled>
            </div>
            <div class="col-md-4">
                <label class="form-label fw-semibold">Design Type <span class="text-danger">*</span></label>
                <select name="design_type" class="form-select" required>
                    <option value="">Select type...</option>
                    <option value="3D" <?= ($_POST['design_type'] ?? '') === '3D' ? 'selected' : '' ?>>3D</option>
                    <option value="Artwork" <?= ($_POST['design_type'] ?? '') === 'Artwork' ? 'selected' : '' ?>>Artwork</option>
                </select>
            </div>
            <div class="col-md-5">
                <label class="form-label fw-semibold">Designer <span class="text-danger">*</span></label>
                <select name="designer_id" class="form-select" required>
                    <option value="">Select designer...</option>
                    <?php
                    $designers = $conn->query("SELECT user_id, name, surname FROM users WHERE user_type = 'Graphic Designer' ORDER BY name ASC");
                    while ($d = $designers->fetch_assoc()):
                        $selected = (int)($_POST['designer_id'] ?? 0) === (int)$d['user_id'] ? 'selected' : '';
                    ?>
                        <option value="<?= $d['user_id'] ?>" <?= $selected ?>>
                            <?= htmlspecialchars($d['name'] . ' ' . $d['surname']) ?>
                        </option>
                    <?php endwhile; ?>
                </select>
            </div>

            <div class="col-md-8">
                <label class="form-label fw-semibold">Job Title <span class="text-danger">*</span></label>
                <input type="text" name="title" class="form-control"
                       placeholder="e.g. July Worship Festival Backdrop"
                       value="<?= htmlspecialchars($_POST['title'] ?? '') ?>" required>
            </div>
            <div class="col-md-4">
                <label class="form-label fw-semibold">Deadline <span class="text-danger">*</span></label>
                <input type="datetime-local" name="deadline" class="form-control"
                       value="<?= htmlspecialchars($_POST['deadline'] ?? '') ?>" required>
            </div>

            <div class="col-md-8">
                <label class="form-label fw-semibold">Brief / Description</label>
                <textarea name="description" class="form-control" rows="4"
                          placeholder="Describe the brief, dimensions, references, etc."><?= htmlspecialchars($_POST['description'] ?? '') ?></textarea>
            </div>
            <div class="col-md-4">
                <label class="form-label fw-semibold">Tender / Brief Document <span class="text-danger">*</span></label>
                <input type="file" name="brief_file" class="form-control" accept="image/*,.pdf,.doc,.docx" required>
                <div class="form-text">Attach the tender document, spec sheet or reference file.</div>
            </div>
        </div>

        <button type="submit" name="design_job_submit" class="btn w-100 mt-4" style="background:var(--brand-orange,#F15A2C); color:#fff; font-weight:600;">
            <i class="fas fa-paper-plane me-2"></i>Assign to Designer
        </button>

    </form>
</div>

<div class="dash-card mb-4">
    <div class="dash-card-head">
        <h5><i class="fas fa-list me-2"></i>My Design Jobs</h5>
        <input type="text" id="jobSearch" class="form-control form-control-sm w-auto"
               placeholder="Search..." style="max-width:200px;">
    </div>

    <div class="table-responsive">
        <table class="table table-hover align-middle mb-0" id="jobTable">
            <thead class="table-dark">
                <tr>
                    <th class="ps-3">Job #</th>
                    <th>Title</th>
                    <th>Designer</th>
                    <th>Type</th>
                    <th>Deadline</th>
                    <th>Status</th>
                    <th class="text-center">Action</th>
                </tr>
            </thead>
            <tbody>
            <?php
            $myJobs = $conn->prepare("
                SELECT dj.*, u.name AS des_name, u.surname AS des_surname
                FROM design_jobs dj
                LEFT JOIN users u ON dj.designer_id = u.user_id
                WHERE dj.marketer_id = ?
                ORDER BY dj.created_at DESC
            ");
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
            ?>
            <tr>
                <td class="ps-3 fw-bold"><?= htmlspecialchars($jb['job_number']) ?></td>
                <td><?= htmlspecialchars($jb['title']) ?></td>
                <td><?= htmlspecialchars(trim($jb['des_name'] . ' ' . $jb['des_surname'])) ?></td>
                <td><?= htmlspecialchars($jb['design_type']) ?></td>
                <td><?= date('d M Y H:i', strtotime($jb['deadline'])) ?></td>
                <td>
                    <span class="badge <?= $statusClasses[$jb['status']] ?? 'bg-secondary' ?>">
                        <?= htmlspecialchars($jb['status']) ?>
                    </span>
                </td>
                <td class="text-center">
                    <?php if ($jb['status'] === 'Submitted'): ?>
                        <button type="button" class="btn btn-sm btn-outline-success review-btn"
                                data-id="<?= $jb['design_job_id'] ?>"
                                data-ref="<?= htmlspecialchars($jb['job_number']) ?>"
                                data-file="<?= htmlspecialchars($jb['submission_file']) ?>"
                                data-notes="<?= htmlspecialchars($jb['submission_notes']) ?>">
                            <i class="fas fa-eye me-1"></i>Review
                        </button>
                    <?php elseif (!empty($jb['brief_file'])): ?>
                        <a href="<?= htmlspecialchars($jb['brief_file']) ?>" class="btn btn-sm btn-outline-primary" target="_blank">
                            <i class="fas fa-paperclip"></i>
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

<!-- ── Review Submission Modal ── -->
<div class="modal fade" id="reviewJobModal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow">
            <div class="modal-header text-white" style="background:linear-gradient(135deg, var(--brand-orange,#F15A2C), var(--brand-orange-dark,#D94E22));">
                <h5 class="modal-title" style="color:#fff;"><i class="fas fa-pen-ruler me-2"></i>Review Submission — <span id="reviewJobRef"></span></h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body py-4">
                <p class="mb-2"><a id="reviewJobFile" href="#" target="_blank" class="btn btn-sm btn-outline-primary"><i class="fas fa-download me-1"></i>Download Submitted File</a></p>
                <p class="mb-3"><strong>Designer notes:</strong><br><span id="reviewJobNotes" class="text-muted"></span></p>
                <label class="form-label fw-semibold">Revision Notes <span class="text-muted">(required if requesting a revision)</span></label>
                <textarea id="reviewNotesInput" class="form-control" rows="3" placeholder="What needs to change?"></textarea>
            </div>
            <div class="modal-footer justify-content-center">
                <button type="button" class="btn btn-warning px-4" id="requestRevisionBtn">
                    <i class="fas fa-rotate-left me-1"></i> Request Revision
                </button>
                <button type="button" class="btn btn-success px-4" id="approveJobBtn">
                    <i class="fas fa-check me-1"></i> Approve
                </button>
            </div>
        </div>
    </div>
</div>

<script>
document.getElementById('jobSearch').addEventListener('input', function() {
    const q = this.value.toLowerCase();
    document.querySelectorAll('#jobTable tbody tr').forEach(function(row) {
        row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
});

let reviewJobId = null;

document.querySelectorAll('.review-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
        reviewJobId = this.dataset.id;
        document.getElementById('reviewJobRef').textContent = this.dataset.ref;
        document.getElementById('reviewJobFile').href = this.dataset.file;
        document.getElementById('reviewJobNotes').textContent = this.dataset.notes || '(none)';
        document.getElementById('reviewNotesInput').value = '';
        new bootstrap.Modal(document.getElementById('reviewJobModal')).show();
    });
});

function submitReview(action, btn) {
    if (!reviewJobId) return;
    const notes = document.getElementById('reviewNotesInput').value.trim();

    if (action === 'revise' && notes === '') {
        alert('Please add revision notes so the designer knows what to change.');
        return;
    }

    const originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Working...';

    fetch('php_action/reviewDesignJob.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'design_job_id=' + encodeURIComponent(reviewJobId) +
              '&action=' + encodeURIComponent(action) +
              '&review_notes=' + encodeURIComponent(notes)
    })
    .then(r => r.json())
    .then(data => {
        bootstrap.Modal.getInstance(document.getElementById('reviewJobModal')).hide();
        if (data.success) {
            location.reload();
        } else {
            alert('Error: ' + (data.error || 'Something went wrong.'));
            btn.disabled = false;
            btn.innerHTML = originalHtml;
        }
    })
    .catch(err => {
        console.error(err);
        btn.disabled = false;
        btn.innerHTML = originalHtml;
    });
}

document.getElementById('approveJobBtn').addEventListener('click', function() {
    submitReview('approve', this);
});
document.getElementById('requestRevisionBtn').addEventListener('click', function() {
    submitReview('revise', this);
});
</script>

<?php require_once 'includes/footerDashboard.php'; ?>
