<?php
/*
 * php_action/updateQuotation.php
 * Handles quotation edit submission — Super Admin only.
 * Include this file inside editQuotation.php — do not call directly.
 * Expects $id (quotation_id) and $conn to already be set by the including page.
 */

$errors  = [];
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['quotation_update'])) {

    $customer_name    = trim($_POST['customer_name']    ?? '');
    $customer_id      = trim($_POST['customer_id']      ?? '');
    $project_name     = trim($_POST['project_name']     ?? '');
    $order_number     = trim($_POST['order_number']     ?? '');
    $quote_date       = trim($_POST['quote_date']        ?? '');
    $terms_conditions = trim($_POST['terms_conditions']  ?? '');

    $item_descriptions = $_POST['item_description'] ?? [];
    $item_quantities   = $_POST['item_quantity']     ?? [];
    $item_prices       = $_POST['item_unit_price']   ?? [];

    if ($customer_name === '') $errors[] = 'Customer name is required.';
    if ($quote_date     === '') $errors[] = 'Quote date is required.';

    $hasItem = false;
    foreach ($item_descriptions as $desc) {
        if (trim($desc) !== '') { $hasItem = true; break; }
    }
    if (!$hasItem) $errors[] = 'Please keep at least one line item.';

    $design_file = null; // null = keep existing
    if (!empty($_FILES['design_file']['name'])) {
        if (!is_dir('uploads')) {
            mkdir('uploads', 0755, true);
        }
        $design_file = 'uploads/quote_design_' . time() . '_' . basename($_FILES['design_file']['name']);
        move_uploaded_file($_FILES['design_file']['tmp_name'], $design_file);
    }

    if (empty($errors)) {
        $conn->begin_transaction();
        try {
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

            if ($design_file !== null) {
                $stmt = $conn->prepare("
                    UPDATE quotations
                    SET customer_name = ?, customer_id = ?, project_name = ?, order_number = ?,
                        quote_date = ?, terms_conditions = ?, design_file = ?, subtotal = ?, total = ?
                    WHERE quotation_id = ?
                ");
                $stmt->bind_param(
                    "sssssssddi",
                    $customer_name, $customer_id, $project_name, $order_number,
                    $quote_date, $terms_conditions, $design_file, $subtotal, $total, $id
                );
            } else {
                $stmt = $conn->prepare("
                    UPDATE quotations
                    SET customer_name = ?, customer_id = ?, project_name = ?, order_number = ?,
                        quote_date = ?, terms_conditions = ?, subtotal = ?, total = ?
                    WHERE quotation_id = ?
                ");
                $stmt->bind_param(
                    "ssssssddi",
                    $customer_name, $customer_id, $project_name, $order_number,
                    $quote_date, $terms_conditions, $subtotal, $total, $id
                );
            }
            $stmt->execute();
            $stmt->close();

            $del = $conn->prepare("DELETE FROM quotation_items WHERE quotation_id = ?");
            $del->bind_param("i", $id);
            $del->execute();
            $del->close();

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
                $itemStmt->bind_param("isdddi", $id, $desc, $qty, $price, $lineTotal, $sortOrder);
                $itemStmt->execute();
                $sortOrder++;
            }
            $itemStmt->close();

            $conn->commit();
            $success = "Quotation updated successfully!";

        } catch (Exception $e) {
            $conn->rollback();
            $errors[] = 'Failed to update quotation: ' . $e->getMessage();
        }
    }
}
