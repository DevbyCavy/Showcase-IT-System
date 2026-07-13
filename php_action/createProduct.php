<?php
require_once 'core.php';

header('Content-Type: application/json');

$response = ['success' => false, 'message' => 'Something went wrong.'];

$productName   = trim($_POST['productName']    ?? '');
$quantity      = trim($_POST['quantity']       ?? '');
$rate          = trim($_POST['rate']           ?? '');
$brandId       = intval($_POST['brandName']    ?? 0);
$categoryId    = intval($_POST['categoryName'] ?? 0);
$productStatus = intval($_POST['productStatus'] ?? 0);

if ($productName === '') {
    $response['message'] = 'Product name is required.';
    echo json_encode($response);
    exit;
}

$url = '';
if (!empty($_FILES['productImage']['name'])) {
    $type = strtolower(pathinfo($_FILES['productImage']['name'], PATHINFO_EXTENSION));
    if (!in_array($type, ['gif', 'jpg', 'jpeg', 'png'], true)) {
        $response['message'] = 'Invalid image type. Please upload JPG, PNG, or GIF.';
        echo json_encode($response);
        exit;
    }
    $uploadDir = '../assets/images/stock/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    $url = 'assets/images/stock/' . uniqid(rand()) . '.' . $type;
    if (!move_uploaded_file($_FILES['productImage']['tmp_name'], '../' . $url)) {
        $response['message'] = 'Failed to save the uploaded image.';
        echo json_encode($response);
        exit;
    }
}

$stmt = $conn->prepare("
    INSERT INTO product (product_name, product_image, brand_id, categories_id, quantity, rate, active, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
");
$stmt->bind_param("ssiissi", $productName, $url, $brandId, $categoryId, $quantity, $rate, $productStatus);

if ($stmt->execute()) {
    $response['success']    = true;
    $response['product_id'] = $conn->insert_id;
    $response['message']    = 'Product added successfully.';
} else {
    $response['message'] = 'Failed to add product.';
}
$stmt->close();
$conn->close();

echo json_encode($response);
