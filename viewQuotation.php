<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
if (!isset($_SESSION['user_id'])) {
    header("Location: index.php?error=AccessDenied");
    exit();
}

require_once 'php_action/db_connection.php';

$quotation_id = intval($_GET['id'] ?? 0);

$stmt = $conn->prepare("
    SELECT q.*,
           u.name AS sub_name, u.surname AS sub_surname,
           a.name AS appr_name, a.surname AS appr_surname
    FROM quotations q
    LEFT JOIN users u ON q.submitted_by = u.user_id
    LEFT JOIN users a ON q.approved_by = a.user_id
    WHERE q.quotation_id = ?
");
$stmt->bind_param("i", $quotation_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    die("Quotation not found");
}

$quotation = $result->fetch_assoc();

// A Marketer may only view their own quotations
$userType = $_SESSION['user_type'] ?? '';
if ($userType === 'Marketer' && (int)$quotation['submitted_by'] !== (int)$_SESSION['user_id']) {
    header("Location: index.php?error=AccessDenied");
    exit();
}

$itemStmt = $conn->prepare("SELECT * FROM quotation_items WHERE quotation_id = ? ORDER BY sort_order ASC");
$itemStmt->bind_param("i", $quotation_id);
$itemStmt->execute();
$itemsResult = $itemStmt->get_result();

$preparedBy = trim(($quotation['sub_name'] ?? '') . ' ' . ($quotation['sub_surname'] ?? ''));
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Quotation <?= htmlspecialchars($quotation['quotation_number']) ?> - Showcase IT</title>
    <link rel="stylesheet" href="assets/bootstrap/css/bootstrap.min.css">
    <link rel="stylesheet" href="assets/font-awesome/css/all.min.css">
    <style>
        body { background: #f4f5f7; font-family: Arial, sans-serif; color: #333; }
        .quote-sheet { max-width: 900px; margin: 30px auto; background: #fff; padding: 40px; box-shadow: 0 0 12px rgba(0,0,0,0.08); }
        .quote-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
        .quote-header img { height: 60px; }
        .quote-header .company-info { font-size: 12px; color: #555; margin-top: 8px; }
        .quote-title { text-align: right; }
        .quote-title h1 { color: #ff7b00; margin: 0; letter-spacing: 2px; }
        .quote-meta { font-size: 13px; margin-top: 10px; }
        .quote-meta td { padding: 2px 0 2px 20px; }
        .customer-block { background: #fff7ef; border-left: 4px solid #ff7b00; padding: 10px 15px; margin: 20px 0; }
        .customer-block .label { color: #ff7b00; font-weight: bold; font-size: 12px; }
        .items-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        .items-table th { background: #ff7b00; color: #fff; padding: 8px; border: 1px solid #ddd; font-size: 13px; }
        .items-table td { border: 1px solid #ddd; padding: 8px; font-size: 13px; }
        .items-table td.num { text-align: right; }
        .totals-row td { font-weight: bold; background: #f8f9fa; }
        .bottom-section { display: flex; justify-content: space-between; margin-top: 25px; gap: 20px; }
        .terms-box { flex: 1; font-size: 12px; }
        .terms-box h6 { color: #ff7b00; }
        .terms-box pre { white-space: pre-wrap; font-family: inherit; font-size: 12px; }
        .bank-box { width: 260px; font-size: 12px; }
        .bank-box table td { padding: 3px 0; }
        .status-badge { font-size: 14px; padding: 6px 14px; }
        .action-bar { max-width: 900px; margin: 0 auto 20px; display: flex; justify-content: space-between; }
        @media print { .action-bar { display: none; } body { background: #fff; } .quote-sheet { box-shadow: none; margin: 0; } }
    </style>
</head>
<body>

<div class="action-bar">
    <a href="javascript:history.back()" class="btn btn-outline-secondary"><i class="fas fa-arrow-left me-1"></i> Back</a>
    <div>
        <span class="badge status-badge <?= $quotation['status'] === 'Approved' ? 'bg-success' : 'bg-warning text-dark' ?>">
            <?= htmlspecialchars($quotation['status']) ?>
        </span>
        <a href="php_action/downloadQuotation.php?id=<?= $quotation_id ?>" class="btn btn-outline-primary ms-2">
            <i class="fas fa-file-pdf me-1"></i> Download PDF
        </a>
    </div>
</div>

<div class="quote-sheet">

    <div class="quote-header">
        <div>
            <img src="images/showcaseit_logo.png" alt="Showcase IT">
            <div class="company-info">
                32 Jacana Drive<br>
                Greystone Park, Harare<br>
                Phone: +263 772 548792<br>
                VAT Number: 220097572<br>
                TIN Number: 2001387234<br>
                Prepared by: <?= htmlspecialchars($preparedBy ?: '—') ?>
            </div>
        </div>
        <div class="quote-title">
            <h1>QUOTATION</h1>
            <table class="quote-meta ms-auto">
                <tr><td class="text-muted">Date</td><td><?= date('d M Y', strtotime($quotation['quote_date'])) ?></td></tr>
                <tr><td class="text-muted">Quotation #</td><td><?= htmlspecialchars($quotation['quotation_number']) ?></td></tr>
                <tr><td class="text-muted">Order #</td><td><?= htmlspecialchars($quotation['order_number'] ?: '—') ?></td></tr>
                <tr><td class="text-muted">Customer ID</td><td><?= htmlspecialchars($quotation['customer_id'] ?: '—') ?></td></tr>
            </table>
        </div>
    </div>

    <div class="customer-block">
        <div class="label">CUSTOMER</div>
        <div class="fw-bold"><?= htmlspecialchars($quotation['customer_name']) ?></div>
        <?php if ($quotation['project_name']): ?>
            <div><?= htmlspecialchars($quotation['project_name']) ?></div>
        <?php endif; ?>
    </div>

    <table class="items-table">
        <thead>
            <tr>
                <th style="width:45%">Description</th>
                <th style="width:15%">Quantity</th>
                <th style="width:20%">Unit Price</th>
                <th style="width:20%">Amount</th>
            </tr>
        </thead>
        <tbody>
        <?php while ($item = $itemsResult->fetch_assoc()): ?>
            <tr>
                <td><?= htmlspecialchars($item['description']) ?></td>
                <td class="num"><?= rtrim(rtrim(number_format($item['quantity'], 2), '0'), '.') ?></td>
                <td class="num">$<?= number_format($item['unit_price'], 2) ?></td>
                <td class="num">$<?= number_format($item['line_total'], 2) ?></td>
            </tr>
        <?php endwhile; ?>
            <tr class="totals-row">
                <td colspan="3" class="text-end">Subtotal</td>
                <td class="num">$<?= number_format($quotation['subtotal'], 2) ?></td>
            </tr>
            <tr class="totals-row">
                <td colspan="3" class="text-end">TOTAL</td>
                <td class="num">$<?= number_format($quotation['total'], 2) ?></td>
            </tr>
        </tbody>
    </table>

    <div class="bottom-section">
        <div class="terms-box">
            <h6>Terms &amp; Conditions</h6>
            <pre><?= htmlspecialchars($quotation['terms_conditions']) ?></pre>
        </div>
        <div class="bank-box">
            <h6 style="color:#ff7b00;">Bank Details</h6>
            <table>
                <tr><td class="text-muted">Account Name</td><td>—</td></tr>
                <tr><td class="text-muted">Bank</td><td>—</td></tr>
                <tr><td class="text-muted">Account Number</td><td>—</td></tr>
                <tr><td class="text-muted">Branch</td><td>—</td></tr>
                <tr><td class="text-muted">Type</td><td>—</td></tr>
            </table>
        </div>
    </div>

    <?php if ($quotation['design_file']): ?>
        <div class="mt-4">
            <h6 class="text-muted">Design Attachment</h6>
            <a href="<?= htmlspecialchars($quotation['design_file']) ?>" target="_blank">
                <i class="fas fa-paperclip me-1"></i><?= htmlspecialchars(basename($quotation['design_file'])) ?>
            </a>
        </div>
    <?php endif; ?>

</div>

</body>
</html>
