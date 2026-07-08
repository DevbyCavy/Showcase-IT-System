<?php
require_once 'php_action/auth_guard.php';

$userType = $_SESSION['user_type'] ?? '';
$pageTitle = 'Issued Products Report';

if ($userType === 'Super Admin') {
    require_once 'includes/sidebarSuper.php';
} elseif ($userType === 'Stores Admin') {
    require_once 'includes/sidebarStores.php';
} else {
    require_once 'includes/header.php';
    echo '<link rel="stylesheet" href="custom/css/custom.css">';
    echo '<link rel="stylesheet" href="custom/css/modern-dashboard.css">';
    echo '<div class="container-fluid px-4 mt-3">';
}

require_once 'php_action/db_connection.php';
?>

<div class="dash-card">
    <div class="dash-card-head">
        <h5><i class="fa-solid fa-list me-2"></i>Issued Products Report</h5>
        <input type="text" id="issueSearch" class="form-control form-control-sm w-auto"
               placeholder="Search..." style="max-width:220px;">
    </div>

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
                          <td>" . htmlspecialchars($row['date_of_collection']) . "</td>
                          <td>" . htmlspecialchars($row['collector_name']) . "</td>
                          <td>" . htmlspecialchars($row['tool_name']) . "</td>
                          <td>" . htmlspecialchars($row['quantity_issued']) . "</td>
                          <td>" . htmlspecialchars($row['job_name']) . "</td>
                          <td>" . (!empty($row['date_of_return']) ? htmlspecialchars($row['date_of_return']) : "<span class='text-muted'>Not Returned</span>") . "</td>
                        </tr>";
                        $count++;
                    }
                } else {
                    echo "<tr><td colspan='7' class='text-center text-muted py-4'>No issued products found.</td></tr>";
                }
                ?>
            </tbody>
        </table>
    </div>
</div>

<script>
// Search filter for issued products table
document.getElementById("issueSearch").addEventListener("keyup", function() {
  const searchText = this.value.toLowerCase();
  const rows = document.querySelectorAll("#issuedProductsTable tbody tr");

  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(searchText) ? "" : "none";
  });
});
</script>

<?php
if (in_array($userType, ['Super Admin', 'Stores Admin'], true)) {
    require_once 'includes/footerDashboard.php';
} else {
    echo '</div>'; // close the container-fluid opened above
    require_once 'includes/footer.php';
}
?>
