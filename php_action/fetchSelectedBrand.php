<?php
require_once 'core.php';

header('Content-Type: application/json');

$response = ['success' => false, 'message' => 'Unknown error occurred.'];

$brandId = intval($_POST['brandId'] ?? 0);

if ($brandId <= 0) {
    $response['message'] = 'No brand ID provided.';
    echo json_encode($response);
    exit;
}

$stmt = $conn->prepare("SELECT brand_id, brand_name, brand_active FROM brand WHERE brand_id = ? LIMIT 1");
$stmt->bind_param("i", $brandId);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $response = ['success' => true, 'data' => $result->fetch_assoc()];
} else {
    $response['message'] = 'Brand not found.';
}
$stmt->close();
$conn->close();

echo json_encode($response);
