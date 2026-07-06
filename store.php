
<?php require_once 'php_action/auth_guard.php'; ?>

<?php

require_once 'php_action/db_connection.php';
require_once 'includes/headerStores.php';
?>

<!-- Custom CSS -->
<link rel="stylesheet" href="custom/css/custom.css">

<div class="container-fluid px-3">
  <div class="col-12">

    <!-- Breadcrumb in faint orange box -->
    <div class="p-3 mx-4 mb-2 mt-3 rounded d-flex justify-content-between align-items-center"
         style="background-color: rgba(255, 165, 0, 0.1);">
      <nav aria-label="breadcrumb" class="mb-0">
        <ol class="breadcrumb mb-0 d-flex align-items-center">
          <li class="breadcrumb-item">
            <a href="dashboard.php">Home</a>
          </li>
          <li class="breadcrumb-item active" aria-current="page">Store</li>
        </ol>
      </nav>

      <!-- 🔍 Search Bar (Top Right) -->
      <div class="input-group shadow-sm" style="width: 280px;">
        <span class="input-group-text bg-white">
          <i class="fas fa-search text-muted"></i>
        </span>
        <input type="text" id="productSearch" class="form-control" placeholder="Search...">
      </div>
    </div>

    <!-- Products Grid -->
    <div class="row g-3 mx-4" id="productGrid">
      <?php
      $sql = "SELECT p.*, c.categories_name, b.brand_name 
              FROM product p 
              LEFT JOIN category c ON p.categories_id = c.categories_id
              LEFT JOIN brand b ON p.brand_id = b.brand_id
              WHERE p.active = 1 AND p.status = 1";
      $result = $conn->query($sql);

      while ($row = $result->fetch_assoc()) {
          $productImage = $row['product_image'] ?: 'images/images.png';
          $statusText = ($row['status'] == 1) ? "Available" : "Not Available";
      ?>
      <div class="col-sm-6 col-md-4 col-lg-3 product-card">
        <div class="card h-100 shadow-sm border-0">
          <!-- Image Container -->
          <div class="d-flex justify-content-center align-items-center p-2" style="height:220px; overflow:hidden;">
            <img src="<?php echo $productImage; ?>" class="img-fluid"
                 alt="<?php echo $row['product_name']; ?>"
                 style="object-fit:cover; max-height:100%; border-radius:8px;">
          </div>

          <div class="card-body d-flex flex-column">
            <h6 class="fw-bold text-dark mb-1"><?php echo $row['product_name']; ?></h6>
            <p class="mb-1 text-secondary small"><strong>Brand:</strong> <?php echo $row['brand_name']; ?></p>
            <p class="mb-1 text-secondary small"><strong>Category:</strong> <?php echo $row['categories_name']; ?></p>
            <p class="mb-1 text-secondary small"><strong>Status:</strong> <?php echo $statusText; ?></p>
            <p class="mb-1 text-secondary small">
              <strong>Quantity:</strong>
              <span id="qty-<?php echo $row['product_id']; ?>"><?php echo $row['quantity']; ?></span>
            </p>

            <div class="mt-auto d-flex justify-content-between">
              <button class="btn btn-sm btn-outline-danger"
                    onclick="openIssueModal(<?php echo $row['product_id']; ?>, '<?php echo htmlspecialchars($row['product_name'], ENT_QUOTES); ?>')">
                    <i class="fas fa-minus"></i>
              </button>

              <button class="btn btn-sm btn-outline-success" onclick="adjustQuantity(<?php echo $row['product_id']; ?>, 1)">
                <i class="fas fa-plus"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
      <?php } ?>
    </div>

  </div>
</div>

<!-- Issue Product Modal -->
<div class="modal fade" id="issueProductModal" tabindex="-1" aria-labelledby="issueProductModalLabel" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content border-0 shadow-lg">
      
      <!-- Header with custom orange -->
      <div class="modal-header text-white" style="background-color: #F15A2C;">
        <h5 class="modal-title" id="issueProductModalLabel">
          <i class="fa-solid fa-toolbox me-2"></i> Issue Product
        </h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
      </div>

      <div class="modal-body">
        <!-- Alert Message Container -->
        <div id="issue-product-message"></div>

        <form id="issueProductForm">
          <input type="hidden" name="product_id" id="issue_product_id">

          <div class="mb-3">
            <label class="form-label">Date of Collection</label>
            <input type="date" class="form-control" name="date_of_collection" required>
          </div>

          <div class="mb-3">
            <label class="form-label">Name of Collector</label>
            <input type="text" class="form-control" name="collector_name" required>
          </div>

          <div class="mb-3">
            <label class="form-label">Product</label>
            <input type="text" class="form-control" name="tool_name" readonly>
          </div>

          <div class="mb-3">
            <label class="form-label">Quantity</label>
            <input type="number" class="form-control" name="quantity_issued" min="1" required>
          </div>

          <div class="mb-3">
            <label class="form-label">Job Name</label>
            <input type="text" class="form-control" name="job_name" required>
          </div>

          <div class="mb-3">
            <label class="form-label">Date of Return</label>
            <input type="date" class="form-control" name="date_of_return">
          </div>

          <div class="text-end">
            <button type="submit" class="btn btn-orange">
              <i class="fa-solid fa-paper-plane me-1"></i> Save Record
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</div>


<script src="custom/js/issuedProduct.js"></script>

<?php require_once 'includes/footer.php'; ?>
