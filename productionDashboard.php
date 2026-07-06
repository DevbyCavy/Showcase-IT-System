<?php
require_once 'php_action/auth_guard.php';
requireRole("Production");

?>

<?php

    require_once 'includes/headerProduction.php';
?>

<!-- Custom CSS -->
<link rel="stylesheet" href="custom/css/custom.css">

<?php

    require_once 'orders.php';
?>

<?php

    require_once 'includes/footer.php';

?>