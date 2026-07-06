<?php
require_once '../php_action/db_connection.php';

$response = ['success' => false, 'message' => 'Unknown error'];

if ($_POST) {
    $productId = intval($_POST['product_id']);
    $date_of_collection = $_POST['date_of_collection'];
    $collector_name = $_POST['collector_name'];
    $tool_name = $_POST['tool_name'];
    $quantity_issued = intval($_POST['quantity_issued']);
    $job_name = $_POST['job_name'];
    $date_of_return = $_POST['date_of_return'];

    // Check current quantity
    $check = $conn->query("SELECT quantity FROM product WHERE product_id = $productId");
    $row = $check->fetch_assoc();

    if ($row && $row['quantity'] >= $quantity_issued) {
        // Insert into issued_tools
        $stmt = $conn->prepare("INSERT INTO issued_tools 
            (product_id, date_of_collection, collector_name, tool_name, quantity_issued, job_name, date_of_return) 
            VALUES (?, ?, ?, ?, ?, ?, ?)");
        // ✅ Correct binding types
        $stmt->bind_param("isssiss", $productId, $date_of_collection, $collector_name, $tool_name, $quantity_issued, $job_name, $date_of_return);
        
        if ($stmt->execute()) {
            // Update product quantity
            $newQty = $row['quantity'] - $quantity_issued;
            $conn->query("UPDATE product SET quantity = $newQty WHERE product_id = $productId");

            $response['success'] = true;
            $response['message'] = 'Product issued successfully';
        } else {
            $response['message'] = 'Database error: '.$conn->error;
        }
    } else {
        $response['message'] = 'Not enough stock available';
    }
}

echo json_encode($response);
