<?php
/*
 * php_action/getTaskCalendar.php
 * AJAX endpoint — any logged-in user. Returns memos + office tasks (assigned to
 * or by the user) for a given month, for the Office Task Calendar widget.
 * GET: year, month (default: current)
 * Returns JSON {success, byDate, upcoming}.
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

$userId = intval($_SESSION['user_id']);
$year   = intval($_GET['year']  ?? date('Y'));
$month  = intval($_GET['month'] ?? date('n'));
if ($month < 1 || $month > 12) $month = (int) date('n');

$monthStart = sprintf('%04d-%02d-01', $year, $month);
$monthEnd   = date('Y-m-t', strtotime($monthStart));

$items = [];

$memoStmt = $conn->prepare("
    SELECT memo_id AS id, title, DATE(due_date) AS due_date
    FROM memos
    WHERE created_by = ? AND DATE(due_date) BETWEEN ? AND ?
");
$memoStmt->bind_param("iss", $userId, $monthStart, $monthEnd);
$memoStmt->execute();
$res = $memoStmt->get_result();
while ($row = $res->fetch_assoc()) {
    $items[] = ['id' => (int)$row['id'], 'type' => 'memo', 'title' => $row['title'], 'due_date' => $row['due_date'], 'other' => null];
}
$memoStmt->close();

$toMeStmt = $conn->prepare("
    SELECT ot.task_id AS id, ot.title, ot.due_date, u.name, u.surname
    FROM office_tasks ot
    LEFT JOIN users u ON ot.assigned_by = u.user_id
    WHERE ot.assigned_to = ? AND ot.due_date BETWEEN ? AND ?
");
$toMeStmt->bind_param("iss", $userId, $monthStart, $monthEnd);
$toMeStmt->execute();
$res = $toMeStmt->get_result();
while ($row = $res->fetch_assoc()) {
    $items[] = ['id' => (int)$row['id'], 'type' => 'job_to_me', 'title' => $row['title'], 'due_date' => $row['due_date'], 'other' => trim($row['name'] . ' ' . $row['surname'])];
}
$toMeStmt->close();

$byMeStmt = $conn->prepare("
    SELECT ot.task_id AS id, ot.title, ot.due_date, u.name, u.surname
    FROM office_tasks ot
    LEFT JOIN users u ON ot.assigned_to = u.user_id
    WHERE ot.assigned_by = ? AND ot.due_date BETWEEN ? AND ?
");
$byMeStmt->bind_param("iss", $userId, $monthStart, $monthEnd);
$byMeStmt->execute();
$res = $byMeStmt->get_result();
while ($row = $res->fetch_assoc()) {
    $items[] = ['id' => (int)$row['id'], 'type' => 'job_by_me', 'title' => $row['title'], 'due_date' => $row['due_date'], 'other' => trim($row['name'] . ' ' . $row['surname'])];
}
$byMeStmt->close();

$byDate = [];
foreach ($items as $item) {
    $byDate[$item['due_date']][] = $item;
}

$today = date('Y-m-d');
$upcoming = array_values(array_filter($items, function ($i) use ($today) {
    return $i['due_date'] >= $today;
}));
usort($upcoming, function ($a, $b) { return strcmp($a['due_date'], $b['due_date']); });
$upcoming = array_slice($upcoming, 0, 8);

echo json_encode(['success' => true, 'byDate' => $byDate, 'upcoming' => $upcoming]);
