<?php require_once 'php_action/auth_guard.php'; ?>
<?php require_once 'includes/headerStores.php'; ?>

<!-- Custom CSS -->
<link rel="stylesheet" href="custom/css/custom.css">

<link rel="stylesheet" href="https://cdn.datatables.net/1.13.6/css/jquery.dataTables.min.css">

<div class="container-fluid px-3">
  <div class="col-md-12">

    <!-- Breadcrumb with search -->
    <div class="p-3 mx-4 mb-3 mt-3 rounded d-flex justify-content-between align-items-center breadcrumb-custom">
      <nav aria-label="breadcrumb" class="mb-0">
        <ol class="breadcrumb mb-0 d-flex align-items-center">
          <li class="breadcrumb-item">
            <a href="dashboard.php">Home</a>
          </li>
          <li class="breadcrumb-item active" aria-current="page">Categories</li>
        </ol>
      </nav>

      <!-- 🔍 Search Bar -->
      <div class="input-group shadow-sm" style="width: 280px;">
        <span class="input-group-text bg-white">
          <i class="fas fa-search text-muted"></i>
        </span>
        <input type="text" id="categorySearch" class="form-control" placeholder="Search...">
      </div>
    </div>

    <!-- Card -->
    <div class="card shadow-sm mb-4 mx-4 card-custom">
      <div class="card-header card-header-custom">
        <h5 class="mb-0"><i class="fas fa-edit"></i> Manage Categories</h5>
      </div>

      <div class="card-body">

        <div class="remove-messages"></div>

        <!-- Add Category Button -->
        <div class="text-end mb-3">
          <button class="btn btn-orange" data-bs-toggle="modal" data-bs-target="#addCategoryModel" id="addCategoriesModalBtn">
            <i class="fas fa-plus-circle"></i> Add Category
          </button>
        </div>

        <!-- Table -->
        <div class="table-responsive">
          <table class="table table-bordered table-striped mb-0" id="manageCategoriesTable">
            <thead class="table-light">
              <tr>
                <th>Category Name</th>
                <th>Status</th>
                <th style="width:15%;">Options</th>
              </tr>
            </thead>
            <tbody>
              <!-- Dynamic rows -->
            </tbody>
          </table>
        </div>

      </div>
    </div>

  </div>
</div>


<!-- Add Category Modal -->
<div class="modal fade" id="addCategoryModel" tabindex="-1" aria-labelledby="addCategoryLabel" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content border-0 shadow-lg">

      <form id="submitCategoriesForm" action="php_action/createCategory.php" method="POST">
        <div class="modal-header bg-orange text-white">
          <h5 class="modal-title" id="addCategoryLabel"><i class="fa fa-plus me-2"></i> Add Category</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>

        <div class="modal-body">

          <div id="add-category-messages"></div>

          <!-- Category Name -->
          <div class="mb-3 row">
            <label for="categoryName" class="col-sm-4 col-form-label">Category Name</label>
            <div class="col-sm-8">
              <input type="text" class="form-control" id="categoryName" name="categoryName" placeholder="Category Name" autocomplete="off">
            </div>
          </div>

          <!-- Status -->
          <div class="mb-3 row">
            <label for="categoryStatus" class="col-sm-4 col-form-label">Status</label>
            <div class="col-sm-8">
              <select class="form-select" id="categoryStatus" name="categoryStatus">
                <option value="">~~SELECT~~</option>
                <option value="1">Available</option>
                <option value="2">Not Available</option>
              </select>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
          <button type="submit" class="btn btn-orange" id="createCategoryBtn">Save Changes</button>
        </div>
      </form>

    </div>
  </div>
</div>


