<?php
require_once 'core.php';

$valid = ['success' => false, 'messages' => ''];

if ($_POST) {
    $productId = $_POST['productId'] ?? null;

    // ✅ Validate ID
    if (!$productId) {
        $valid['messages'] = "No product ID provided.";
        echo json_encode($valid);
        exit;
    }

    // ✅ Check if file was actually uploaded
    if (isset($_FILES['editProductImage']) && $_FILES['editProductImage']['error'] === UPLOAD_ERR_OK) {

        $fileTmp  = $_FILES['editProductImage']['tmp_name'];
        $fileName = $_FILES['editProductImage']['name'];
        $fileType = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

        // ✅ Ensure upload folder exists
        $uploadDir = '../assets/images/stock/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        // ✅ Generate unique file path
        $newFileName = uniqid('img_', true) . '.' . $fileType;
        $url = $uploadDir . $newFileName;

        // ✅ Allowed types
        $allowed = ['gif', 'jpg', 'jpeg', 'png', 'webp'];
        if (in_array($fileType, $allowed)) {

            if (move_uploaded_file($fileTmp, $url)) {
                // ✅ Save relative path (not ../)
                $relativeUrl = str_replace('../', '', $url);

                $sql = "UPDATE product SET product_image = '$relativeUrl' WHERE product_id = $productId";
                if ($conn->query($sql) === TRUE) {
                    $valid['success'] = true;
                    $valid['newImageUrl'] = $relativeUrl;
                    $valid['messages'] = "Successfully updated product image.";
                } else {
                    $valid['messages'] = "Database update failed: " . $conn->error;
                }
            } else {
                $valid['messages'] = "Failed to move uploaded file.";
            }
        } else {
            $valid['messages'] = "Invalid file type. Please upload JPG, PNG, or GIF.";
        }
    } else {
        $valid['messages'] = "No image uploaded or upload error.";
    }

    $conn->close();
    echo json_encode($valid);
}
?>
