<?php
require_once 'core.php';

header('Content-Type: application/json');

$response = ['success' => false, 'message' => 'Unknown error occurred.'];

$productId = intval($_POST['productId'] ?? 0);

if ($productId <= 0) {
    $response['message'] = 'No product ID provided.';
    echo json_encode($response);
    exit;
}

$stmt = $conn->prepare("SELECT product_id, product_name, product_image, brand_id, categories_id, quantity, rate, active, status FROM product WHERE product_id = ?");
$stmt->bind_param("i", $productId);
$stmt->execute();
$result = $stmt->get_result();

if ($result && $result->num_rows > 0) {
    $response = ['success' => true, 'data' => $result->fetch_assoc()];
} else {
    $response['message'] = 'Product not found.';
}
$stmt->close();
$conn->close();

echo json_encode($response);
