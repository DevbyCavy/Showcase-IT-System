<?php
require_once 'db_connection.php';

// Current timestamp
$now = date("Y-m-d H:i:s");


// 1️⃣ NEW → ASSIGNED 
// If users assigned to the order AND it is still 'New'
$conn->query("
    UPDATE orders o
    SET o.status = 'Assigned'
    WHERE o.status = 'New'
      AND EXISTS (
        SELECT 1 FROM order_assignments oa 
        WHERE oa.order_id = o.order_id
      )
");


// 2️⃣ NEW or ASSIGNED → ON GOING when deadline hits zero
$conn->query("
    UPDATE orders
    SET status = 'On Going'
    WHERE (status = 'New' OR status = 'Assigned')
      AND deadline_datetime <= '$now'
");


// 3️⃣ ON GOING → COMPLETED automatically after 24 hours overdue
$conn->query("
    UPDATE orders
    SET status = 'Completed'
    WHERE status = 'On Going'
      AND deadline_datetime <= DATE_SUB('$now', INTERVAL 24 HOUR)
");


echo "Status Updated";
