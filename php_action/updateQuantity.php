<?php
require_once 'db_connection.php'; // or db_connect.php depending on your setup

// Get raw JSON input
$data = json_decode(file_get_contents("php://input"), true);

if (isset($data['productId']) && isset($data['newQuantity'])) {
    $productId = (int)$data['productId'];
    $newQuantity = (int)$data['newQuantity'];

    // Prepare SQL to update the quantity
    $sql = "UPDATE product SET quantity = ? WHERE product_id = ?";
    $stmt = $conn->prepare($sql);

    if ($stmt) {
        $stmt->bind_param("ii", $newQuantity, $productId);
        $success = $stmt->execute();

        echo json_encode(["success" => $success]);
        $stmt->close();
    } else {
        echo json_encode(["success" => false, "error" => "Failed to prepare statement"]);
    }
} else {
    echo json_encode(["success" => false, "error" => "Invalid input"]);
}
?>
