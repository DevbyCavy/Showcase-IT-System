<?php
require_once 'core.php';

header('Content-Type: application/json');

$response = ['success' => false, 'message' => 'Something went wrong.'];

$categoryId     = intval($_POST['editCategoriesId'] ?? 0);
$categoryName   = trim($_POST['editCategoriesName'] ?? '');
$categoryStatus = intval($_POST['editCategoriesStatus'] ?? 0);

if ($categoryId <= 0) {
    $response['message'] = 'Invalid category ID.';
    echo json_encode($response);
    exit;
}
if ($categoryName === '') {
    $response['message'] = 'Category name is required.';
    echo json_encode($response);
    exit;
}

$stmt = $conn->prepare("UPDATE category SET categories_name = ?, categories_active = ? WHERE categories_id = ?");
$stmt->bind_param("sii", $categoryName, $categoryStatus, $categoryId);

if ($stmt->execute()) {
    $response['success'] = true;
    $response['message'] = 'Category updated successfully.';
} else {
    $response['message'] = 'Failed to update category.';
}
$stmt->close();
$conn->close();

echo json_encode($response);
