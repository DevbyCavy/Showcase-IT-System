<?php require_once 'php_action/auth_guard.php'; ?>
<?php require_once 'includes/headerStores.php'; ?> 

<!-- Custom CSS -->
<link rel="stylesheet" href="custom/css/custom.css">

<?php
require_once 'php_action/db_connection.php';?>

<div class="container-fluid px-3">
  <div class="col-12">

    <!-- Breadcrumb -->
    <div class="p-3 mx-4 mb-3 mt-3 rounded d-flex justify-content-between align-items-center"
         style="background-color: rgba(255, 165, 0, 0.1);">
      <nav aria-label="breadcrumb" class="mb-0">
        <ol class="breadcrumb mb-0 d-flex align-items-center">
          <li class="breadcrumb-item"><a href="../dashboard.php">Home</a></li>
          <li class="breadcrumb-item"><a href="../reports/">Reports</a></li>
          <li class="breadcrumb-item active" aria-current="page">Issued Products</li>
        </ol>
      </nav>

      <!-- 🔍 Search Bar -->
      <div class="input-group shadow-sm" style="width: 280px;">
        <span class="input-group-text bg-white">
          <i class="fas fa-search text-muted"></i>
        </span>
        <input type="text" id="issueSearch" class="form-control" placeholder="Search...">
      </div>
    </div>

    <!-- Report Table -->
    <div class="card mx-4 shadow-sm border-0">
      <div class="card-body">
        <h5 class="card-title mb-3"><i class="fa-solid fa-list me-2 text-warning"></i>Issued Products Report</h5>
        <div class="table-responsive">
          <table class="table table-striped align-middle" id="issuedProductsTable">
            <thead class="table-dark">
              <tr>
                <th>#</th>
                <th>Date of Collection</th>
                <th>Collector Name</th>
                <th>Product Name</th>
                <th>Quantity Issued</th>
                <th>Job Name</th>
                <th>Date of Return</th>
              </tr>
            </thead>
            <tbody>
              <?php
              $sql = "SELECT * FROM issued_tools ORDER BY date_of_collection DESC";
              $result = $conn->query($sql);
              $count = 1;

              if ($result->num_rows > 0) {
                while ($row = $result->fetch_assoc()) {
                  echo "
                  <tr>
                    <td>{$count}</td>
                    <td>{$row['date_of_collection']}</td>
                    <td>{$row['collector_name']}</td>
                    <td>{$row['tool_name']}</td>
                    <td>{$row['quantity_issued']}</td>
                    <td>{$row['job_name']}</td>
                    <td>" . (!empty($row['date_of_return']) ? $row['date_of_return'] : "<span class='text-muted'>Not Returned</span>") . "</td>
                  </tr>";
                  $count++;
                }
              } else {
                echo "<tr><td colspan='7' class='text-center text-muted'>No issued products found.</td></tr>";
              }
              ?>
            </tbody>
          </table>
        </div>
      </div>
    </div>

  </div>
</div>

<script>
// 🔍 Search functionality for issued products table
document.getElementById("issueSearch").addEventListener("keyup", function() {
  const searchText = this.value.toLowerCase();
  const rows = document.querySelectorAll("#issuedProductsTable tbody tr");

  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(searchText) ? "" : "none";
  });
});
</script>

<?php require_once 'includes/footer.php'; ?>  
