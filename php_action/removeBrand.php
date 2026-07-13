<?php
require_once 'core.php';

header('Content-Type: application/json');

$response = ['success' => false, 'message' => 'Something went wrong.'];

$brandId = intval($_POST['brandId'] ?? 0);

if ($brandId <= 0) {
    $response['message'] = 'Invalid brand ID.';
    echo json_encode($response);
    exit;
}

$stmt = $conn->prepare("UPDATE brand SET brand_status = 2, brand_active = 2 WHERE brand_id = ?");
$stmt->bind_param("i", $brandId);

if ($stmt->execute()) {
    $response['success'] = true;
    $response['message'] = 'Brand removed successfully.';
} else {
    $response['message'] = 'Error removing brand.';
}
$stmt->close();
$conn->close();

echo json_encode($response);
