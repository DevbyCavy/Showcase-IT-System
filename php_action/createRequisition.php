<?php
/*
 * php_action/createRequisition.php
 * Handles requisition form submission.
 * Include this file inside requisitions.php — do not call directly.
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once 'db_connection.php';

$errors  = [];
$success = '';

// Auto-generate requisition number e.g. REQ-001
$q    = $conn->query("SELECT MAX(CAST(SUBSTRING(req_number, 5) AS UNSIGNED)) AS max_no FROM requisitions");
$row  = $q->fetch_assoc();
$nextReqNo = 'REQ-' . str_pad(($row['max_no'] ?? 0) + 1, 3, '0', STR_PAD_LEFT);

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['submit_requisition'])) {

    $project_manager = trim($_POST['project_manager'] ?? '');
    $event_name      = trim($_POST['event_name']      ?? '');
    $location        = trim($_POST['location']        ?? '');
    $event_date      = trim($_POST['event_date']      ?? '');
    $team_members    = trim($_POST['team_members']    ?? '');
    $req_type        = trim($_POST['req_type']        ?? '');
    $req_type_other  = trim($_POST['req_type_other']  ?? '');
    $submitted_by    = intval($_SESSION['user_id']    ?? 0);

    // Validation
    if ($project_manager === '') $errors[] = 'Project Manager name is required.';
    if ($event_name      === '') $errors[] = 'Event name is required.';
    if ($location        === '') $errors[] = 'Location is required.';
    if ($event_date      === '') $errors[] = 'Event date is required.';
    if ($req_type        === '') $errors[] = 'Please select a type of requisition.';
    if ($req_type === 'Other' && $req_type_other === '') {
        $errors[] = 'Please specify the type of requisition.';
    }

    // If Other, store the custom value as the type
    $finalType = ($req_type === 'Other') ? $req_type_other : $req_type;

    if (empty($errors)) {
        $stmt = $conn->prepare("
            INSERT INTO requisitions
                (req_number, project_manager, event_name, location, event_date,
                 team_members, req_type, req_type_other, submitted_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->bind_param(
            "ssssssssi",
            $nextReqNo, $project_manager, $event_name, $location, $event_date,
            $team_members, $finalType, $req_type_other, $submitted_by
        );

        if ($stmt->execute()) {
            $success   = "Requisition $nextReqNo submitted successfully!";
            $nextReqNo = 'REQ-' . str_pad(($row['max_no'] ?? 0) + 2, 3, '0', STR_PAD_LEFT);
        } else {
            $errors[] = 'Failed to submit requisition: ' . $stmt->error;
        }
        $stmt->close();
    }
}
