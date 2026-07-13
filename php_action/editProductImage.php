<?php
require_once 'core.php';

header('Content-Type: application/json');

$response = ['success' => false, 'message' => 'Something went wrong.'];

$productId = intval($_POST['productId'] ?? 0);

if ($productId <= 0) {
    $response['message'] = 'No product ID provided.';
    echo json_encode($response);
    exit;
}

if (!isset($_FILES['editProductImage']) || $_FILES['editProductImage']['error'] !== UPLOAD_ERR_OK) {
    $response['message'] = 'No image uploaded or upload error.';
    echo json_encode($response);
    exit;
}

$fileType = strtolower(pathinfo($_FILES['editProductImage']['name'], PATHINFO_EXTENSION));
$allowed  = ['gif', 'jpg', 'jpeg', 'png', 'webp'];

if (!in_array($fileType, $allowed, true)) {
    $response['message'] = 'Invalid file type. Please upload JPG, PNG, GIF, or WEBP.';
    echo json_encode($response);
    exit;
}

$uploadDir = '../assets/images/stock/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

$relativeUrl = 'assets/images/stock/' . uniqid('img_', true) . '.' . $fileType;

if (!move_uploaded_file($_FILES['editProductImage']['tmp_name'], '../' . $relativeUrl)) {
    $response['message'] = 'Failed to move uploaded file.';
    echo json_encode($response);
    exit;
}

$stmt = $conn->prepare("UPDATE product SET product_image = ? WHERE product_id = ?");
$stmt->bind_param("si", $relativeUrl, $productId);

if ($stmt->execute()) {
    $response['success']   = true;
    $response['image_url'] = $relativeUrl;
    $response['message']   = 'Product image updated successfully.';
} else {
    $response['message'] = 'Database update failed.';
}
$stmt->close();
$conn->close();

echo json_encode($response);
