<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once 'php_action/db_connection.php';

// If already logged in
if (isset($_SESSION['user_id'])) {
    header("Location: dashboard.php");
    exit();
}

$errors = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    $username = trim($_POST['username']);
    $password = trim($_POST['password']);

    if ($username === '') $errors[] = "Username is required";
    if ($password === '') $errors[] = "Password is required";

    if (empty($errors)) {

        try {
            $stmt = $conn->prepare("
                SELECT user_id, username, password, name, surname, user_type, department 
                FROM users 
                WHERE username = ?
                LIMIT 1
            ");
            $stmt->bind_param("s", $username);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($result->num_rows === 1) {

                $user = $result->fetch_assoc();

                // Verify hashed password
                if (password_verify($password, $user['password'])) {

                    // Prevent session hijacking
                    session_regenerate_id(true);

                    $_SESSION['user_id']     = $user['user_id'];
                    $_SESSION['username']    = $user['username'];
                    $_SESSION['user_type']   = $user['user_type'];
                    $_SESSION['department']  = $user['department'];

                    // Redirect based on user type
                    switch ($user['user_type']) {

                        case 'Super Admin':
                            header("Location: superDashboard.php");
                            break;

                        case 'Stores Admin':
                            header("Location: storesDashboard.php");
                            break;

                        case 'Project Manager':
                            header("Location: proj_manDashboard.php");
                            break;

                        case 'Marketer':
                            header("Location: marketingDashboard.php");
                            break;

                        case 'Accountant':
                            header("Location: accountsDashboard.php");
                            break;

                        case 'Graphic Designer':
                            header("Location: designDashboard.php");
                            break;

                        case 'Production Team':
                            header("Location: prod_teamDashboard.php");
                            break;
                            
                         case 'Logistics':
                            header("Location: logisticsDashboard.php");
                            break;

                        default:
                            header("Location: dashboardOne.php");
                            break;
                    }
                    exit();

                } else {
                    $errors[] = "Incorrect username or password";
                }

            } else {
                $errors[] = "Incorrect username or password";
            }

            $stmt->close();

        } catch (Exception $e) {
            error_log("LOGIN ERROR: " . $e->getMessage());
            $errors[] = "Something went wrong. Please try again later.";
        }
    }
}
?>


<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Stock Management System - Login</title>

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

    <div class="container d-flex align-items-center justify-content-center min-vh-100">
        <div class="col-md-5 col-lg-4">
            <div class="card shadow-sm card-login">
                <div class="card-body text-center">

                    <h2 class="signin-label mb-4">Sign In</h2>

                    <div class="logo-container mb-4">
                        <img src="images/showcaseit_logo.png" alt="Company Logo" class="img-fluid logo">
                    </div>

                    <form action="<?php echo htmlspecialchars($_SERVER['PHP_SELF']); ?>" method="POST" id="loginForm">

                        <div id="login-messages">
                            <?php 
                            if (!empty($errors)) {
                                foreach ($errors as $value) {
                                    echo '<div class="alert alert-warning alert-dismissible fade show" role="alert">
                                        <i class="fas fa-exclamation-triangle me-2"></i>' . $value . '
                                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                                    </div>';
                                }
                            }
                            ?>
                        </div>

                        <div class="mb-3 text-start">
                            <label for="username" class="form-label">Username</label>
                            <input type="text" name="username" class="form-control" id="username" placeholder="Enter your username">
                        </div>

                        <div class="mb-3 text-start">
                            <label for="password" class="form-label">Password</label>
                            <input type="password" name="password" class="form-control" id="password" placeholder="Enter your password">
                        </div>

                        <button type="submit" class="btn btn-brand w-100">
                            <i class="fas fa-sign-in-alt me-2"></i> Sign In
                        </button>

                        <div class="mt-3 d-flex justify-content-center align-items-center gap-2">
                            <p class="mb-0">No Account?</p>
                            <a href="signup.php" class="text-decoration-none">Sign Up</a>
                        </div>

                    </form>

                </div>
            </div>
        </div>
    </div>

</body>
</html>
