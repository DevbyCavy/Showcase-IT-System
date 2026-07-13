<?php
require_once 'core.php';

$sql = "SELECT brand_id, brand_name, brand_active, brand_status FROM brand WHERE brand_status = 1";
$result = $conn->query($sql);

$output = array('data' => array());

while ($row = $result->fetch_assoc()) {
    $brandId = $row['brand_id'];

    $active = ($row['brand_active'] == 1)
        ? "<span class='badge bg-success'>Available</span>"
        : "<span class='badge bg-danger'>Not Available</span>";

    $button = '
    <div class="btn-group">
        <button type="button" class="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
            Action
        </button>
        <ul class="dropdown-menu">
            <li><a class="dropdown-item" href="#" data-bs-toggle="modal" data-bs-target="#editBrandModal" onclick="editBrand(' . $brandId . ')">
                <i class="fas fa-edit me-2"></i>Edit
            </a></li>
            <li><a class="dropdown-item text-danger" href="#" data-bs-toggle="modal" data-bs-target="#removeBrandModal" onclick="removeBrand(' . $brandId . ')">
                <i class="fas fa-trash me-2"></i>Remove
            </a></li>
        </ul>
    </div>';

    $output['data'][] = array(
        htmlspecialchars($row['brand_name']),
        $active,
        $button
    );
}

$conn->close();
echo json_encode($output);
