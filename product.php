<?php require_once 'php_action/auth_guard.php'; ?>

<?php require_once 'php_action/core.php'; ?>
<?php require_once 'includes/headerStores.php'; ?>  

<!-- Custom CSS -->
<link rel="stylesheet" href="custom/css/custom.css">

<link rel="stylesheet" href="https://cdn.datatables.net/1.13.6/css/dataTables.bootstrap5.min.css">

<div class="container-fluid px-3">
  <div class="col-md-12">

    <!-- Breadcrumb with searchbar -->
    <div class="p-3 mx-4 mb-3 mt-3 rounded d-flex justify-content-between align-items-center breadcrumb-custom">
      <nav aria-label="breadcrumb" class="mb-0">
        <ol class="breadcrumb mb-0 d-flex align-items-center">
          <li class="breadcrumb-item">
            <a href="dashboard.php">Home</a>
          </li>
          <li class="breadcrumb-item active" aria-current="page">Products</li>
        </ol>
      </nav>

      <!-- 🔍 Search Bar -->
      <div class="input-group shadow-sm" style="width: 280px;">
        <span class="input-group-text bg-white">
          <i class="fas fa-search text-muted"></i>
        </span>
        <input type="text" id="productSearch" class="form-control" placeholder="Search...">
      </div>
    </div>

    <!-- Card -->
    <div class="card shadow-sm mb-4 mx-4 card-custom">
      <div class="card-header card-header-custom">
        <h5 class="mb-0"><i class="fas fa-edit"></i> Manage Product</h5>
      </div>

      <div class="card-body">

        <div class="remove-messages"></div>

        <!-- Add Product Button -->
        <div class="text-end mb-3">
          <button class="btn btn-orange" data-bs-toggle="modal" data-bs-target="#addProductModel" id="addProductModalBtn">
            <i class="fas fa-plus-circle"></i> Add Product
          </button>
        </div>

        <!-- Table -->
        <div class="table-responsive">
          <table class="table table-bordered table-striped mb-0" id="manageProductTable">
            <thead class="table-light">
              <tr>
                <th>Image</th>
                <th>Product Name</th>
                <th>Amnt/Size(mm/ml/kg)</th>
                <th>Quantity</th>
                <th>Brand</th>
                <th>Category</th>
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

  <!-- Add Product Modal -->
  <div class="modal fade" id="addProductModel" tabindex="-1" aria-labelledby="addProductModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg" style="margin-top: 70px;"> <!-- larger width for better fit -->
        <div class="modal-content">

          <form class="form" id="submitProductForm" action="php_action/createProduct.php" method="POST" enctype="multipart/form-data">
              
              <!-- Modal Header -->
              <div class="modal-header bg-light">
              <h5 class="modal-title" id="addProductModalLabel">
                  <i class="fa-solid fa-plus me-2"></i> Add Product
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>

              <!-- Modal Body -->
              <div class="modal-body" style="max-height: 450px; overflow-y: auto;">
              
              <div id="add-product-messages"></div>

              <!-- Product Image -->
              <div class="mb-3 row align-items-center">
                  <label for="productImage" class="col-sm-3 col-form-label">Product Image</label>
                  <div class="col-sm-9">
                  <input type="file" class="form-control" id="productImage" name="productImage" />
                  </div>
              </div>

              <!-- Product Name -->
              <div class="mb-3 row align-items-center">
                  <label for="productName" class="col-sm-3 col-form-label">Product Name</label>
                  <div class="col-sm-9">
                  <input type="text" class="form-control" id="productName" name="productName" placeholder="Enter Product Name" autocomplete="off">
                  </div>
              </div>

              <!-- Quantity -->
              <div class="mb-3 row align-items-center">
                  <label for="quantity" class="col-sm-3 col-form-label">Quantity</label>
                  <div class="col-sm-9">
                  <input type="text" class="form-control" id="quantity" name="quantity" placeholder="Enter Quantity" autocomplete="off">
                  </div>
              </div>

              <!-- Rate -->
              <div class="mb-3 row align-items-center">
                  <label for="rate" class="col-sm-3 col-form-label">Amnt/Size(mm/ml/kg)</label>
                  <div class="col-sm-9">
                  <input type="text" class="form-control" id="rate" name="rate" placeholder="Enter Size" autocomplete="off">
                  </div>
              </div>

              <!-- Brand -->
              <div class="mb-3 row align-items-center">
                  <label for="brandName" class="col-sm-3 col-form-label">Brand Name</label>
                  <div class="col-sm-9">
                  <select class="form-select" id="brandName" name="brandName">
                      <option value="">SELECT</option>
                      <?php 
                      $sql = "SELECT brand_id, brand_name, brand_active, brand_status 
                              FROM brand 
                              WHERE brand_status = 1 AND brand_active = 1";
                      $result = $conn->query($sql);
                      while($row = $result->fetch_array()) {
                          echo "<option value='".$row[0]."'>".$row[1]."</option>";
                      }
                      ?>
                  </select>
                  </div>
              </div>

              <!-- Category -->
              <div class="mb-3 row align-items-center">
                  <label for="categoryName" class="col-sm-3 col-form-label">Category Name</label>
                  <div class="col-sm-9">
                  <select class="form-select" id="categoryName" name="categoryName">
                      <option value="">SELECT</option>
                      <?php 
                      $sql = "SELECT categories_id, categories_name, categories_active, categories_status 
                              FROM category
                              WHERE categories_status = 1 AND categories_active = 1";
                      $result = $conn->query($sql);
                      while($row = $result->fetch_array()) {
                          echo "<option value='".$row[0]."'>".$row[1]."</option>";
                      }
                      ?>
                  </select>
                  </div>
              </div>

              <!-- Status -->
              <div class="mb-3 row align-items-center">
                  <label for="productStatus" class="col-sm-3 col-form-label">Status</label>
                  <div class="col-sm-9">
                  <select class="form-select" id="productStatus" name="productStatus">
                      <option value="">~~SELECT~~</option>
                      <option value="1">Available</option>
                      <option value="2">Not Available</option>
                  </select>
                  </div>
              </div>

              </div>

              <!-- Modal Footer -->
              <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                  <i class="fa-solid fa-xmark me-1"></i> Close
              </button>
              <button type="submit" class="btn btn-primary" id="createProductBtn" autocomplete="off">
                  <i class="fa-solid fa-check me-1"></i> Save
              </button>
              </div>

          </form>

        </div>
      </div>
  </div><!-- /Add Product Modal -->

