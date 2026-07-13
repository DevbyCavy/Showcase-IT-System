<?php
require_once 'core.php';

$sql = "SELECT categories_id, categories_name, categories_active, categories_status FROM category WHERE categories_status = 1";
$result = $conn->query($sql);

$output = ['data' => []];

while ($row = $result->fetch_assoc()) {
    $categoryId = $row['categories_id'];

    $active = ($row['categories_active'] == 1)
        ? "<span class='badge bg-success'>Available</span>"
        : "<span class='badge bg-danger'>Not Available</span>";

    $button = '
    <div class="btn-group">
        <button type="button" class="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
            Action
        </button>
        <ul class="dropdown-menu">
            <li><a class="dropdown-item" href="#" data-bs-toggle="modal" data-bs-target="#editCategoryModal" onclick="editCategory(' . $categoryId . ')">
                <i class="fas fa-edit me-2"></i>Edit
            </a></li>
            <li><a class="dropdown-item text-danger" href="#" data-bs-toggle="modal" data-bs-target="#removeCategoryModal" onclick="removeCategory(' . $categoryId . ')">
                <i class="fas fa-trash-alt me-2"></i>Remove
            </a></li>
        </ul>
    </div>';

    $output['data'][] = [
        htmlspecialchars($row['categories_name']),
        $active,
        $button
    ];
}

$conn->close();
echo json_encode($output);
