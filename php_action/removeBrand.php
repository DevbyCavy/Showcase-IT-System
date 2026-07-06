<?php
require_once 'core.php';

// Initialize response array
$valid = array('success' => false, 'messages' => '');

if (isset($_POST['brandId'])) {
    $brandId = intval($_POST['brandId']); // sanitize input

    if ($brandId > 0) {
        // Use prepared statement to prevent SQL injection
        $stmt = $conn->prepare("UPDATE brand SET brand_status = 2 WHERE brand_id = ?");
        $stmt->bind_param("i", $brandId);

        if ($stmt->execute()) {
            $valid['success'] = true;
            $valid['messages'] = "Brand successfully removed";
        } else {
            $valid['success'] = false;
            $valid['messages'] = "Error removing brand: " . $stmt->error;
        }

        $stmt->close();
    } else {
        $valid['success'] = false;
        $valid['messages'] = "Invalid brand ID";
    }
} else {
    $valid['success'] = false;
    $valid['messages'] = "Brand ID not provided";
}

$conn->close();
echo json_encode($valid);
