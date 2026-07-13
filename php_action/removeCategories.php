<?php
require_once 'core.php';

header('Content-Type: application/json');

$response = ['success' => false, 'message' => 'Something went wrong.'];

$categoryId = intval($_POST['categoriesId'] ?? 0);

if ($categoryId <= 0) {
    $response['message'] = 'Invalid category ID.';
    echo json_encode($response);
    exit;
}

$stmt = $conn->prepare("UPDATE category SET categories_status = 2, categories_active = 2 WHERE categories_id = ?");
$stmt->bind_param("i", $categoryId);

if ($stmt->execute()) {
    $response['success'] = true;
    $response['message'] = 'Category removed successfully.';
} else {
    $response['message'] = 'Error while removing the category.';
}
$stmt->close();
$conn->close();

echo json_encode($response);