<!-- Edit Product Modal -->
<div class="modal fade" id="editProductModal" tabindex="-1" aria-labelledby="editProductModalLabel" aria-hidden="true">
  <div class="modal-dialog" role="document">
    <div class="modal-content">

      <!-- Modal Header -->
      <div class="modal-header">
        <h5 class="modal-title" id="editProductModalLabel">
          <i class="fa-solid fa-pen-to-square"></i> Edit Product
        </h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>

      <!-- Modal Body - REMOVED the duplicate modal-body from here -->
      <div class="modal-body" style="max-height:450px; overflow:auto;">

        <!-- Nav Tabs -->
        <ul class="nav nav-tabs mb-3" role="tablist">
          <li class="nav-item" role="presentation">
            <button class="nav-link active" id="photo-tab" data-bs-toggle="tab" data-bs-target="#photo" type="button" role="tab">
              <i class="fa-solid fa-image"></i> Photo
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button class="nav-link" id="productInfo-tab" data-bs-toggle="tab" data-bs-target="#productInfo" type="button" role="tab">
              <i class="fa-solid fa-box"></i> Product Info
            </button>
          </li>
        </ul>

        <!-- Tab Panes -->
        <div class="tab-content">

          <div class="tab-pane fade show active" id="photo" role="tabpanel" aria-labelledby="photo-tab">
            <!-- Add your photo upload form here -->

              <div id="edit-productPhoto-messages"></div>
              
            <form class="form" id="updateProductImageForm" 
                  action="php_action/editProductImage.php" 
                  method="POST" 
                  enctype="multipart/form-data">

              <!-- Existing Product Image Preview -->
              <div class="mb-3 row align-items-center">
                <label class="col-sm-3 col-form-label fw-semibold">
                  Current Image
                </label>

                <div class="col-sm-9">
                  <div class="p-2 border rounded-3 shadow-sm bg-white d-inline-block">
                    <img src="images/images.png" 
                        id="getProductImage" 
                        alt="Product Image"
                        class="img-fluid rounded-3"
                        style="width:250px; height:250px; object-fit:cover;">
                  </div>
                </div>
              </div>

              <!-- Upload New Product Image -->
              <div class="mb-3 row align-items-center">
                <label for="editProductImage" class="col-sm-3 col-form-label fw-semibold">
                  Upload New Image
                </label>

                <div class="col-sm-9">
                  <input id="editProductImage" name="editProductImage" type="file">
                  <div id="kv-avatar-errors-1" class="text-danger mt-2"></div>
                </div>
              </div>

              <!-- Modal Footer -->
              <div class="modal-footer editProductPhotoFooter">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                  <i class="fa-solid fa-xmark me-1"></i> Close
                </button>
                <button type="submit" class="btn btn-primary" id="editProductBtn" autocomplete="off">
                  <i class="fa-solid fa-check me-1"></i> Save
                </button>
              </div>

            </form>


          </div>

          <!-- Product Info Tab -->
          <div class="tab-pane fade" id="productInfo" role="tabpanel" aria-labelledby="productInfo-tab">

            <div id="edit-product-messages"></div>
            
            <form class="form" id="editProductForm" action="php_action/editProduct.php" method="POST" enctype="multipart/form-data">
              
              <!-- REMOVED the duplicate modal-body from here -->
              

              <!-- Product Name -->
              <div class="mb-3 row align-items-center">
                  <label for="editProductName" class="col-sm-3 col-form-label">Product Name</label>
                  <div class="col-sm-9">
                  <input type="text" class="form-control" id="editProductName" name="editProductName" placeholder="Enter Product Name" autocomplete="off">
                  </div>
              </div>

              <!-- Quantity -->
              <div class="mb-3 row align-items-center">
                  <label for="editQuantity" class="col-sm-3 col-form-label">Quantity</label>
                  <div class="col-sm-9">
                  <input type="text" class="form-control" id="editQuantity" name="editQuantity" placeholder="Enter Quantity" autocomplete="off">
                  </div>
              </div>

              <!-- Rate -->
              <div class="mb-3 row align-items-center">
                  <label for="editRate" class="col-sm-3 col-form-label">Amnt/Size(mm/ml/kg)</label>
                  <div class="col-sm-9">
                  <input type="text" class="form-control" id="editRate" name="editRate" placeholder="Enter Rate" autocomplete="off">
                  </div>
              </div>

              <!-- Brand -->
              <div class="mb-3 row align-items-center">
                  <label for="editBrandName" class="col-sm-3 col-form-label">Brand Name</label>
                  <div class="col-sm-9">
                  <select class="form-select" id="editBrandName" name="editBrandName">
                      <option value="">SELECT</option>
                      <?php 
                      $sql = "SELECT brand_id, brand_name, brand_active, brand_status 
                              FROM brand 
                              WHERE brand_status = 1 AND brand_active = 1";
                      $result = $conn->query($sql);
                      while($row = $result->fetch_array()) {
                          echo "<option value='".$row[0]."'>".$row[1]."</option>";
                      }
                      ?>
                  </select>
                  </div>
              </div>

              <!-- Category -->
              <div class="mb-3 row align-items-center">
                  <label for="editCategoryName" class="col-sm-3 col-form-label">Category Name</label>
                  <div class="col-sm-9">
                  <select class="form-select" id="editCategoryName" name="editCategoryName">
                      <option value="">SELECT</option>
                      <?php 
                      $sql = "SELECT categories_id, categories_name, categories_active, categories_status 
                              FROM category
                              WHERE categories_status = 1 AND categories_active = 1";
                      $result = $conn->query($sql);
                      while($row = $result->fetch_array()) {
                          echo "<option value='".$row[0]."'>".$row[1]."</option>";
                      }
                      ?>
                  </select>
                  </div>
              </div>

              <!-- Status -->
              <div class="mb-3 row align-items-center">
                  <label for="editProductStatus" class="col-sm-3 col-form-label">Status</label>
                  <div class="col-sm-9">
                  <select class="form-select" id="editProductStatus" name="editProductStatus">
                      <option value="">~~SELECT~~</option>
                      <option value="1">Available</option>
                      <option value="2">Not Available</option>
                  </select>
                  </div>
              </div>

              <!-- Modal Footer -->
              <div class="modal-footer editProductFooter">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                  <i class="fa-solid fa-xmark me-1"></i> Close
              </button>
              <button type="submit" class="btn btn-primary" id="editProductBtn" autocomplete="off">
                  <i class="fa-solid fa-check me-1"></i> Save
              </button>
              </div>

            </form>

          </div>
        </div>
      </div>
    </div>
  </div>
