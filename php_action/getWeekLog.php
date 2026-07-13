<?php
/*
 * php_action/getWeekLog.php
 * AJAX endpoint — any logged-in user. Returns a pre-rendered HTML fragment
 * showing Monday-Saturday of the current week for the Work Log Sheet's
 * "View Week" modal.
 * Returns JSON {success, html} or {success:false, error}.
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

$shiftStart = '08:30';
$breaks = [
    ['start' => '08:30', 'end' => '09:00', 'label' => 'Tea Break'],
    ['start' => '13:00', 'end' => '13:40', 'label' => 'Lunch'],
];

function wlsHHMMToMin($hhmm) {
    [$h, $m] = explode(':', $hhmm);
    return ((int)$h) * 60 + (int)$m;
}
function wlsMinToHHMM($min) {
    $min = max(0, (int)$min);
    return sprintf('%02d:%02d', intdiv($min, 60), $min % 60);
}
function wlsPctMin($min, $startMin, $endMin) {
    $span = max(1, $endMin - $startMin);
    return max(0, min(100, (($min - $startMin) / $span) * 100));
}

// Monday..Saturday of the current week
$todayDow = (int) date('N'); // 1=Mon .. 7=Sun
$monday = date('Y-m-d', strtotime('-' . ($todayDow - 1) . ' days'));
$weekDates = [];
for ($i = 0; $i < 6; $i++) $weekDates[] = date('Y-m-d', strtotime("$monday +$i day"));
$today = date('Y-m-d');

$stmt = $conn->prepare("SELECT shift_id, shift_date, login_time, evening_shift, logout_time FROM work_shifts WHERE user_id = ? AND shift_date BETWEEN ? AND ?");
$stmt->bind_param("iss", $userId, $weekDates[0], $weekDates[5]);
$stmt->execute();
$res = $stmt->get_result();
$shiftsByDate = [];
while ($row = $res->fetch_assoc()) $shiftsByDate[$row['shift_date']] = $row;
$stmt->close();

$tasksByDate = [];
$axisEndMin  = wlsHHMMToMin('16:30');

foreach ($shiftsByDate as $date => $shift) {
    $tstmt = $conn->prepare("SELECT task_id, task_name, start_time, end_time, status FROM work_tasks WHERE shift_id = ? ORDER BY start_time ASC");
    $tstmt->bind_param("i", $shift['shift_id']);
    $tstmt->execute();
    $tres = $tstmt->get_result();
    $tasks = [];
    while ($t = $tres->fetch_assoc()) {
        $tasks[] = $t;
        $endRef = $t['end_time'] ?: ($date === $today ? date('Y-m-d H:i:s') : null);
        if ($endRef) {
            $endMin = wlsHHMMToMin(date('H:i', strtotime($endRef)));
            if ($endMin > $axisEndMin) $axisEndMin = $endMin;
        }
    }
    $tstmt->close();
    $tasksByDate[$date] = $tasks;

    if (!empty($shift['logout_time'])) {
        $endMin = wlsHHMMToMin(date('H:i', strtotime($shift['logout_time'])));
        if ($endMin > $axisEndMin) $axisEndMin = $endMin;
    }
}

// Round the shared axis end up to the next full hour so the ruler reads cleanly.
$axisEndMin = (int) (ceil($axisEndMin / 60) * 60);
$startMin   = wlsHHMMToMin($shiftStart);

ob_start();
?>
<div class="wls-daywrap">
    <div class="wls-daylabel"></div>
    <div class="wls-timeline">
        <div class="wls-ruler wls-week-ruler">
            <?php
            $ticks = [$startMin];
            $t = (intdiv($startMin, 60) + 1) * 60;
            while ($t < $axisEndMin) { $ticks[] = $t; $t += 60; }
            $ticks[] = $axisEndMin;
            foreach ($ticks as $tm):
                $pct = wlsPctMin($tm, $startMin, $axisEndMin);
            ?>
                <span class="wls-tick" style="left:<?= $pct ?>%;"><?= wlsMinToHHMM($tm) ?></span>
            <?php endforeach; ?>
        </div>
    </div>
</div>

<?php foreach ($weekDates as $date):
    $shift   = $shiftsByDate[$date] ?? null;
    $isToday = $date === $today;
?>
    <div class="wls-daywrap">
        <div class="wls-daylabel">
            <?= htmlspecialchars(date('D', strtotime($date))) ?>
            <?php if ($isToday): ?><span class="badge bg-warning text-dark">Today</span><?php endif; ?>
            <br><small><?= htmlspecialchars(date('d M', strtotime($date))) ?></small>
        </div>
        <div class="wls-timeline">
            <?php if (!$shift): ?>
                <div class="wls-noshift">No shift logged</div>
            <?php else: ?>
                <div class="wls-row">
                    <?php foreach ($breaks as $b):
                        $left  = wlsPctMin(wlsHHMMToMin($b['start']), $startMin, $axisEndMin);
                        $width = wlsPctMin(wlsHHMMToMin($b['end']), $startMin, $axisEndMin) - $left;
                    ?>
                        <div class="wls-break" style="left:<?= $left ?>%; width:<?= $width ?>%;"><?= htmlspecialchars($b['label']) ?></div>
                    <?php endforeach; ?>

                    <?php foreach ($tasksByDate[$date] as $t):
                        $startHHMM = date('H:i', strtotime($t['start_time']));
                        $left      = wlsPctMin(wlsHHMMToMin($startHHMM), $startMin, $axisEndMin);
                        $endRef    = $t['end_time'] ?: ($isToday ? date('Y-m-d H:i:s') : $t['start_time']);
                        $endHHMM   = date('H:i', strtotime($endRef));
                        $width     = max(0.6, wlsPctMin(wlsHHMMToMin($endHHMM), $startMin, $axisEndMin) - $left);
                        $isRunning = $t['status'] === 'Running';
                    ?>
                        <div class="wls-bar<?= $isRunning ? ' wls-running' : '' ?>" style="left:<?= $left ?>%; width:<?= $width ?>%;" title="<?= htmlspecialchars($t['task_name']) ?>">
                            <?= htmlspecialchars($t['task_name']) ?>
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
        </div>
    </div>
<?php endforeach; ?>
<?php
$html = ob_get_clean();

echo json_encode(['success' => true, 'html' => $html]);
