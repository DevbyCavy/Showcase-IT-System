<?php
require_once 'php_action/auth_guard.php';
requireRole('Marketer');

require_once 'php_action/createMemo.php';

$pageTitle = 'Memos';
require_once 'includes/sidebarMarketing.php';
?>

<div class="dash-card mb-4">
    <div class="dash-card-head">
        <h5><i class="fas fa-note-sticky me-2"></i>New Memo</h5>
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

    <form method="POST" action="">
        <div class="row g-3">
            <div class="col-md-7">
                <label class="form-label fw-semibold">Title <span class="text-danger">*</span></label>
                <input type="text" name="title" class="form-control"
                       placeholder="e.g. Follow up with printer on delivery"
                       value="<?= htmlspecialchars($_POST['title'] ?? '') ?>" required>
            </div>
            <div class="col-md-5">
                <label class="form-label fw-semibold">Due Date <span class="text-danger">*</span></label>
                <input type="datetime-local" name="due_date" class="form-control"
                       value="<?= htmlspecialchars($_POST['due_date'] ?? '') ?>" required>
            </div>
            <div class="col-12">
                <label class="form-label fw-semibold">Notes</label>
                <textarea name="description" class="form-control" rows="3"
                          placeholder="Any extra detail for yourself."><?= htmlspecialchars($_POST['description'] ?? '') ?></textarea>
            </div>
        </div>

        <button type="submit" name="memo_submit" class="btn w-100 mt-4" style="background:var(--brand-orange,#F15A2C); color:#fff; font-weight:600;">
            <i class="fas fa-bell me-2"></i>Save Memo
        </button>
    </form>
</div>

<div class="dash-card mb-4">
    <div class="dash-card-head">
        <h5><i class="fas fa-list-check me-2"></i>My Memos</h5>
        <input type="text" id="memoSearch" class="form-control form-control-sm w-auto"
               placeholder="Search..." style="max-width:200px;">
    </div>

    <div class="table-responsive">
        <table class="table table-hover align-middle mb-0" id="memoTable">
            <thead class="table-dark">
                <tr>
                    <th class="ps-3">Title</th>
                    <th>Due</th>
                    <th>Notes</th>
                    <th>Status</th>
                    <th class="text-center">Action</th>
                </tr>
            </thead>
            <tbody id="memo-tbody">
            <?php
            $myMemos = $conn->prepare("SELECT * FROM memos WHERE created_by = ? ORDER BY due_date ASC");
            $myMemos->bind_param("i", $_SESSION['user_id']);
            $myMemos->execute();
            $myMemosResult = $myMemos->get_result();

            if ($myMemosResult && $myMemosResult->num_rows > 0):
                while ($mm = $myMemosResult->fetch_assoc()):
                    $isOverdue = $mm['status'] === 'Pending' && strtotime($mm['due_date']) < time();
            ?>
            <tr id="memo-row-<?= $mm['memo_id'] ?>">
                <td class="ps-3 fw-bold"><?= htmlspecialchars($mm['title']) ?></td>
                <td class="<?= $isOverdue ? 'text-danger fw-bold' : '' ?>"><?= date('d M Y H:i', strtotime($mm['due_date'])) ?></td>
                <td class="text-muted"><?= htmlspecialchars($mm['description']) ?></td>
                <td>
                    <span class="badge <?= $mm['status'] === 'Done' ? 'bg-success' : 'bg-secondary' ?>">
                        <?= htmlspecialchars($mm['status']) ?>
                    </span>
                </td>
                <td class="text-center">
                    <?php if ($mm['status'] === 'Pending'): ?>
                        <button type="button" class="btn btn-sm btn-outline-success memo-done-btn" data-id="<?= $mm['memo_id'] ?>" title="Mark Done">
                            <i class="fas fa-check"></i>
                        </button>
                    <?php endif; ?>
                    <button type="button" class="btn btn-sm btn-outline-danger memo-delete-btn" data-id="<?= $mm['memo_id'] ?>" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
            <?php
                endwhile;
            else:
            ?>
            <tr id="no-memo-row">
                <td colspan="5" class="text-center text-muted py-4">
                    <i class="fas fa-inbox fa-2x d-block mb-2"></i>
                    No memos yet.
                </td>
            </tr>
            <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

<script>
document.getElementById('memoSearch').addEventListener('input', function() {
    const q = this.value.toLowerCase();
    document.querySelectorAll('#memoTable tbody tr').forEach(function(row) {
        row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
});

function memoAction(url, memoId, onDone) {
    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'memo_id=' + encodeURIComponent(memoId)
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            onDone();
        } else {
            alert('Error: ' + (data.error || 'Something went wrong.'));
        }
    })
    .catch(err => console.error(err));
}

document.querySelectorAll('.memo-done-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
        memoAction('php_action/updateMemoStatus.php', this.dataset.id, function() {
            location.reload();
        });
    });
});

document.querySelectorAll('.memo-delete-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
        if (!confirm('Delete this memo?')) return;
        const id = this.dataset.id;
        memoAction('php_action/deleteMemo.php', id, function() {
            const row = document.getElementById('memo-row-' + id);
            if (row) row.remove();
            const tbody = document.getElementById('memo-tbody');
            if (tbody.querySelectorAll('tr').length === 0) {
                tbody.innerHTML = '<tr id="no-memo-row"><td colspan="5" class="text-center text-muted py-4"><i class="fas fa-inbox fa-2x d-block mb-2"></i>No memos yet.</td></tr>';
            }
        });
    });
});
</script>

<?php require_once 'includes/footerDashboard.php'; ?>
