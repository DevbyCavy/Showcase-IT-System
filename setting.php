<?php
require_once 'php_action/updateAccount.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account Settings - Showcase IT</title>

    <!-- Bootstrap 5 -->
    <link rel="stylesheet" href="assets/bootstrap/css/bootstrap.min.css">

    <!-- Font Awesome 6 -->
    <link rel="stylesheet" href="assets/font-awesome/css/all.min.css">

    <!-- Custom CSS -->
    <link rel="stylesheet" href="custom/custom.css">

    <!-- Bootstrap Bundle (with Popper) -->
    <script src="assets/bootstrap/js/bootstrap.bundle.min.js"></script>
</head>
<body class="bg-light">

<div class="container d-flex align-items-center justify-content-center" style="min-height: 100vh; margin-top: 20px; margin-bottom: 20px;">
    <div class="col-md-6 col-lg-5">
        <div class="card shadow-sm">
            <div class="card-body">

                <div class="d-flex align-items-center justify-content-between mb-4">
                    <h4 class="mb-0"><i class="fas fa-gear me-2" style="color:var(--brand-orange,#F15A2C);"></i>Account Settings</h4>
                    <a href="javascript:history.back()" class="small text-decoration-none"><i class="fas fa-arrow-left me-1"></i>Back</a>
                </div>

                <?php foreach ($errors as $e): ?>
                    <div class="alert alert-warning alert-dismissible fade show py-2" role="alert">
                        <i class="fas fa-exclamation-triangle me-2"></i><?= htmlspecialchars($e) ?>
                        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                    </div>
                <?php endforeach; ?>

                <?php if ($success): ?>
                    <div class="alert alert-success alert-dismissible fade show py-2" role="alert">
                        <i class="fas fa-check-circle me-2"></i><?= htmlspecialchars($success) ?>
                        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                    </div>
                <?php endif; ?>

                <form method="POST" action="">

                    <div class="mb-3">
                        <label class="form-label fw-semibold">Username</label>
                        <input type="text" name="new_username" class="form-control" value="<?= htmlspecialchars($currentUser['username']) ?>">
                    </div>

                    <hr>

                    <div class="mb-3">
                        <label class="form-label fw-semibold">New Password</label>
                        <input type="password" name="new_password" class="form-control" placeholder="Leave blank to keep current password">
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-semibold">Confirm New Password</label>
                        <input type="password" name="confirm_password" class="form-control" placeholder="Leave blank to keep current password">
                    </div>

                    <hr>

                    <div class="mb-3">
                        <label class="form-label fw-semibold">Current Password <span class="text-danger">*</span></label>
                        <input type="password" name="current_password" class="form-control" placeholder="Required to confirm any changes" required>
                    </div>

                    <button type="submit" name="account_submit" class="btn w-100" style="background:var(--brand-orange,#F15A2C); color:#fff; font-weight:600;">
                        <i class="fas fa-save me-2"></i>Save Changes
                    </button>

                </form>
            </div>
        </div>
    </div>
</div>

</body>
</html>
