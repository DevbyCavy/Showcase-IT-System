<?php 	

require_once 'core.php';

$sql = "SELECT product.product_id, product.product_name, product.product_image, product.brand_id,
 		product.categories_id, product.quantity, product.rate, product.active, product.status, 
 		brand.brand_name, category.categories_name FROM product 
		INNER JOIN brand ON product.brand_id = brand.brand_id 
		INNER JOIN category ON product.categories_id = category.categories_id  
		WHERE product.status = 1";

$result = $conn->query($sql);

$output = array('data' => array());

if($result->num_rows > 0) { 

	$active = ""; 

	while($row = $result->fetch_array()) {
		$productId = $row['product_id'];

		// active label
		$active = ($row['active'] == 1) ? "<span class='badge bg-success'>Available</span>" : "<span class='badge bg-danger'>Not Available</span>";

		// action dropdown
		$button = '
		<div class="btn-group">
			<button type="button" class="btn btn-secondary dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
				Action
			</button>
			<ul class="dropdown-menu">
				<li>
					<a class="dropdown-item" href="#" data-bs-toggle="modal" data-bs-target="#editProductModal" onclick="editProduct('.$productId.')">
						<i class="fa-solid fa-pen-to-square"></i> Edit
					</a>
				</li>
				<li>
					<a class="dropdown-item text-danger" href="#" data-bs-toggle="modal" data-bs-target="#removeProductModal" onclick="removeProduct('.$productId.')">
						<i class="fa-solid fa-trash"></i> Remove
					</a>
				</li>
			</ul>
		</div>';

		$brand = $row['brand_name'];
		$category = $row['categories_name'];

		// ✅ Show only uploaded image
		$productImage = !empty($row['product_image']) 
			? "<img class='rounded' src='".$row['product_image']."' style='height:30px; width:50px; object-fit:cover;' alt='Product Image' />" 
			: "<span class='text-muted'>No Image</span>";

		$output['data'][] = array(         
			$productImage,
			$row['product_name'],
			$row['rate'],
			$row['quantity'],
			$brand,
			$category,
			$active,
			$button
		);     
	}

}

$conn->close();

echo json_encode($output);
?>
