<?php
/*
 * php_action/createQuotation.php
 * Handles quotation form submission.
 * Include this file inside makeQuotation.php — do not call directly.
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once 'db_connection.php';

$errors  = [];
$success = '';

$defaultTerms = "1. Invoice valid for 14 working days.\n"
    . "2. Payment required before commencement.\n"
    . "3. This is not a hire price but a hire purchase.\n"
    . "4. Artwork must be confirmed no later than 14 days before the event.\n"
    . "5. Artwork must be sent in high resolution PDF/EPS.\n"
    . "6. Payable in USD.";

// Auto-generate quotation number e.g. QUO-001
$q   = $conn->query("SELECT MAX(CAST(SUBSTRING(quotation_number, 5) AS UNSIGNED)) AS max_no FROM quotations");
$row = $q->fetch_assoc();
$nextQuoNo = 'QUO-' . str_pad(($row['max_no'] ?? 0) + 1, 3, '0', STR_PAD_LEFT);

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['quotation_submit'])) {

    $customer_name    = trim($_POST['customer_name']    ?? '');
    $customer_id      = trim($_POST['customer_id']      ?? '');
    $project_name     = trim($_POST['project_name']     ?? '');
    $order_number     = trim($_POST['order_number']     ?? '');
    $quote_date       = trim($_POST['quote_date']        ?? '');
    $terms_conditions = trim($_POST['terms_conditions']  ?? '');
    $submitted_by     = intval($_SESSION['user_id']      ?? 0);

    $item_descriptions = $_POST['item_description'] ?? [];
    $item_quantities   = $_POST['item_quantity']     ?? [];
    $item_prices       = $_POST['item_unit_price']   ?? [];

    // Validation
    if ($customer_name === '') $errors[] = 'Customer name is required.';
    if ($quote_date     === '') $errors[] = 'Quote date is required.';

    $hasItem = false;
    foreach ($item_descriptions as $desc) {
        if (trim($desc) !== '') { $hasItem = true; break; }
    }
    if (!$hasItem) $errors[] = 'Please add at least one line item.';

    if (empty($_FILES['design_file']['name'])) {
        $errors[] = 'Please attach a design file for this quotation.';
    }

    $design_file = '';
    if (empty($errors)) {
        if (!is_dir('uploads')) {
            mkdir('uploads', 0755, true);
        }
        $design_file = 'uploads/quote_design_' . time() . '_' . basename($_FILES['design_file']['name']);
        move_uploaded_file($_FILES['design_file']['tmp_name'], $design_file);
    }

    if (empty($errors)) {
        $conn->begin_transaction();
        try {
            // Recompute totals server-side — never trust client-calculated amounts
            $subtotal = 0.0;
            $lineTotals = [];
            foreach ($item_descriptions as $i => $desc) {
                $desc = trim($desc);
                if ($desc === '') continue;
                $qty   = floatval($item_quantities[$i] ?? 0);
                $price = floatval($item_prices[$i] ?? 0);
                $lineTotal = $qty * $price;
                $subtotal += $lineTotal;
                $lineTotals[$i] = $lineTotal;
            }
            $total = $subtotal;

            $terms = $terms_conditions !== '' ? $terms_conditions : $defaultTerms;

            $stmt = $conn->prepare("
                INSERT INTO quotations
                    (quotation_number, customer_name, customer_id, project_name, order_number,
                     quote_date, terms_conditions, design_file, subtotal, total, submitted_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->bind_param(
                "ssssssssddi",
                $nextQuoNo, $customer_name, $customer_id, $project_name, $order_number,
                $quote_date, $terms, $design_file, $subtotal, $total, $submitted_by
            );
            $stmt->execute();
            $newQuoId = $conn->insert_id;
            $stmt->close();

            $itemStmt = $conn->prepare("
                INSERT INTO quotation_items (quotation_id, description, quantity, unit_price, line_total, sort_order)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $sortOrder = 0;
            foreach ($item_descriptions as $i => $desc) {
                $desc = trim($desc);
                if ($desc === '') continue;
                $qty   = floatval($item_quantities[$i] ?? 0);
                $price = floatval($item_prices[$i] ?? 0);
                $lineTotal = $lineTotals[$i];
                $itemStmt->bind_param("isdddi", $newQuoId, $desc, $qty, $price, $lineTotal, $sortOrder);
                $itemStmt->execute();
                $sortOrder++;
            }
            $itemStmt->close();

            $conn->commit();
            $success   = "Quotation $nextQuoNo submitted for approval!";
            $nextQuoNo = 'QUO-' . str_pad(($row['max_no'] ?? 0) + 2, 3, '0', STR_PAD_LEFT);

        } catch (Exception $e) {
            $conn->rollback();
            $errors[] = 'Failed to submit quotation: ' . $e->getMessage();
        }
    }
}
