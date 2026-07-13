<?php
require_once 'core.php';

header('Content-Type: application/json');

$response = ['success' => false, 'message' => 'Unknown error occurred.'];

$categoryId = intval($_POST['categoriesId'] ?? 0);

if ($categoryId <= 0) {
    $response['message'] = 'No category ID provided.';
    echo json_encode($response);
    exit;
}

$stmt = $conn->prepare("SELECT categories_id, categories_name, categories_active FROM category WHERE categories_id = ? LIMIT 1");
$stmt->bind_param("i", $categoryId);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $response = ['success' => true, 'data' => $result->fetch_assoc()];
} else {
    $response['message'] = 'Category not found.';
}
$stmt->close();
$conn->close();

echo json_encode($response);
