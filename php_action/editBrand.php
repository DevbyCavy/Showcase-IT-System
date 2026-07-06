<?php 	
require_once 'core.php';

// Initialize response array
$valid = array('success' => false, 'messages' => '');

// Check if POST request
if ($_POST) {    

    // Get POST data
    $brandId     = isset($_POST['brandId']) ? intval($_POST['brandId']) : 0;
    $brandName   = isset($_POST['editBrandName']) ? trim($_POST['editBrandName']) : '';
    $brandStatus = isset($_POST['editBrandStatus']) ? trim($_POST['editBrandStatus']) : '';

    // Validation
    if ($brandId <= 0) {
        $valid['messages'] = "Invalid brand ID.";
        echo json_encode($valid); exit;
    }

    if (empty($brandName)) {
        $valid['messages'] = "Brand name is required.";
        echo json_encode($valid); exit;
    }

    if (!in_array($brandStatus, ['1','2'])) {
        $valid['messages'] = "Please select a valid status.";
        echo json_encode($valid); exit;
    }

    // Prepare SQL statement
    $stmt = $conn->prepare("UPDATE brands SET brand_name = ?, brand_active = ? WHERE brand_id = ?");
    if ($stmt) {
        $stmt->bind_param("ssi", $brandName, $brandStatus, $brandId);

        if ($stmt->execute()) {
            $valid['success'] = true;
            $valid['messages'] = "Brand successfully updated.";
        } else {
            $valid['messages'] = "Database error: " . $stmt->error;
        }

        $stmt->close();
    } else {
        $valid['messages'] = "Failed to prepare SQL: " . $conn->error;
    }

    $conn->close();
    echo json_encode($valid);
}
