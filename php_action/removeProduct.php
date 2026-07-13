<?php
require_once 'core.php';

header('Content-Type: application/json');

$response = ['success' => false, 'message' => 'Something went wrong.'];

$productId = intval($_POST['productId'] ?? 0);

if ($productId <= 0) {
    $response['message'] = 'Invalid product ID.';
    echo json_encode($response);
    exit;
}

$stmt = $conn->prepare("UPDATE product SET active = 2, status = 2 WHERE product_id = ?");
$stmt->bind_param("i", $productId);

if ($stmt->execute()) {
    $response['success'] = true;
    $response['message'] = 'Product removed successfully.';
} else {
    $response['message'] = 'Error while removing the product.';
}
$stmt->close();
$conn->close();

echo json_encode($response);