</div>



<!-- Remove Product Modal -->
<div class="modal fade" id="removeProductModal" tabindex="-1" aria-labelledby="removeProductModalLabel" aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-content">
      
      <!-- Modal Header -->
      <div class="modal-header">
        <h5 class="modal-title" id="removeProductModalLabel">
          <i class="fa-solid fa-trash-can"></i> Remove Product
        </h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>

      <!-- Modal Body -->
      <div class="modal-body">
        <div class="removeProductMessages mb-3"></div>
        <p>Do you really want to remove this product?</p>
      </div>

      <!-- Modal Footer -->
      <div class="modal-footer removeProductFooter">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
          <i class="fa-solid fa-xmark"></i> Close
        </button>
        <button type="button" class="btn btn-primary" id="removeProductBtn" data-bs-loading-text="Loading...">
          <i class="fa-solid fa-check"></i> Remove
        </button>
      </div>

    </div><!-- /.modal-content -->
  </div><!-- /.modal-dialog -->
</div><!-- /.modal -->
<!-- /Remove Product Modal -->


</div>

<!-- jQuery must load first -->
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
<script src="https://cdn.datatables.net/1.13.6/js/dataTables.bootstrap5.min.js"></script>

<!-- DataTables after jQuery -->
<script src="https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js"></script>

<!-- Your custom script last -->
<script src="custom/js/product.js"></script>

<?php require_once 'includes/footer.php'; ?>