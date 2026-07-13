<?php
require_once 'core.php';

header('Content-Type: application/json');

$response = ['success' => false, 'message' => 'Something went wrong.'];

$brandId     = intval($_POST['brandId'] ?? 0);
$brandName   = trim($_POST['editBrandName'] ?? '');
$brandStatus = intval($_POST['editBrandStatus'] ?? 0);

if ($brandId <= 0) {
    $response['message'] = 'Invalid brand ID.';
    echo json_encode($response);
    exit;
}
if ($brandName === '') {
    $response['message'] = 'Brand name is required.';
    echo json_encode($response);
    exit;
}
if (!in_array($brandStatus, [1, 2], true)) {
    $response['message'] = 'Please select a valid status.';
    echo json_encode($response);
    exit;
}

$stmt = $conn->prepare("UPDATE brand SET brand_name = ?, brand_active = ? WHERE brand_id = ?");
$stmt->bind_param("sii", $brandName, $brandStatus, $brandId);

if ($stmt->execute()) {
    $response['success'] = true;
    $response['message'] = 'Brand updated successfully.';
} else {
    $response['message'] = 'Failed to update brand.';
}
$stmt->close();
$conn->close();

echo json_encode($response);