<!-- edit brand -->
<div class="modal fade" id="editCategoryModel" tabindex="-1" role="dialog">
  <div class="modal-dialog">
    <div class="modal-content">
    	
    	<form class="form-horizontal" id="editCategoryForm" action="php_action/editCategory.php" method="POST">
	      <div class="modal-header">
	        <h4 class="modal-title"><i class="fa fa-edit"></i> Edit Brand</h4>
	      </div>
	      
	      <div class="modal-body">

	      	<div id="edit-brand-messages"></div>

		      <div class="edit-brand-result">
		      	<div class="form-group mb-3 row">
		        	<label for="editBrandName" class="col-sm-4 control-label">Brand Name </label>
					    <div class="col-sm-8">
					      <input type="text" class="form-control" id="editBrandName" placeholder="Brand Name" name="editBrandName" autocomplete="off">
					    </div>
		        </div> <!-- /form-group-->	         	        
		        <div class="form-group mb-3 row">
		        	<label for="editBrandStatus" class="col-sm-4 control-label">Status </label>
					    <div class="col-sm-8">
					      <select class="form-control" id="editBrandStatus" name="editBrandStatus">
					      	<option value="">~~SELECT~~</option>
					      	<option value="1">Available</option>
					      	<option value="2">Not Available</option>
					      </select>
					    </div>
		        </div> <!-- /form-group-->	
		      </div>         	        
		      <!-- /edit brand result -->

	      </div> <!-- /modal-body -->
	      
	      <div class="modal-footer editBrandFooter">
	        <!-- Close button now dismisses modal -->
	        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
            <i class="fa-solid fa-xmark"></i> Close
          </button>
	        
	        <button type="submit" class="btn btn-success" id="editBrandBtn" data-loading-text="Loading..." autocomplete="off"> 
            <i class="btn btn-primary"></i> Save Changes
          </button>
	      </div>
	      <!-- /modal-footer -->
     	</form>
	     <!-- /.form -->
    </div>
    <!-- /modal-content -->
  </div>
  <!-- /modal-dailog -->
</div>
<!-- /edit brand -->


<!-- Edit Category Modal -->
<div class="modal fade" id="editCategoriesModel" tabindex="-1" aria-labelledby="editCategoriesModalLabel" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content border-0 shadow-lg">

      <form id="editCategoriesForm" action="php_action/editCategories.php" method="POST">
        <div class="modal-header bg-orange text-white">
          <h5 class="modal-title" id="editCategoriesModalLabel">
            <i class="fas fa-edit me-2"></i> Edit Category
          </h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>

        <div class="modal-body">
          <!-- Messages -->
          <div id="edit-categories-messages"></div>

          <!-- Loading spinner -->
          <div class="modal-loading text-center d-none py-4">
            <i class="fas fa-spinner fa-spin fa-2x"></i>
            <p class="mt-2 mb-0">Loading...</p>
          </div>

          <!-- Form Fields -->
          <div class="edit-categories-result">
            <div class="mb-3 row">
              <label for="editCategoriesName" class="col-sm-4 col-form-label">Category Name</label>
              <div class="col-sm-8">
                <input type="text" class="form-control" id="editCategoriesName" name="editCategoriesName" placeholder="Category Name" autocomplete="off">
              </div>
            </div>

            <div class="mb-3 row">
              <label for="editCategoriesStatus" class="col-sm-4 col-form-label">Status</label>
              <div class="col-sm-8">
                <select class="form-select" id="editCategoriesStatus" name="editCategoriesStatus">
                  <option value="">~~SELECT~~</option>
                  <option value="1">Available</option>
                  <option value="2">Not Available</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer editCategoriesFooter">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
            <i class="fas fa-times me-2"></i> Close
          </button>
          <button type="submit" class="btn btn-orange" id="editCategoriesBtn" autocomplete="off">
            <i class="fas fa-check me-2"></i> Save Changes
          </button>
        </div>
      </form>

    </div>
  </div>
</div>
<!-- /Edit Category Modal -->




<!-- Remove Category Modal -->
<div class="modal fade" id="removeCategoriesModal" tabindex="-1" aria-labelledby="removeCategoriesModalLabel" aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-content">

      <div class="modal-header">
        <h5 class="modal-title" id="removeCategoriesModalLabel">
          <i class="fas fa-trash-alt me-2"></i> Remove Category
        </h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>

      <div class="modal-body">
        <p>Do you really want to remove this category?</p>
        <input type="hidden" id="removeCategoriesId" name="categoriesId" />
      </div>

      <div class="modal-footer removeCategoriesFooter">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
          <i class="fas fa-times me-2"></i> Close
        </button>
        <button type="button" class="btn btn-danger" id="removeCategoriesBtn">
          <i class="fas fa-check me-2"></i> Confirm
        </button>
      </div>

    </div>
  </div>
</div>
<!-- /Remove Category Modal -->



<!-- jQuery must load first -->
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>

<!-- DataTables after jQuery -->
<script src="https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js"></script>

<!-- Your custom script last -->
<script src="custom/categories.js"></script>

<?php require_once 'includes/footer.php'; ?>