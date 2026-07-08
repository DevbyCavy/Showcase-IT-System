
<?php require_once 'php_action/auth_guard.php'; ?>

<?php

require_once 'php_action/db_connection.php';
$pageTitle = 'Store';
require_once 'includes/sidebarStores.php';
?>

<div class="dash-card">
    <div class="dash-card-head">
        <h5>Store Inventory</h5>
    </div>

    <div class="product-grid" id="productGrid">
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
          $statusClass = ($row['status'] == 1) ? "available" : "unavailable";
      ?>
      <div class="product-tile product-card">
        <span class="status-pill <?php echo $statusClass; ?>"><?php echo $statusText; ?></span>

        <div class="product-thumb">
          <img src="<?php echo $productImage; ?>" alt="<?php echo htmlspecialchars($row['product_name']); ?>">
        </div>

        <h6><?php echo htmlspecialchars($row['product_name']); ?></h6>
        <div class="product-meta"><?php echo htmlspecialchars($row['brand_name']); ?> &middot; <?php echo htmlspecialchars($row['categories_name']); ?></div>

        <div class="qty-row">
          <span>Qty: <span class="qty-value" id="qty-<?php echo $row['product_id']; ?>"><?php echo htmlspecialchars($row['quantity']); ?></span></span>
          <div class="qty-actions d-flex gap-2">
            <button class="btn-issue" title="Issue product"
                  onclick="openIssueModal(<?php echo $row['product_id']; ?>, '<?php echo htmlspecialchars($row['product_name'], ENT_QUOTES); ?>')">
                  <i class="fas fa-minus"></i>
            </button>
            <button class="btn-add" title="Add stock" onclick="adjustQuantity(<?php echo $row['product_id']; ?>, 1)">
              <i class="fas fa-plus"></i>
            </button>
          </div>
        </div>
      </div>
      <?php } ?>
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

<?php require_once 'includes/footerDashboard.php'; ?>
