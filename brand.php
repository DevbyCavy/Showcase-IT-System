<?php require_once 'php_action/auth_guard.php'; ?>
<?php require_once 'includes/headerStores.php'; ?>

<!-- Custom CSS -->
<link rel="stylesheet" href="custom/css/custom.css">

<div class="container-fluid px-3">
  <div class="col-md-12">

    <!-- Breadcrumb + Search -->
    <div class="p-3 mx-4 mb-3 mt-3 rounded breadcrumb-custom d-flex flex-column flex-md-row justify-content-between align-items-center">
      <nav aria-label="breadcrumb" class="mb-2 mb-md-0">
        <ol class="breadcrumb mb-0 d-flex align-items-center">
          <li class="breadcrumb-item">
            <a href="dashboard.php">Home</a>
          </li>
          <li class="breadcrumb-item active" aria-current="page">Brand</li>
        </ol>
      </nav>

      <!-- Search bar -->
      <div class="input-group shadow-sm" style="width: 250px;">
        <span class="input-group-text bg-white">
          <i class="fas fa-search text-muted"></i>
        </span>
        <input type="text" id="brandSearch" class="form-control" placeholder="Search...">
      </div>
    </div>

    <!-- Card -->
    <div class="card shadow-sm mb-4 mx-4 card-custom">
      <div class="card-header card-header-custom">
        <h5 class="mb-0"><i class="fas fa-edit"></i> Manage Brand</h5>
      </div>

      <div class="card-body">

        <div class="remove-messages"></div>

        <!-- Add Brand Button -->
        <div class="text-end mb-3">
          <button class="btn btn-orange" data-bs-toggle="modal" data-bs-target="#addBrandModel">
            <i class="fas fa-plus-circle"></i> Add Brand
          </button>
        </div>

        <!-- Table -->
        <div class="table-responsive">
          <table class="table table-bordered table-striped mb-0" id="manageBrandTable">
            <thead class="table-light">
              <tr>
                <th>Brand Name</th>
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


<!-- Add Brand Modal -->
<div class="modal fade" id="addBrandModel" tabindex="-1" aria-labelledby="addBrandLabel" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content shadow-sm rounded-3">

      <form id="submitBrandForm" action="php_action/createBrand.php" method="POST">
        <div class="modal-header bg-light border-0">
          <h5 class="modal-title" id="addBrandLabel"><i class="fa fa-plus me-1"></i> Add Brand</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>

        <div class="modal-body">
          <div id="add-brand-messages"></div>

          <!-- Brand Name -->
          <div class="mb-3 row">
            <label for="brandName" class="col-sm-4 col-form-label fw-semibold">Brand Name</label>
            <div class="col-sm-8">
              <input type="text" class="form-control" id="brandName" name="brandName" placeholder="Brand Name" autocomplete="off">
            </div>
          </div>

          <!-- Status -->
          <div class="mb-3 row">
            <label for="brandStatus" class="col-sm-4 col-form-label fw-semibold">Status</label>
            <div class="col-sm-8">
              <select class="form-select" id="brandStatus" name="brandStatus">
                <option value="">~~SELECT~~</option>
                <option value="1">Available</option>
                <option value="2">Not Available</option>
              </select>
            </div>
          </div>
        </div>

        <div class="modal-footer border-0">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
          <button type="submit" class="btn btn-orange" id="createBrandBtn">Save Changes</button>
        </div>
      </form>

    </div>
  </div>
</div>



<!-- Remove Brand Modal -->
<div class="modal fade" id="removeBrandModal" tabindex="-1" aria-labelledby="removeBrandModalLabel" aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="removeBrandModalLabel"><i class="fa-solid fa-trash"></i> Remove Brand</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        <p>Do you really want to remove this brand?</p>
        <input type="hidden" id="removeBrandId" name="brandId" />
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
          <i class="fa-solid fa-xmark"></i> Close
        </button>
        <button type="button" class="btn btn-danger" id="removeBrandBtn" data-bs-loading-text="Removing...">
          <i class="fa-solid fa-check"></i> Remove
        </button>
      </div>
    </div>
  </div>
</div>



<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
<script src="https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js"></script>
<script src="custom/js/brand.js"></script>

<?php require_once 'includes/footer.php'; ?>

