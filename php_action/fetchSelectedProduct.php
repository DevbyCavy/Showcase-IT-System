<?php
require_once 'core.php';

// Initialize response
$response = [
    'success' => false,
    'message' => 'Unknown error occurred.'
];

// Check if productId is provided
if (!isset($_POST['productId']) || empty($_POST['productId'])) {
    $response['message'] = 'No product ID provided.';
    echo json_encode($response);
    exit();
}

$productId = intval($_POST['productId']); // sanitize input

$sql = "SELECT product_id, product_name, product_image, brand_id, categories_id, quantity, rate, active, status 
        FROM product 
        WHERE product_id = $productId";

$result = $conn->query($sql);

if ($result && $result->num_rows > 0) {
    $row = $result->fetch_assoc();

    $response = [
        'success' => true,
        'data' => $row
    ];
} else {
    $response['message'] = 'Product not found.';
}

$conn->close();

echo json_encode($response);
