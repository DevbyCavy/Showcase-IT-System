<?php
require_once 'core.php';

header('Content-Type: application/json');

$response = ['success' => false, 'messages' => ''];

if (isset($_POST['categoriesId'])) {

    $categoriesId = (int) $_POST['categoriesId'];
    $sql = "UPDATE category SET categories_status = 2 WHERE categories_id = {$categoriesId}";

    if ($conn->query($sql) === TRUE) {
        $response['success'] = true;
        $response['messages'] = 'Category removed successfully.';
    } else {
        $response['messages'] = 'Error while removing the category: ' . $conn->error;
    }

    $conn->close();
}

echo json_encode($response);
