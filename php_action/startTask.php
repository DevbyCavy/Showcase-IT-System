<?php
/*
 * php_action/startTask.php
 * AJAX endpoint — any logged-in user. Starts a new work task against today's shift.
 * POST: task_name (required), task_notes (optional)
 * Returns JSON.
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'error' => 'Not logged in.']);
    exit;
}

require_once 'db_connection.php';

$userId    = intval($_SESSION['user_id']);
$taskName  = trim($_POST['task_name']  ?? '');
$taskNotes = trim($_POST['task_notes'] ?? '');

if ($taskName === '') {
    echo json_encode(['success' => false, 'error' => 'Task name is required.']);
    exit;
}

// Same fixed schedule as includes/workLogSheet.php
$breaks = [
    ['start' => '08:30', 'end' => '09:00', 'label' => 'Tea Break'],
    ['start' => '13:00', 'end' => '13:40', 'label' => 'Lunch'],
];
$now = date('H:i');
foreach ($breaks as $b) {
    if ($now >= $b['start'] && $now < $b['end']) {
        echo json_encode(['success' => false, 'error' => "Cannot start a task during {$b['label']}."]);
        exit;
    }
}

$shiftStmt = $conn->prepare("SELECT shift_id FROM work_shifts WHERE user_id = ? AND shift_date = CURDATE()");
$shiftStmt->bind_param("i", $userId);
$shiftStmt->execute();
$shift = $shiftStmt->get_result()->fetch_assoc();
$shiftStmt->close();

if (!$shift) {
    echo json_encode(['success' => false, 'error' => 'Log in first.']);
    exit;
}
$shiftId = (int)$shift['shift_id'];

$runningStmt = $conn->prepare("SELECT task_id FROM work_tasks WHERE user_id = ? AND status = 'Running'");
$runningStmt->bind_param("i", $userId);
$runningStmt->execute();
if ($runningStmt->get_result()->num_rows > 0) {
    $runningStmt->close();
    echo json_encode(['success' => false, 'error' => 'Finish your current task first.']);
    exit;
}
$runningStmt->close();

$stmt = $conn->prepare("
    INSERT INTO work_tasks (shift_id, user_id, task_name, task_notes, start_time, status)
    VALUES (?, ?, ?, ?, NOW(), 'Running')
");
$stmt->bind_param("iiss", $shiftId, $userId, $taskName, $taskNotes);

if ($stmt->execute()) {
    $taskId = $conn->insert_id;
    $stmt->close();

    $startTimeStmt = $conn->prepare("SELECT start_time FROM work_tasks WHERE task_id = ?");
    $startTimeStmt->bind_param("i", $taskId);
    $startTimeStmt->execute();
    $startTime = $startTimeStmt->get_result()->fetch_assoc()['start_time'];
    $startTimeStmt->close();

    echo json_encode(['success' => true, 'task_id' => $taskId, 'start_time' => $startTime, 'task_name' => $taskName]);
} else {
    $stmt->close();
    echo json_encode(['success' => false, 'error' => 'Failed to start task.']);
}
