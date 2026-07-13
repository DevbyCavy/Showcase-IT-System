<?php
require_once 'core.php';

header('Content-Type: application/json');

$response = ['success' => false, 'message' => 'Something went wrong.'];

$productId     = intval($_POST['productId'] ?? 0);
$productName   = trim($_POST['editProductName']    ?? '');
$quantity      = trim($_POST['editQuantity']       ?? '');
$rate          = trim($_POST['editRate']           ?? '');
$brandId       = intval($_POST['editBrandName']    ?? 0);
$categoryId    = intval($_POST['editCategoryName'] ?? 0);
$productStatus = intval($_POST['editProductStatus'] ?? 0);

if ($productId <= 0 || $productName === '') {
    $response['message'] = 'Product name is required.';
    echo json_encode($response);
    exit;
}

$stmt = $conn->prepare("
    UPDATE product
    SET product_name = ?, brand_id = ?, categories_id = ?, quantity = ?, rate = ?, active = ?, status = 1
    WHERE product_id = ?
");
$stmt->bind_param("siissii", $productName, $brandId, $categoryId, $quantity, $rate, $productStatus, $productId);

if ($stmt->execute()) {
    $response['success'] = true;
    $response['message'] = 'Product updated successfully.';
} else {
    $response['message'] = 'Failed to update product.';
}
$stmt->close();
$conn->close();

echo json_encode($response);
