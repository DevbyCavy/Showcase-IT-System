<?php
/*
 * php_action/submitDesignWork.php
 * Handles a Designer submitting work back on an assigned design job.
 * Include this file inside myDesignJobs.php — do not call directly.
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once 'db_connection.php';
require_once 'notify.php';

$errors  = [];
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['submit_work'])) {

    $jobId            = intval($_POST['design_job_id']    ?? 0);
    $submission_notes = trim($_POST['submission_notes']   ?? '');
    $designerId       = intval($_SESSION['user_id']       ?? 0);

    if ($jobId <= 0) $errors[] = 'Invalid design job.';

    if (empty($_FILES['submission_file']['name'])) {
        $errors[] = 'Please attach your design file.';
    }

    // Confirm this job belongs to the logged-in designer and is awaiting work
    if (empty($errors)) {
        $check = $conn->prepare("
            SELECT design_job_id FROM design_jobs
            WHERE design_job_id = ? AND designer_id = ? AND status IN ('Assigned', 'Revision Requested')
        ");
        $check->bind_param("ii", $jobId, $designerId);
        $check->execute();
        if ($check->get_result()->num_rows === 0) {
            $errors[] = 'This job is not awaiting your submission.';
        }
        $check->close();
    }

    $submission_file = '';
    if (empty($errors)) {
        if (!is_dir('uploads')) {
            mkdir('uploads', 0755, true);
        }
        $submission_file = 'uploads/job_submission_' . time() . '_' . basename($_FILES['submission_file']['name']);
        move_uploaded_file($_FILES['submission_file']['tmp_name'], $submission_file);
    }

    if (empty($errors)) {
        $jobLookupStmt = $conn->prepare("SELECT marketer_id, job_number FROM design_jobs WHERE design_job_id = ?");
        $jobLookupStmt->bind_param("i", $jobId);
        $jobLookupStmt->execute();
        $jobRow = $jobLookupStmt->get_result()->fetch_assoc();
        $jobLookupStmt->close();

        $stmt = $conn->prepare("
            UPDATE design_jobs
            SET submission_file = ?,
                submission_notes = ?,
                status = 'Submitted',
                submitted_at = NOW()
            WHERE design_job_id = ? AND designer_id = ?
        ");
        $stmt->bind_param("ssii", $submission_file, $submission_notes, $jobId, $designerId);

        if ($stmt->execute()) {
            if ($jobRow) {
                notifyUser(
                    $conn, $jobRow['marketer_id'], $designerId, 'design_job_submitted',
                    "submitted work for {$jobRow['job_number']}",
                    'assignDesignJob.php'
                );
            }
            $success = 'Work submitted for approval!';
        } else {
            $errors[] = 'Failed to submit work.';
        }
        $stmt->close();
    }
}
