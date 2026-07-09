<?php
require_once 'php_action/auth_guard.php';
requireRole("Super Admin");

require_once 'php_action/db_connection.php';

$sql = "SELECT * FROM users ORDER BY user_id DESC";
$result = $conn->query($sql);

$pageTitle = 'Manage Users';
require_once 'includes/sidebarSuper.php';
?>

<div class="dash-card">
    <div class="dash-card-head">
        <h5>Manage Users</h5>
        <div class="d-flex align-items-center gap-2">
            <input type="text" id="searchInput" class="form-control form-control-sm"
                   placeholder="Search users..." style="max-width:220px;">
            <a href="signup.php" class="btn-issue-req" style="padding:8px 16px; font-size:.85rem;">
                <i class="fas fa-user-plus me-1"></i>Add User
            </a>
        </div>
    </div>

    <div class="table-responsive">
        <table class="table table-striped table-hover align-middle" id="usersTable">
            <thead class="table-dark">
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
                <?php if ($result->num_rows > 0): ?>
                    <?php while ($row = $result->fetch_assoc()): ?>
                    <tr>
                        <td><?= htmlspecialchars($row['name'] . ' ' . $row['surname']) ?></td>
                        <td><?= htmlspecialchars($row['username']) ?></td>
                        <td><?= htmlspecialchars($row['email']) ?></td>
                        <td><?= htmlspecialchars($row['department']) ?></td>
                        <td><?= htmlspecialchars($row['user_type']) ?></td>

                        <!-- Options Column -->
                        <td class="text-center">
                            <div class="dropdown">
                                <button class="btn btn-sm btn-secondary dropdown-toggle"
                                        type="button"
                                        data-bs-toggle="dropdown">
                                    Action
                                </button>
                                <ul class="dropdown-menu dropdown-menu-end">
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
                    <?php endwhile; ?>
                <?php else: ?>
                    <tr>
                        <td colspan="6" class="text-center text-muted py-4">No users found.</td>
                    </tr>
                <?php endif; ?>
            </tbody>

        </table>
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

<?php require_once 'includes/footerDashboard.php'; ?>
