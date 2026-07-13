<?php
/*
 * php_action/createDesignJob.php
 * Handles design job form submission.
 * Include this file inside assignDesignJob.php — do not call directly.
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once 'db_connection.php';
require_once 'notify.php';

$errors  = [];
$success = '';

// Auto-generate job number e.g. JOB-001
$q   = $conn->query("SELECT MAX(CAST(SUBSTRING(job_number, 5) AS UNSIGNED)) AS max_no FROM design_jobs");
$row = $q->fetch_assoc();
$nextJobNo = 'JOB-' . str_pad(($row['max_no'] ?? 0) + 1, 3, '0', STR_PAD_LEFT);

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['design_job_submit'])) {

    $title        = trim($_POST['title']        ?? '');
    $description  = trim($_POST['description']  ?? '');
    $design_type  = trim($_POST['design_type']  ?? '');
    $designer_id  = intval($_POST['designer_id'] ?? 0);
    $deadline     = str_replace('T', ' ', trim($_POST['deadline'] ?? ''));
    $marketer_id  = intval($_SESSION['user_id']  ?? 0);

    // Validation
    if ($title === '') $errors[] = 'Job title is required.';
    if (!in_array($design_type, ['3D', 'Artwork'], true)) $errors[] = 'Please select a design type.';
    if ($designer_id <= 0) $errors[] = 'Please select a designer.';
    if ($deadline === '') $errors[] = 'Deadline is required.';

    if ($designer_id > 0) {
        $checkDesigner = $conn->prepare("SELECT user_id FROM users WHERE user_id = ? AND user_type = 'Graphic Designer'");
        $checkDesigner->bind_param("i", $designer_id);
        $checkDesigner->execute();
        if ($checkDesigner->get_result()->num_rows === 0) {
            $errors[] = 'Selected designer is invalid.';
        }
        $checkDesigner->close();
    }

    if (empty($_FILES['brief_file']['name'])) {
        $errors[] = 'Please attach a brief/tender document for this job.';
    }

    $brief_file = '';
    if (empty($errors)) {
        if (!is_dir('uploads')) {
            mkdir('uploads', 0755, true);
        }
        $brief_file = 'uploads/job_brief_' . time() . '_' . basename($_FILES['brief_file']['name']);
        move_uploaded_file($_FILES['brief_file']['tmp_name'], $brief_file);
    }

    if (empty($errors)) {
        $stmt = $conn->prepare("
            INSERT INTO design_jobs
                (job_number, title, description, design_type, deadline, brief_file, status, marketer_id, designer_id)
            VALUES (?, ?, ?, ?, ?, ?, 'Assigned', ?, ?)
        ");
        $stmt->bind_param(
            "ssssssii",
            $nextJobNo, $title, $description, $design_type, $deadline, $brief_file,
            $marketer_id, $designer_id
        );

        if ($stmt->execute()) {
            notifyUser(
                $conn, $designer_id, $marketer_id, 'design_job_assigned',
                "assigned you a new design job {$nextJobNo}",
                'myDesignJobs.php'
            );
            $success   = "Design job $nextJobNo assigned successfully!";
            $nextJobNo = 'JOB-' . str_pad(($row['max_no'] ?? 0) + 2, 3, '0', STR_PAD_LEFT);
        } else {
            $errors[] = 'Failed to create design job.';
        }
        $stmt->close();
    }
}
