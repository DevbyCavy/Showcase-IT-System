<?php

require_once 'core.php';

$sql = "SELECT brand_id, brand_name, brand_active, brand_status FROM brand WHERE brand_status = 1";
$result = $conn->query($sql);

$output = array('data' => array());

if($result->num_rows > 0) {

    while($row = $result->fetch_array()) {
        $brand_id = $row[0];

        // status badge
        $activeBrands = ($row[2] == 1) 
            ? "<span class='badge bg-success'>Available</span>" 
            : "<span class='badge bg-danger'>Not Available</span>";

        // action button
        $button = '
        <div class="btn-group">
            <button type="button" class="btn btn-secondary dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                Action
            </button>
            <ul class="dropdown-menu">
                <li><a class="dropdown-item" href="#" data-bs-toggle="modal" data-bs-target="#editBrandModel" onclick="editBrands('.$brand_id.')">
                    <i class="fas fa-edit"></i> Edit
                </a></li>
                <li><a class="dropdown-item" href="#" data-bs-toggle="modal" data-bs-target="#removeBrandModal" onclick="removeBrands('.$brand_id.')">
                    <i class="fas fa-trash"></i> Remove
                </a></li>
            </ul>
        </div>';

        $output['data'][] = array(
            $row[1],
            $activeBrands,
            $button
        );
    }

}

$conn->close();

echo json_encode($output);
