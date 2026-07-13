<?php
require_once 'core.php';

header('Content-Type: application/json');

$response = ['success' => false, 'message' => 'Something went wrong.'];

$categoryName   = trim($_POST['categoryName']     ?? '');
$categoryStatus = intval($_POST['categoryStatus'] ?? 0);

if ($categoryName === '') {
    $response['message'] = 'Category name is required.';
    echo json_encode($response);
    exit;
}

$stmt = $conn->prepare("INSERT INTO category (categories_name, categories_active, categories_status) VALUES (?, ?, 1)");
$stmt->bind_param("si", $categoryName, $categoryStatus);

if ($stmt->execute()) {
    $response['success']     = true;
    $response['category_id'] = $conn->insert_id;
    $response['message']     = 'Category added successfully.';
} else {
    $response['message'] = 'Failed to add category.';
}
$stmt->close();
$conn->close();

echo json_encode($response);
