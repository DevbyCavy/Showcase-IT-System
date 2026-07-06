<?php
require_once 'php_action/auth_guard.php';
requireRole("Super Admin"); // optional: restrict page to super admins only

require_once 'php_action/db_connection.php';


$sql = "SELECT * FROM users ORDER BY user_id DESC";
$result = $conn->query($sql);
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Manage Users</title>

    <!-- Bootstrap 5 -->
    <link rel="stylesheet" href="assets/bootstrap/css/bootstrap.min.css">

    <!-- Font Awesome -->
    <link rel="stylesheet" href="assets/font-awesome/css/all.min.css">

    <!-- Custom CSS -->
    <link rel="stylesheet" href="custom/css/custom.css">

    <!-- jQuery -->
    <script src="assets/jquery/jquery.min.js"></script>

    <!-- Bootstrap JS -->
    <script src="assets/bootstrap/js/bootstrap.bundle.min.js"></script>

</head>

<body class="bg-light">

<div class="container mt-5">

    <div class="d-flex justify-content-between align-items-center mb-3">
        <h4 class="fw-bold">Manage Users</h4>

        <!-- Return Button -->
        <a href="superDashboard.php" class="btn btn-danger">
            <i class="fas fa-arrow-left"></i> Return
        </a>
    </div>


    <!-- Search Bar -->
    <div class="card shadow-sm mb-4">
        <div class="card-body">
            <input type="text" id="searchInput" class="form-control" placeholder="Search users...">
        </div>
    </div>

    <!-- Users Table -->
    <div class="card shadow-sm">
        <div class="card-body table-responsive">

            <table class="table table-striped table-hover" id="usersTable">
                <thead class="table-light">
                    <tr>
                        <th>Full Name</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Department</th>
                        <th>User Type</th>
                        <th class="text-center">Options</th>
                    </tr>
                </thead>

                <tbody>
                    <?php
                    if ($result->num_rows > 0) {
                        $count = 1;
                        while ($row = $result->fetch_assoc()) {
                    ?>
                    <tr>
                        <td><?= $row['name'] . " " . $row['surname']; ?></td>
                        <td><?= $row['username']; ?></td>
                        <td><?= $row['email']; ?></td>
                        <td><?= $row['department']; ?></td>
                        <td><?= $row['user_type']; ?></td>

                        <!-- Options Column -->
                        <td class="text-center">
                            <div class="dropdown">
                                <button class="btn btn-sm btn-secondary dropdown-toggle" 
                                        type="button" 
                                        data-bs-toggle="dropdown">
                                    Action
                                </button>
                                <ul class="dropdown-menu">
                                    <li>
                                        <a class="dropdown-item" 
                                           href="update_user.php?id=<?= $row['user_id'] ?>">
                                            <i class="fas fa-edit me-2"></i>Edit
                                        </a>
                                    </li>
                                    <li>
                                        <a class="dropdown-item text-danger" 
                                           href="php_action/delete_user.php?id=<?= $row['user_id'] ?>"
                                           onclick="return confirm('Are you sure you want to delete this user?');">
                                            <i class="fas fa-trash me-2"></i>Delete
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </td>
                    </tr>
                    <?php } } else { ?>
                    <tr>
                        <td colspan="7" class="text-center">No users found.</td>
                    </tr>
                    <?php } ?>
                </tbody>

            </table>
        </div>
    </div>
</div>

<script>
// Live Search Filter
document.getElementById("searchInput").addEventListener("keyup", function () {
    let filter = this.value.toLowerCase();
    let rows = document.querySelectorAll("#usersTable tbody tr");

    rows.forEach(row => {
        let text = row.innerText.toLowerCase();
        row.style.display = text.includes(filter) ? "" : "none";
    });
});
</script>

</body>
</html>
