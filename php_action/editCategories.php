<?php 	

require_once 'core.php';

$valid['success'] = array('success' => false, 'messages' => array());

if($_POST) {	

  $brandName = $_POST['editCategoriesName'] ?? '';
  $brandStatus = $_POST['editCategoriesStatus'] ?? ''; 
  $categoriesId = $_POST['editCategoriesId'] ?? '';

	$sql = "UPDATE category SET categories_name = '$brandName', categories_active = '$brandStatus' WHERE categories_id = '$categoriesId'";

	if($conn->query($sql) === TRUE) {
	 	$valid['success'] = true;
		$valid['messages'] = "Successfully Updated";	
	} else {
	 	$valid['success'] = false;
	 	$valid['messages'] = "Error while updating the categories";
	}
	 
	$conn->close();

	echo json_encode($valid);
 
} // /if $_POST