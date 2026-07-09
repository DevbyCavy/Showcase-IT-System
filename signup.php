<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once 'php_action/db_connection.php';

$errors = [];
$success = "";

// Initialize variables to retain values
$name = $surname = $username = $department = $usertype = $email = "";

if ($_POST) {
    $name       = trim($_POST['name']);
    $surname    = trim($_POST['surname']);
    $username   = trim($_POST['username']);
    $password   = trim($_POST['password']);
    $confirm_password = trim($_POST['confirm_password']);
    $department = trim($_POST['department']);
    $usertype   = trim($_POST['user_type']);
    $email      = trim($_POST['email']); // optional

    // VALIDATION
    if ($name === "") $errors[] = "First Name is required";
    if ($surname === "") $errors[] = "Surname is required";
    if ($username === "") $errors[] = "Username is required";
    if ($password === "") $errors[] = "Password is required";
    if ($confirm_password === "") $errors[] = "Confirm Password is required";
    if ($password !== "" && $confirm_password !== "" && $password !== $confirm_password) $errors[] = "Passwords do not match";
    if ($department === "") $errors[] = "Department is required";
    if ($usertype === "") $errors[] = "User Type is required";

    if ($email !== "" && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors[] = "Invalid email format";
    }

    // Check duplicate username
    if (empty($errors)) {
        $check = $conn->prepare("SELECT user_id FROM users WHERE username = ?");
        $check->bind_param("s", $username);
        $check->execute();
        $check_result = $check->get_result();

        if ($check_result->num_rows > 0) {
            $errors[] = "Username already exists";
        }
    }

    // If no errors, insert user
    if (empty($errors)) {
        $hashed_password = password_hash($password, PASSWORD_DEFAULT);

        $stmt = $conn->prepare("
            INSERT INTO users (name, surname, username, password, user_type, department, email)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->bind_param("sssssss", $name, $surname, $username, $hashed_password, $usertype, $department, $email);

        if ($stmt->execute()) {
            $success = "Account created successfully. You may now log in.";
            $name = $surname = $username = $department = $usertype = $email = "";
        } else {
            $errors[] = "Failed to create account.";
        }
        $stmt->close();
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Stock Management System - Sign Up</title>

    <!-- Bootstrap 5 -->
    <link rel="stylesheet" href="assets/bootstrap/css/bootstrap.min.css">
    
    <!-- Font Awesome 6 -->
    <link rel="stylesheet" href="assets/font-awesome/css/all.min.css">
    
    <!-- Custom CSS -->
    <link rel="stylesheet" href="custom/css/custom.css">
    
    <!-- jQuery -->
    <script src="assets/jquery/jquery.min.js"></script>
    
    <!-- Bootstrap JS -->
    <script src="assets/bootstrap/js/bootstrap.bundle.min.js"></script>
</head>
<body class="bg-light">

<div class="container d-flex align-items-center justify-content-center" style="min-height: 100vh; margin-top: 20px; margin-bottom: 20px;">
    <div class="col-md-6 col-lg-5">
        <div class="card shadow-sm card-login">
            <div class="card-body text-center">

                <!-- Sign Up Label -->
                <h2 class="signin-label mb-4"><i class="fas fa-user-plus me-2"></i>Sign Up</h2>

                <!-- Logo -->
                <div class="logo-container mb-4">
                    <img src="images/showcaseit_logo.png" alt="Company Logo" class="img-fluid logo">
                </div>

                <!-- Sign Up Form -->
                <form action="<?= $_SERVER['PHP_SELF'] ?>" method="POST" id="signupForm">

                    <!-- Messages -->
                    <div id="signup-messages">
                        <?php if($errors){
                            foreach($errors as $value){
                                echo '<div class="alert alert-warning alert-dismissible fade show" role="alert">
                                <i class="fas fa-exclamation-triangle me-2"></i>'.htmlspecialchars($value).'
                                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                                </div>';
                            }
                        } ?>
                        <?php if($success) echo '<div class="alert alert-success">'.$success.'</div>'; ?>
                    </div>

                    <!-- Name -->
                    <div class="mb-3 text-start">
                        <label for="name" class="form-label">Name</label>
                        <input type="text" name="name" id="name" class="form-control" placeholder="Enter your name" value="<?= htmlspecialchars($name) ?>" required>
                    </div>

                    <!-- Surname -->
                    <div class="mb-3 text-start">
                        <label for="surname" class="form-label">Surname</label>
                        <input type="text" name="surname" id="surname" class="form-control" placeholder="Enter your surname" value="<?= htmlspecialchars($surname) ?>" required>
                    </div>

                    <!-- User Type -->
                    <div class="mb-3 text-start">
                        <label for="user_type" class="form-label">Job Title</label>
                        <select name="user_type" id="user_type" class="form-select" required>
                            <option value="">Select Job Title</option>
                            <option value="Stores Admin" <?= $usertype=="Stores Admin"?"selected":"" ?>>Stores Admin</option>
                            <option value="Project Manager" <?= $usertype=="Project Management"?"selected":"" ?>>Project Manager</option>
                            <option value="Marketer" <?= $usertype=="Marketer"?"selected":"" ?>>Marketer</option>
                            <option value="Accountant" <?= $usertype=="Accounts"?"selected":"" ?>>Accountant</option>
                            <option value="Graphic Designer" <?= $usertype=="Graphics"?"selected":"" ?>>Graphic Designer</option>
                            <option value="Production Team" <?= $usertype=="Production"?"selected":"" ?>>Technician</option>
                            <option value="Production Team" <?= $usertype=="Production"?"selected":"" ?>>Vinyl Applicator</option>
                            <option value="Logistics" <?= $usertype=="Logistics"?"selected":"" ?>>Driver</option>
                            <option value="Production Team" <?= $usertype=="Production"?"selected":"" ?>>Cook</option>
                        </select>
                    </div>

                    <!-- Department -->
                    <div class="mb-3 text-start">
                        <label for="department" class="form-label">Department</label>
                        <select name="department" id="department" class="form-select" required>
                            <option value="">Select Department</option>
                            <option value="Stores" <?= $department=="Stores Admin"?"selected":"" ?>>Stores</option>
                            <option value="Management" <?= $department=="Project Management"?"selected":"" ?>>Project Management</option>
                            <option value="Marketing" <?= $department=="Marketing"?"selected":"" ?>>Marketing</option>
                            <option value="Accounts" <?= $department=="Accounts"?"selected":"" ?>>Accounts/Finance</option>
                            <option value="Graphics Department" <?= $department=="Graphics"?"selected":"" ?>>Graphics</option>
                            <option value="Production" <?= $department=="Production"?"selected":"" ?>>Production</option>
                            <option value="Logistics" <?= $department=="Logistics"?"selected":"" ?>>Logistics</option>
                            <option value="Catering" <?= $department=="Catering"?"selected":"" ?>>Catering</option>
                        </select>
                    </div>

                    <!-- Email -->
                    <div class="mb-3 text-start">
                        <label for="email" class="form-label">Email <small class="text-muted">(optional)</small></label>
                        <input type="email" name="email" id="email" class="form-control" placeholder="Enter your email" value="<?= htmlspecialchars($email) ?>">
                    </div>

                    <!-- Username -->
                    <div class="mb-3 text-start">
                        <label for="username" class="form-label">Username</label>
                        <input type="text" name="username" id="username" class="form-control" placeholder="Choose a username" value="<?= htmlspecialchars($username) ?>" required>
                    </div>

                    <!-- Password -->
                    <div class="mb-3 text-start">
                        <label for="password" class="form-label">Password</label>
                        <input type="password" name="password" id="password" class="form-control" placeholder="Enter a password" required>
                    </div>

                    <!-- Confirm Password -->
                    <div class="mb-3 text-start">
                        <label for="confirm_password" class="form-label">Confirm Password</label>
                        <input type="password" name="confirm_password" id="confirm_password" class="form-control" placeholder="Re-enter password" required>
                    </div>

                    <!-- Submit -->
                    <button type="submit" class="btn btn-brand w-100">
                        <i class="fas fa-user-plus me-2"></i> Sign Up
                    </button>

                    <!-- Back to login -->
                    <div class="mt-3">
                        <a href="index.php" class="text-decoration-none">Back to Login</a>
                    </div>

                </form>
            </div>
        </div>
    </div>
</div>

<script>
document.getElementById('signupForm').addEventListener('submit', function(e){
    const pwd = document.getElementById('password').value;
    const confirmPwd = document.getElementById('confirm_password').value;
    if(pwd !== confirmPwd){
        e.preventDefault();
        alert('Passwords do not match!');
    }
});
</script>

</body>
</html>
