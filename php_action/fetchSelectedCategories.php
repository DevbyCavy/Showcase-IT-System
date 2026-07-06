<?php
require_once 'core.php';

header('Content-Type: application/json');

if (isset($_POST['categoriesId'])) {
    $categoriesId = intval($_POST['categoriesId']); // sanitize input

    $sql = "SELECT categories_id, categories_name, categories_active 
            FROM category 
            WHERE categories_id = ? LIMIT 1";

    if ($stmt = $conn->prepare($sql)) {
        $stmt->bind_param("i", $categoriesId);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            $row = $result->fetch_assoc();
            echo json_encode($row); // ✅ return one category only
        } else {
            echo json_encode([
                "error" => true,
                "message" => "Category not found"
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
        "message" => "No category ID provided"
    ]);
}

$conn->close();

?>
