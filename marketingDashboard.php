<?php
require_once 'php_action/auth_guard.php';
requireRole('Marketer');
require_once 'php_action/db_connection.php';

$loggedUserId = $_SESSION['user_id'] ?? 0;

/* ---------- This marketer's pending requisitions ---------- */
$reqStmt = $conn->prepare("
    SELECT requisition_id, event_name, project_manager, location, event_date, req_type
    FROM requisitions
    WHERE submitted_by = ? AND status = 'Pending'
    ORDER BY created_at DESC
    LIMIT 6
");
$reqStmt->bind_param("i", $loggedUserId);
$reqStmt->execute();
$pendingRequisitions = [];
$reqRes = $reqStmt->get_result();
while ($row = $reqRes->fetch_assoc()) $pendingRequisitions[] = $row;

/* ---------- This marketer's approved quotations ---------- */
$quoStmt = $conn->prepare("
    SELECT quotation_id, quotation_number, customer_name, project_name, total, approved_at
    FROM quotations
    WHERE submitted_by = ? AND status = 'Approved'
    ORDER BY approved_at DESC
    LIMIT 6
");
$quoStmt->bind_param("i", $loggedUserId);
$quoStmt->execute();
$approvedQuotations = [];
$quoRes = $quoStmt->get_result();
while ($row = $quoRes->fetch_assoc()) $approvedQuotations[] = $row;

$pageTitle = 'Marketer Dashboard';
require_once 'includes/header.php';
?>
<link rel="stylesheet" href="custom/css/custom.css">
<link rel="stylesheet" href="custom/css/modern-dashboard.css">
<div class="container-fluid px-4 mt-3">

    <div class="d-flex justify-content-end gap-2 mb-3">
        <a href="requisitions.php" class="btn btn-outline-secondary btn-sm">
            <i class="fas fa-file-signature me-1"></i> New Requisition
        </a>
        <a href="makeQuotation.php" class="btn btn-sm" style="background:var(--brand-orange,#F15A2C); color:#fff;">
            <i class="fas fa-file-invoice-dollar me-1"></i> New Quotation
        </a>
    </div>

    <!-- Pending Requisitions -->
    <div class="dash-card mb-4">
        <div class="dash-card-head">
            <h5>Pending Requisitions</h5>
            <a class="see-all" href="requisitions.php">See All</a>
        </div>

        <div id="reqList">
            <?php if (empty($pendingRequisitions)): ?>
                <div class="req-empty">No pending requisitions right now.</div>
            <?php else: ?>
                <?php foreach ($pendingRequisitions as $req): ?>
                    <div class="req-row">
                        <div class="req-icon"><i class="fas fa-file-signature"></i></div>
                        <div class="req-body">
                            <div class="req-type"><?= htmlspecialchars($req['req_type']) ?></div>
                            <div class="req-title"><?= htmlspecialchars($req['event_name']) ?> &mdash; <?= htmlspecialchars($req['project_manager']) ?></div>
                        </div>
                        <div class="req-meta">
                            <i class="far fa-calendar"></i> <?= date('d M Y', strtotime($req['event_date'])) ?>
                        </div>
                    </div>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>
    </div>

    <!-- Approved Quotations -->
    <div class="dash-card mb-4">
        <div class="dash-card-head">
            <h5>Approved Quotations</h5>
            <a class="see-all" href="makeQuotation.php">See All</a>
        </div>

        <div id="quoList">
            <?php if (empty($approvedQuotations)): ?>
                <div class="req-empty">No approved quotations yet.</div>
            <?php else: ?>
                <?php foreach ($approvedQuotations as $quo): ?>
                    <div class="req-row">
                        <div class="req-icon"><i class="fas fa-file-invoice-dollar"></i></div>
                        <div class="req-body">
                            <div class="req-type"><?= htmlspecialchars($quo['quotation_number']) ?></div>
                            <div class="req-title">
                                <?= htmlspecialchars($quo['customer_name']) ?><?= $quo['project_name'] ? ' — ' . htmlspecialchars($quo['project_name']) : '' ?>
                            </div>
                        </div>
                        <div class="req-meta">
                            $<?= number_format($quo['total'], 2) ?>
                        </div>
                        <a href="viewQuotation.php?id=<?= $quo['quotation_id'] ?>" class="req-process-btn" style="text-decoration:none;" target="_blank">
                            <i class="fas fa-eye"></i> View
                        </a>
                    </div>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>
    </div>

</div>

<?php require_once 'includes/footer.php'; ?>
