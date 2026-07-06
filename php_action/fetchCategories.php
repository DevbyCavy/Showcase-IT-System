<?php
require_once 'core.php';

$sql = "SELECT categories_id, categories_name, categories_active, categories_status 
        FROM category WHERE categories_status = 1";
$result = $conn->query($sql);

$output = ['data' => []];

if ($result && $result->num_rows > 0) {

    while ($row = $result->fetch_assoc()) {
        $categoriesId = $row['categories_id'];

        // Status badge
        $activeCategories = ($row['categories_active'] == 1)
            ? "<span class='badge bg-success'>Available</span>"
            : "<span class='badge bg-danger'>Not Available</span>";

        // Action dropdown
        $button = '
        <div class="btn-group">
          <button type="button" class="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
            Action
          </button>
          <ul class="dropdown-menu">
            <li><a class="dropdown-item" href="#" data-bs-toggle="modal" data-bs-target="#editCategoriesModel" onclick="editCategories(' . $categoriesId . ')">
              <i class="fas fa-edit me-2"></i>Edit
            </a></li>
            <li><a class="dropdown-item text-danger" href="#" data-bs-toggle="modal" data-bs-target="#removeCategoriesModal" onclick="removeCategories(' . $categoriesId . ')">
              <i class="fas fa-trash-alt me-2"></i>Remove
            </a></li>
          </ul>
        </div>';

        $output['data'][] = [
            $row['categories_name'],
            $activeCategories,
            $button
        ];
    }
}

$conn->close();
echo json_encode($output);
