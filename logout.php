<?php

    require_once 'php_action/core.php';

    // Work Log Sheet: logging out also closes today's shift — stop any
    // running task so it doesn't stay stuck "Running" and record when they left.
    if (isset($_SESSION['user_id'])) {
        $wlsUserId = intval($_SESSION['user_id']);

        $wlsShiftStmt = $conn->prepare("SELECT shift_id FROM work_shifts WHERE user_id = ? AND shift_date = CURDATE()");
        $wlsShiftStmt->bind_param("i", $wlsUserId);
        $wlsShiftStmt->execute();
        $wlsShift = $wlsShiftStmt->get_result()->fetch_assoc();
        $wlsShiftStmt->close();

        if ($wlsShift) {
            $wlsStopStmt = $conn->prepare("UPDATE work_tasks SET end_time = NOW(), status = 'Completed' WHERE shift_id = ? AND status = 'Running'");
            $wlsStopStmt->bind_param("i", $wlsShift['shift_id']);
            $wlsStopStmt->execute();
            $wlsStopStmt->close();

            $wlsCloseStmt = $conn->prepare("UPDATE work_shifts SET logout_time = NOW() WHERE shift_id = ?");
            $wlsCloseStmt->bind_param("i", $wlsShift['shift_id']);
            $wlsCloseStmt->execute();
            $wlsCloseStmt->close();
        }
    }

    session_unset();

    session_destroy();

    header('location:index.php');


?>