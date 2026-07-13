<?php
require_once 'core.php';

header('Content-Type: application/json');

$response = ['success' => false, 'message' => 'Something went wrong.'];

$brandName   = trim($_POST['brandName']     ?? '');
$brandStatus = intval($_POST['brandStatus'] ?? 0);

if ($brandName === '') {
    $response['message'] = 'Brand name is required.';
    echo json_encode($response);
    exit;
}

$stmt = $conn->prepare("INSERT INTO brand (brand_name, brand_active, brand_status) VALUES (?, ?, 1)");
$stmt->bind_param("si", $brandName, $brandStatus);

if ($stmt->execute()) {
    $response['success']  = true;
    $response['brand_id'] = $conn->insert_id;
    $response['message']  = 'Brand added successfully.';
} else {
    $response['message'] = 'Failed to add brand.';
}
$stmt->close();
$conn->close();

echo json_encode($response);
