<?php
/*
 * includes/workLogSheet.php — self-contained Work Log Sheet widget.
 * Include below the Orders section on any dashboard. Any logged-in role.
 * Do NOT call header.php or footer.php here — same convention as orders.php.
 */

if (!isset($conn)) {
    require_once __DIR__ . '/../php_action/db_connection.php';
}

$wlsUserId = $_SESSION['user_id'] ?? 0;

// Fixed shift schedule — mirrored in php_action/startTask.php's break check.
$wlsShiftStart = '08:30';
$wlsShiftEnd   = '16:30';
$wlsBreaks = [
    ['start' => '08:30', 'end' => '09:00', 'label' => 'Tea Break'],
    ['start' => '13:00', 'end' => '13:40', 'label' => 'Lunch'],
];

$wlsShift = null;
$wlsTasks = [];

$wlsShiftStmt = $conn->prepare("SELECT shift_id, login_time, evening_shift FROM work_shifts WHERE user_id = ? AND shift_date = CURDATE()");
$wlsShiftStmt->bind_param("i", $wlsUserId);
$wlsShiftStmt->execute();
$wlsShift = $wlsShiftStmt->get_result()->fetch_assoc();
$wlsShiftStmt->close();

if ($wlsShift) {
    $wlsTasksStmt = $conn->prepare("SELECT task_id, task_name, task_notes, start_time, end_time, status FROM work_tasks WHERE shift_id = ? ORDER BY start_time ASC");
    $wlsTasksStmt->bind_param("i", $wlsShift['shift_id']);
    $wlsTasksStmt->execute();
    $wlsTasksResult = $wlsTasksStmt->get_result();
    while ($row = $wlsTasksResult->fetch_assoc()) $wlsTasks[] = $row;
    $wlsTasksStmt->close();
}
?>
<style>
.wls-card { background:#fff; border-radius:16px; padding:22px 24px; margin-bottom:24px; box-shadow:0 2px 10px rgba(0,0,0,.06); }
.wls-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:10px; }
.wls-head h5 { margin:0; font-weight:700; }
.wls-adherence { font-weight:700; color:var(--brand-orange,#F15A2C); font-size:1.1rem; }
.wls-loginbox { text-align:center; padding:28px 0; color:#666; }
.wls-loginbox .btn { padding:10px 32px; font-weight:600; }
.wls-ruler { position:relative; height:22px; margin-bottom:2px; border-bottom:1px solid #e5e5e5; }
.wls-tick { position:absolute; transform:translateX(-50%); white-space:nowrap; font-size:.72rem; color:#888; }
.wls-row { position:relative; height:58px; background:#f7f7f9; border-radius:8px; overflow:hidden; margin:10px 0 16px; }
.wls-break { position:absolute; top:0; bottom:0; background:repeating-linear-gradient(45deg,#ececec,#ececec 6px,#e0e0e0 6px,#e0e0e0 12px); display:flex; align-items:center; justify-content:center; font-size:.68rem; color:#888; font-weight:600; text-align:center; padding:0 2px; }
.wls-bar { position:absolute; top:7px; bottom:7px; border-radius:6px; background:linear-gradient(135deg,#7d8a99,#5f6b78); color:#fff; font-size:.72rem; font-weight:600; display:flex; align-items:center; padding:0 8px; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; min-width:6px; }
.wls-bar.wls-running { background:linear-gradient(135deg,#2ecc71,#27ae60); transition:width .8s linear; }
.wls-controls { display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
.wls-break-msg { color:#c0392b; font-size:.8rem; font-weight:600; }
.wls-hint { color:#888; font-size:.8rem; }
.wls-evening-badge { background:#2c3e50; color:#fff; font-weight:600; }
.wls-daywrap { display:flex; gap:12px; align-items:stretch; }
.wls-daylabel { flex:0 0 92px; display:flex; flex-direction:column; justify-content:center; font-size:.8rem; font-weight:700; color:#444; line-height:1.3; }
.wls-daylabel small { font-weight:500; color:#888; }
.wls-daylabel .badge { font-size:.62rem; margin-left:4px; }
.wls-timeline { flex:1 1 auto; min-width:0; }
.wls-noshift { height:58px; display:flex; align-items:center; justify-content:center; background:#f7f7f9; border-radius:8px; color:#aaa; font-size:.8rem; margin:10px 0 16px; }
.wls-week-ruler { margin-bottom:10px; }
</style>

<div class="wls-card" id="wlsCard">
    <div class="wls-head">
        <h5><i class="fas fa-business-time me-2"></i>Work Log Sheet</h5>
        <div class="d-flex align-items-center gap-3">
            <?php if ($wlsShift): ?>
                <div class="wls-adherence">Adherence: <span id="wlsAdherenceValue">--</span>%</div>
            <?php endif; ?>
            <button type="button" class="btn btn-sm btn-outline-secondary" data-bs-toggle="modal" data-bs-target="#wlsWeekModal">
                <i class="fas fa-calendar-week me-1"></i>View Week
            </button>
        </div>
    </div>

    <?php if (!$wlsShift): ?>
        <div class="wls-loginbox">
            <p class="mb-3">You haven't logged in for today's shift (<?= htmlspecialchars($wlsShiftStart) ?>&ndash;<?= htmlspecialchars($wlsShiftEnd) ?>).</p>
            <button type="button" class="btn text-white" id="wlsLoginBtn" style="background:var(--brand-orange,#F15A2C);">
                <i class="fas fa-right-to-bracket me-2"></i>Log In
            </button>
        </div>
    <?php else: ?>
        <div class="wls-daywrap">
            <div class="wls-daylabel">
                <?= htmlspecialchars(date('D')) ?> <span class="badge bg-warning text-dark">Today</span>
                <br><small><?= htmlspecialchars(date('d M')) ?></small>
            </div>
            <div class="wls-timeline">
                <div class="wls-ruler" id="wlsRuler"></div>
                <div class="wls-row" id="wlsRow"></div>
            </div>
        </div>

        <div class="wls-controls">
            <button type="button" class="btn btn-sm text-white" id="wlsTaskBtn" data-bs-toggle="modal" data-bs-target="#wlsTaskModal" style="background:var(--brand-orange,#F15A2C);">
                <i class="fas fa-play me-1"></i>Task
            </button>
            <button type="button" class="btn btn-sm btn-outline-danger" id="wlsStopBtn" disabled>
                <i class="fas fa-stop me-1"></i>Stop / Complete
            </button>
            <button type="button" class="btn btn-sm btn-outline-dark<?= $wlsShift['evening_shift'] ? ' d-none' : '' ?>" id="wlsEveningBtn">
                <i class="fas fa-moon me-1"></i>Evening Shift
            </button>
            <span class="badge wls-evening-badge<?= $wlsShift['evening_shift'] ? '' : ' d-none' ?>" id="wlsEveningBadge">
                <i class="fas fa-moon me-1"></i>Evening Shift Active
            </span>
            <span class="wls-break-msg d-none" id="wlsBreakMsg"></span>
        </div>
        <p class="wls-hint mt-2 mb-0">Evening Shift extends the timeline past <?= htmlspecialchars($wlsShiftEnd) ?> for as long as you keep working.</p>
    <?php endif; ?>
</div>

<!-- Task Modal -->
<div class="modal fade" id="wlsTaskModal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow">
            <div class="modal-header text-white" style="background:linear-gradient(135deg, var(--brand-orange,#F15A2C), var(--brand-orange-dark,#D94E22));">
                <h5 class="modal-title" style="color:#fff;"><i class="fas fa-play me-2"></i>Start a Task</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body py-4">
                <div class="mb-2">
                    <label class="form-label fw-semibold">What will you be working on? <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" id="wlsTaskNameInput" placeholder="e.g. Design review for JOB-004">
                </div>
                <a href="#" class="small" id="wlsViewAllToggle">View all fields</a>
                <div class="mt-2 d-none" id="wlsExtraFields">
                    <label class="form-label fw-semibold">Notes</label>
                    <textarea class="form-control" id="wlsTaskNotesInput" rows="3" placeholder="Optional detail"></textarea>
                </div>
                <div class="text-danger small mt-2 d-none" id="wlsTaskError"></div>
            </div>
            <div class="modal-footer justify-content-center">
                <button type="button" class="btn btn-secondary px-4" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn text-white px-4" id="wlsStartTaskBtn" style="background:var(--brand-orange,#F15A2C);">
                    <i class="fas fa-play me-1"></i> Start
                </button>
            </div>
        </div>
    </div>
</div>

<!-- View Week Modal -->
<div class="modal fade" id="wlsWeekModal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered modal-xl">
        <div class="modal-content border-0 shadow">
            <div class="modal-header text-white" style="background:linear-gradient(135deg, var(--brand-orange,#F15A2C), var(--brand-orange-dark,#D94E22));">
                <h5 class="modal-title" style="color:#fff;"><i class="fas fa-calendar-week me-2"></i>This Week's Work Log</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body py-4" id="wlsWeekBody">
                <div class="text-center text-muted py-4"><i class="fas fa-spinner fa-spin fa-2x"></i></div>
            </div>
        </div>
    </div>
</div>

<script>
document.getElementById('wlsWeekModal').addEventListener('show.bs.modal', function () {
    const body = document.getElementById('wlsWeekBody');
    body.innerHTML = '<div class="text-center text-muted py-4"><i class="fas fa-spinner fa-spin fa-2x"></i></div>';
    fetch('php_action/getWeekLog.php')
        .then(r => r.json())
        .then(data => {
            body.innerHTML = data.success
                ? data.html
                : '<div class="text-danger text-center py-4">' + (data.error || 'Could not load week log.') + '</div>';
        })
        .catch(function (err) {
            console.error(err);
            body.innerHTML = '<div class="text-danger text-center py-4">Failed to load.</div>';
        });
});
</script>

<?php if ($wlsShift): ?>
<script>
(function () {
    const shiftStart  = <?= json_encode($wlsShiftStart) ?>;
    const shiftEnd     = <?= json_encode($wlsShiftEnd) ?>;
    const breaks       = <?= json_encode($wlsBreaks) ?>;
    let eveningShift    = <?= $wlsShift['evening_shift'] ? 'true' : 'false' ?>;
    let tasks           = <?= json_encode(array_map(function ($t) {
        return [
            'task_id'    => (int)$t['task_id'],
            'task_name'  => $t['task_name'],
            'start_time' => str_replace(' ', 'T', $t['start_time']),
            'end_time'   => $t['end_time'] ? str_replace(' ', 'T', $t['end_time']) : null,
            'status'     => $t['status'],
        ];
    }, $wlsTasks)) ?>;

    function todayAt(hhmm) {
        const [h, m] = hhmm.split(':').map(Number);
        const d = new Date();
        d.setHours(h, m, 0, 0);
        return d;
    }

    const shiftStartDate = todayAt(shiftStart);
    const shiftEndDate   = todayAt(shiftEnd);

    // While an evening shift is active and "now" has pushed past the normal
    // shift end, the display window keeps stretching to cover it (open-ended).
    function computeDisplayEnd() {
        const now = new Date();
        if (eveningShift && now > shiftEndDate) {
            const d = new Date(now);
            d.setMinutes(0, 0, 0);
            d.setHours(d.getHours() + 1);
            return d;
        }
        return shiftEndDate;
    }

    function pctFor(d, displayEnd) {
        const span = displayEnd - shiftStartDate;
        const pct = ((d - shiftStartDate) / span) * 100;
        return Math.max(0, Math.min(100, pct));
    }

    function findRunningTask() {
        return tasks.find(t => t.status === 'Running') || null;
    }

    function renderRuler(displayEnd) {
        const ruler = document.getElementById('wlsRuler');
        ruler.innerHTML = '';

        const ticks = [new Date(shiftStartDate)];
        const t = new Date(shiftStartDate);
        t.setMinutes(0, 0, 0);
        t.setHours(t.getHours() + 1);
        while (t < displayEnd) {
            ticks.push(new Date(t));
            t.setHours(t.getHours() + 1);
        }
        ticks.push(new Date(displayEnd));

        ticks.forEach(function (d) {
            const span = document.createElement('span');
            span.className = 'wls-tick';
            span.style.left = pctFor(d, displayEnd) + '%';
            span.textContent = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
            ruler.appendChild(span);
        });
    }

    function renderRow(displayEnd) {
        const row = document.getElementById('wlsRow');
        row.innerHTML = '';

        breaks.forEach(function (b) {
            const left  = pctFor(todayAt(b.start), displayEnd);
            const width = Math.max(0, pctFor(todayAt(b.end), displayEnd) - left);
            const el = document.createElement('div');
            el.className = 'wls-break';
            el.style.left  = left + '%';
            el.style.width = width + '%';
            el.textContent = b.label;
            row.appendChild(el);
        });

        tasks.forEach(function (t) {
            const s = new Date(t.start_time);
            const e = t.end_time ? new Date(t.end_time) : new Date();
            const left  = pctFor(s, displayEnd);
            const width = Math.max(0.6, pctFor(e, displayEnd) - left);
            const el = document.createElement('div');
            el.className = 'wls-bar' + (t.status === 'Running' ? ' wls-running' : '');
            el.dataset.taskId = t.task_id;
            el.style.left  = left + '%';
            el.style.width = width + '%';
            el.title = t.task_name;
            el.textContent = t.task_name;
            row.appendChild(el);
        });
    }

    function isOnBreak() {
        const now = new Date();
        const hhmm = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
        return breaks.find(b => hhmm >= b.start && hhmm < b.end) || null;
    }

    function updateBreakState() {
        const onBreak  = isOnBreak();
        const taskBtn  = document.getElementById('wlsTaskBtn');
        const msg      = document.getElementById('wlsBreakMsg');
        const running  = findRunningTask();

        if (onBreak && !running) {
            taskBtn.setAttribute('disabled', 'disabled');
            msg.textContent = 'On ' + onBreak.label + ' until ' + onBreak.end + ' — task starting is paused.';
            msg.classList.remove('d-none');
        } else if (!running) {
            taskBtn.removeAttribute('disabled');
            msg.classList.add('d-none');
        }
    }

    function updateAdherence(displayEnd) {
        const now = new Date();
        const clampedNow = now < shiftStartDate ? shiftStartDate : (now > displayEnd ? displayEnd : now);

        let scheduledMs = clampedNow - shiftStartDate;
        breaks.forEach(function (b) {
            const bs = todayAt(b.start), be = todayAt(b.end);
            const overlapStart = new Date(Math.max(shiftStartDate, bs));
            const overlapEnd   = new Date(Math.min(clampedNow, be));
            if (overlapEnd > overlapStart) scheduledMs -= (overlapEnd - overlapStart);
        });

        let workedMs = 0;
        tasks.forEach(function (t) {
            const s = new Date(t.start_time);
            const e = t.end_time ? new Date(t.end_time) : now;
            workedMs += Math.max(0, e - s);
        });

        const pct = scheduledMs > 0 ? Math.min(100, Math.round((workedMs / scheduledMs) * 100)) : 0;
        const elVal = document.getElementById('wlsAdherenceValue');
        if (elVal) elVal.textContent = pct;
    }

    function tick() {
        const displayEnd = computeDisplayEnd();
        renderRuler(displayEnd);
        renderRow(displayEnd);
        updateAdherence(displayEnd);
        updateBreakState();
    }

    function setButtonsForRunning(running) {
        document.getElementById('wlsStopBtn').disabled = !running;
        const taskBtn = document.getElementById('wlsTaskBtn');
        if (running) {
            taskBtn.setAttribute('disabled', 'disabled');
        } else if (!isOnBreak()) {
            taskBtn.removeAttribute('disabled');
        }
    }

    document.getElementById('wlsStopBtn').addEventListener('click', function () {
        const running = findRunningTask();
        if (!running) return;
        const btn = this;
        btn.disabled = true;
        fetch('php_action/stopTask.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'task_id=' + encodeURIComponent(running.task_id)
        })
        .then(r => r.json())
        .then(data => {
            if (!data.success) {
                alert('Error: ' + (data.error || 'Something went wrong.'));
                btn.disabled = false;
                return;
            }
            running.status   = 'Completed';
            running.end_time = data.end_time.replace(' ', 'T');
            setButtonsForRunning(false);
            tick();
        })
        .catch(err => { console.error(err); btn.disabled = false; });
    });

    document.getElementById('wlsEveningBtn').addEventListener('click', function () {
        const btn = this;
        btn.disabled = true;
        fetch('php_action/toggleEveningShift.php', { method: 'POST' })
        .then(r => r.json())
        .then(data => {
            if (!data.success) {
                alert('Error: ' + (data.error || 'Could not enable evening shift.'));
                btn.disabled = false;
                return;
            }
            eveningShift = true;
            btn.classList.add('d-none');
            document.getElementById('wlsEveningBadge').classList.remove('d-none');
            tick();
        })
        .catch(err => { console.error(err); btn.disabled = false; });
    });

    document.getElementById('wlsViewAllToggle').addEventListener('click', function (e) {
        e.preventDefault();
        const extra = document.getElementById('wlsExtraFields');
        extra.classList.toggle('d-none');
        this.textContent = extra.classList.contains('d-none') ? 'View all fields' : 'Hide extra fields';
    });

    document.getElementById('wlsStartTaskBtn').addEventListener('click', function () {
        const nameInput  = document.getElementById('wlsTaskNameInput');
        const notesInput = document.getElementById('wlsTaskNotesInput');
        const errorBox   = document.getElementById('wlsTaskError');
        const name = nameInput.value.trim();

        if (name === '') {
            errorBox.textContent = 'Task name is required.';
            errorBox.classList.remove('d-none');
            return;
        }

        const btn = this;
        btn.disabled = true;

        fetch('php_action/startTask.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'task_name=' + encodeURIComponent(name) + '&task_notes=' + encodeURIComponent(notesInput.value.trim())
        })
        .then(r => r.json())
        .then(data => {
            btn.disabled = false;
            if (!data.success) {
                errorBox.textContent = data.error || 'Something went wrong.';
                errorBox.classList.remove('d-none');
                return;
            }

            errorBox.classList.add('d-none');
            nameInput.value = '';
            notesInput.value = '';

            tasks.push({
                task_id: data.task_id,
                task_name: data.task_name,
                start_time: data.start_time.replace(' ', 'T'),
                end_time: null,
                status: 'Running'
            });

            setButtonsForRunning(true);
            tick();

            const modalEl = document.getElementById('wlsTaskModal');
            bootstrap.Modal.getOrCreateInstance(modalEl).hide();
        })
        .catch(err => { console.error(err); btn.disabled = false; });
    });

    setButtonsForRunning(!!findRunningTask());
    tick();
    setInterval(tick, 15000);
})();
</script>
<?php endif; ?>

<?php if (!$wlsShift): ?>
<script>
document.getElementById('wlsLoginBtn').addEventListener('click', function () {
    const btn = this;
    btn.disabled = true;
    fetch('php_action/startShift.php', { method: 'POST' })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                location.reload();
            } else {
                alert('Error: ' + (data.error || 'Could not log in.'));
                btn.disabled = false;
            }
        })
        .catch(err => { console.error(err); btn.disabled = false; });
});
</script>
<?php endif; ?>
