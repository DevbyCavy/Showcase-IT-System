<?php
require_once 'core.php';

$sql = "SELECT product.product_id, product.product_name, product.product_image, product.brand_id,
        product.categories_id, product.quantity, product.rate, product.active, product.status,
        brand.brand_name, category.categories_name
        FROM product
        LEFT JOIN brand ON product.brand_id = brand.brand_id
        LEFT JOIN category ON product.categories_id = category.categories_id
        WHERE product.status = 1";

$result = $conn->query($sql);

$output = array('data' => array());

while ($row = $result->fetch_assoc()) {
    $productId = $row['product_id'];

    $active = ($row['active'] == 1)
        ? "<span class='badge bg-success'>Available</span>"
        : "<span class='badge bg-danger'>Not Available</span>";

    $button = '
    <div class="btn-group">
        <button type="button" class="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
            Action
        </button>
        <ul class="dropdown-menu">
            <li><a class="dropdown-item" href="#" data-bs-toggle="modal" data-bs-target="#editProductModal" onclick="editProduct(' . $productId . ')">
                <i class="fa-solid fa-pen-to-square me-2"></i>Edit
            </a></li>
            <li><a class="dropdown-item text-danger" href="#" data-bs-toggle="modal" data-bs-target="#removeProductModal" onclick="removeProduct(' . $productId . ')">
                <i class="fa-solid fa-trash me-2"></i>Remove
            </a></li>
        </ul>
    </div>';

    $productImage = !empty($row['product_image'])
        ? "<img class='rounded' src='" . htmlspecialchars($row['product_image']) . "' style='height:36px; width:56px; object-fit:cover;' alt='Product Image' />"
        : "<span class='text-muted'>No Image</span>";

    $output['data'][] = array(
        $productImage,
        htmlspecialchars($row['product_name']),
        htmlspecialchars($row['rate']),
        htmlspecialchars($row['quantity']),
        htmlspecialchars($row['brand_name'] ?? 'Unbranded'),
        htmlspecialchars($row['categories_name'] ?? 'Uncategorised'),
        $active,
        $button
    );
}

$conn->close();
echo json_encode($output);
