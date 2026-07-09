<?php
require_once 'db_connection.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
if (!isset($_SESSION['user_id'])) {
    die("Access denied");
}

require_once '../vendor/autoload.php';
use Dompdf\Dompdf;
use Dompdf\Options;

if (!isset($_GET['id'])) {
    die("Invalid Quotation ID");
}

$quotation_id = (int) $_GET['id'];

$stmt = $conn->prepare("
    SELECT q.*, u.name AS sub_name, u.surname AS sub_surname
    FROM quotations q
    LEFT JOIN users u ON q.submitted_by = u.user_id
    WHERE q.quotation_id = ?
");
$stmt->bind_param("i", $quotation_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows == 0) {
    die("Quotation not found");
}

$quotation = $result->fetch_assoc();

$userType = $_SESSION['user_type'] ?? '';
if ($userType === 'Marketer' && (int)$quotation['submitted_by'] !== (int)$_SESSION['user_id']) {
    die("Access denied");
}

$itemStmt = $conn->prepare("SELECT * FROM quotation_items WHERE quotation_id = ? ORDER BY sort_order ASC");
$itemStmt->bind_param("i", $quotation_id);
$itemStmt->execute();
$itemsResult = $itemStmt->get_result();

$preparedBy = trim(($quotation['sub_name'] ?? '') . ' ' . ($quotation['sub_surname'] ?? ''));

// ======================================================
// COMPANY LOGO (embedded as base64 so Dompdf can render it)
// ======================================================
$logoPath = __DIR__ . '/../images/showcaseit_logo.png';
$logoSrc = '';
if (is_file($logoPath)) {
    $logoSrc = 'data:image/png;base64,' . base64_encode(file_get_contents($logoPath));
}

// ======================================================
// HTML CONTENT
// ======================================================
$html = '

<style>

body {
    font-family: Arial, sans-serif;
    font-size: 12px;
    color: #333;
}

.header {
    width: 100%;
    margin-bottom: 20px;
}

.header td {
    vertical-align: top;
}

.header h1 {
    margin: 0;
    color: #ff7b00;
    text-align: right;
}

.header .company-info {
    font-size: 11px;
    color: #666;
}

.customer-block {
    background: #fff7ef;
    border-left: 4px solid #ff7b00;
    padding: 8px 12px;
    margin-bottom: 15px;
}

.customer-block .label {
    color: #ff7b00;
    font-weight: bold;
    font-size: 11px;
}

.items-table {
    width: 100%;
    border-collapse: collapse;
}

.items-table th {
    background-color: #ff7b00;
    color: #fff;
    padding: 8px;
    border: 1px solid #ddd;
}

.items-table td {
    border: 1px solid #ddd;
    padding: 6px 8px;
}

.totals-row td {
    font-weight: bold;
    background: #f8f9fa;
}

.bottom-section {
    width: 100%;
    margin-top: 20px;
}

.bottom-section td {
    vertical-align: top;
}

.footer {
    margin-top: 30px;
    text-align: right;
    font-size: 10px;
    color: #777;
}

</style>

<table class="header">
    <tr>
        <td style="width:55%;">
            '.($logoSrc ? '<img src="'.$logoSrc.'" alt="ShowcaseIT Logo" style="height:55px; margin-bottom:8px;">' : '').'
            <div class="company-info">
                32 Jacana Drive, Greystone Park, Harare<br>
                Phone: +263 772 548792<br>
                VAT Number: 220097572<br>
                TIN Number: 2001387234<br>
                Prepared by: '.htmlspecialchars($preparedBy ?: '-').'
            </div>
        </td>
        <td style="width:45%;">
            <h1>QUOTATION</h1>
            <table style="width:100%; font-size:11px;">
                <tr><td style="color:#888;">Date</td><td style="text-align:right;">'.date('d M Y', strtotime($quotation['quote_date'])).'</td></tr>
                <tr><td style="color:#888;">Quotation #</td><td style="text-align:right;">'.htmlspecialchars($quotation['quotation_number']).'</td></tr>
                <tr><td style="color:#888;">Order #</td><td style="text-align:right;">'.htmlspecialchars($quotation['order_number'] ?: '-').'</td></tr>
                <tr><td style="color:#888;">Customer ID</td><td style="text-align:right;">'.htmlspecialchars($quotation['customer_id'] ?: '-').'</td></tr>
            </table>
        </td>
    </tr>
</table>

<div class="customer-block">
    <div class="label">CUSTOMER</div>
    <div><strong>'.htmlspecialchars($quotation['customer_name']).'</strong></div>
    '.($quotation['project_name'] ? '<div>'.htmlspecialchars($quotation['project_name']).'</div>' : '').'
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
';

while ($item = $itemsResult->fetch_assoc()) {
    $html .= '
        <tr>
            <td>'.htmlspecialchars($item['description']).'</td>
            <td style="text-align:right;">'.rtrim(rtrim(number_format($item['quantity'], 2), '0'), '.').'</td>
            <td style="text-align:right;">$'.number_format($item['unit_price'], 2).'</td>
            <td style="text-align:right;">$'.number_format($item['line_total'], 2).'</td>
        </tr>
    ';
}

$html .= '
        <tr class="totals-row">
            <td colspan="3" style="text-align:right;">Subtotal</td>
            <td style="text-align:right;">$'.number_format($quotation['subtotal'], 2).'</td>
        </tr>
        <tr class="totals-row">
            <td colspan="3" style="text-align:right;">TOTAL</td>
            <td style="text-align:right;">$'.number_format($quotation['total'], 2).'</td>
        </tr>
    </tbody>
</table>

<table class="bottom-section">
    <tr>
        <td style="width:60%;">
            <strong style="color:#ff7b00;">Terms &amp; Conditions</strong>
            <div style="white-space:pre-wrap; font-size:11px; margin-top:4px;">'.htmlspecialchars($quotation['terms_conditions']).'</div>
        </td>
        <td style="width:40%;">
            <strong style="color:#ff7b00;">Bank Details</strong>
            <table style="width:100%; font-size:11px; margin-top:4px;">
                <tr><td style="color:#888;">Account Name</td><td>-</td></tr>
                <tr><td style="color:#888;">Bank</td><td>-</td></tr>
                <tr><td style="color:#888;">Account Number</td><td>-</td></tr>
                <tr><td style="color:#888;">Branch</td><td>-</td></tr>
                <tr><td style="color:#888;">Type</td><td>-</td></tr>
            </table>
        </td>
    </tr>
</table>

<div class="footer">
    Generated by ShowcaseIT'.($logoSrc ? ' <img src="'.$logoSrc.'" alt="ShowcaseIT Logo" style="height:16px; vertical-align:middle; margin-left:6px;">' : '').'
</div>

';

// ======================================================
// DOMPDF SETTINGS
// ======================================================
$options = new Options();
$options->set('isRemoteEnabled', true);

$dompdf = new Dompdf($options);
$dompdf->loadHtml($html);
$dompdf->setPaper('A4', 'portrait');
$dompdf->render();

$fileName = "Quotation_" . $quotation['quotation_number'] . ".pdf";

$dompdf->stream($fileName, [
    "Attachment" => true
]);

exit();
