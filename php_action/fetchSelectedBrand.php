<?php
require_once 'core.php';

header('Content-Type: application/json');

if (isset($_POST['brandId'])) {
    $brandId = intval($_POST['brandId']); // sanitize input

    $sql = "SELECT brand_id, brand_name, brand_active 
            FROM brand 
            WHERE brand_id = ? LIMIT 1";

    if ($stmt = $conn->prepare($sql)) {
        $stmt->bind_param("i", $brandId);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            $row = $result->fetch_assoc();
            echo json_encode($row); // ✅ return one brand only
        } else {
            echo json_encode([
                "error" => true,
                "message" => "Brand not found"
            ]);
        }
        $stmt->close();
    } else {
        echo json_encode([
            "error" => true,
            "message" => "Failed to prepare statement"
        ]);
    }
} else {
    echo json_encode([
        "error" => true,
        "message" => "No brand ID provided"
    ]);
}

$conn->close();
