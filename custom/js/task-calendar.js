/* Office Task Calendar widget — replaces the old plain marked-date calendar.
 * Self-contained: no-ops on any page that doesn't have #dashCalendar.
 */
document.addEventListener('DOMContentLoaded', function () {
    var calRoot = document.getElementById('dashCalendar');
    if (!calRoot) return;

    var TYPE_LABELS = { memo: 'To-Do', job_to_me: 'Assigned to you', job_by_me: 'You assigned' };

    var users = [];
    try {
        users = JSON.parse(calRoot.dataset.users || '[]');
    } catch (e) { /* ignore malformed data */ }
    var readOnly = calRoot.dataset.readonly === 'true';
    var boxedStyle = calRoot.dataset.style === 'boxed';
    var openTaskModal; // assigned below only when the assign modal exists on this page

    var monthLabelEl   = document.getElementById('calMonthLabel');
    var gridEl          = document.getElementById('calGrid');
    var panelBodyEl        = document.getElementById('calDayPanelBody');
    var weekBtn              = document.getElementById('calWeekViewBtn');
    var monthBtn               = document.getElementById('calMonthViewBtn');

    var monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    var dow = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    function toKey(d) {
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }

    var today = new Date();
    var view = new Date();
    view.setDate(1); // first-of-month currently loaded/fetched
    var selectedDate = toKey(today);
    var viewMode = 'month'; // 'month' | 'week'

    var byDate = {};

    function mondayOf(d) {
        var offset = (d.getDay() + 6) % 7;
        var m = new Date(d);
        m.setDate(d.getDate() - offset);
        return m;
    }

    function renderGrid() {
        var cellDates = [];

        if (viewMode === 'month') {
            var year = view.getFullYear();
            var month = view.getMonth();
            monthLabelEl.textContent = monthNames[month] + ' ' + year;

            var firstDay = new Date(year, month, 1);
            var gridStart = mondayOf(firstDay);
            for (var i = 0; i < 42; i++) {
                var cd = new Date(gridStart);
                cd.setDate(gridStart.getDate() + i);
                cellDates.push(cd);
            }
            gridEl.classList.remove('week-view');
        } else {
            var selDate = new Date(selectedDate + 'T00:00:00');
            var weekStart = mondayOf(selDate);
            for (var j = 0; j < 7; j++) {
                var wd = new Date(weekStart);
                wd.setDate(weekStart.getDate() + j);
                cellDates.push(wd);
            }
            var weekEnd = cellDates[6];
            monthLabelEl.textContent = monthNames[weekStart.getMonth()].slice(0, 3) + ' ' + weekStart.getDate() +
                ' - ' + monthNames[weekEnd.getMonth()].slice(0, 3) + ' ' + weekEnd.getDate();
            gridEl.classList.add('week-view');
        }

        var todayKey = toKey(today);
        var html = dow.map(function (d) { return '<div class="cal-dow">' + d + '</div>'; }).join('');

        cellDates.forEach(function (cellDate) {
            var key = toKey(cellDate);
            var inMonth = viewMode === 'week' || cellDate.getMonth() === view.getMonth();
            var classes = 'cal-day' +
                (inMonth ? ' in-month' : '') +
                (key === todayKey ? ' today' : '') +
                (key === selectedDate ? ' selected' : '');
            var items = byDate[key] || [];

            var indicatorHtml = '';
            var titleAttr = '';
            if (items.length) {
                titleAttr = items.map(function (it) { return TYPE_LABELS[it.type] + ': ' + it.title; }).join('\n');

                if (boxedStyle) {
                    var maxChips = 3;
                    var shown = items.slice(0, maxChips);
                    var chips = shown.map(function (it) {
                        return '<span class="cal-day-chip chip-' + it.type + '">' + it.title.replace(/</g, '&lt;') + '</span>';
                    }).join('');
                    var extra = items.length - shown.length;
                    if (extra > 0) chips += '<span class="cal-day-chip-more">+' + extra + ' more</span>';
                    indicatorHtml = '<span class="cal-day-chips">' + chips + '</span>';
                } else {
                    var seenTypes = {};
                    items.forEach(function (it) { seenTypes[it.type] = true; });
                    indicatorHtml = '<span class="dots">' + Object.keys(seenTypes).map(function (t) {
                        return '<span class="dot dot-' + t + '"></span>';
                    }).join('') + '</span>';
                }
            }

            html += '<div class="' + classes + '" data-date="' + key + '"' +
                (titleAttr ? ' title="' + titleAttr.replace(/"/g, '&quot;') + '"' : '') + '>' +
                '<span class="day-num">' + cellDate.getDate() + '</span>' + indicatorHtml + '</div>';
        });

        gridEl.innerHTML = html;

        gridEl.querySelectorAll('.cal-day').forEach(function (cell) {
            cell.addEventListener('click', function () {
                selectDate(cell.dataset.date);
                if (!readOnly) openTaskModal(cell.dataset.date);
            });
        });
    }

    function renderDayPanel() {
        var dateLabelPanelEl = document.getElementById('calSelectedDateLabel');
        if (dateLabelPanelEl) {
            var selD = new Date(selectedDate + 'T00:00:00');
            dateLabelPanelEl.textContent = selD.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
        }

        var items = (byDate[selectedDate] || []).slice().sort(function (a, b) {
            return a.type.localeCompare(b.type);
        });

        if (!items.length) {
            panelBodyEl.innerHTML = '<div class="cal-day-empty">Nothing scheduled.</div>';
            return;
        }

        panelBodyEl.innerHTML = items.map(function (it) {
            var sub = TYPE_LABELS[it.type];
            if (it.type === 'job_to_me' && it.other) sub += ' — from ' + it.other;
            if (it.type === 'job_by_me' && it.other) sub += ' — to ' + it.other;
            return '<div class="cal-event-card type-' + it.type + '">' +
                '<div class="cal-event-body">' +
                '<div class="cal-event-title" title="' + it.title.replace(/"/g, '&quot;') + '">' + it.title + '</div>' +
                '<div class="cal-event-sub">' + sub + '</div>' +
                '</div>' +
                '</div>';
        }).join('');
    }

    function renderAll() {
        renderGrid();
        renderDayPanel();
    }

    function selectDate(dateKey) {
        var d = new Date(dateKey + 'T00:00:00');
        selectedDate = dateKey;

        var needsFetch = d.getFullYear() !== view.getFullYear() || d.getMonth() !== view.getMonth();
        if (needsFetch) {
            view = new Date(d.getFullYear(), d.getMonth(), 1);
            fetchAndRender();
        } else {
            renderAll();
        }
    }

    function fetchAndRender() {
        var year = view.getFullYear();
        var month = view.getMonth() + 1;
        fetch('php_action/getTaskCalendar.php?year=' + year + '&month=' + month)
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (!data.success) return;
                byDate = data.byDate || {};
                renderAll();
            })
            .catch(function (err) { console.error(err); });
    }

    document.getElementById('calPrevBtn').addEventListener('click', function () {
        if (viewMode === 'month') {
            view.setMonth(view.getMonth() - 1);
            fetchAndRender();
        } else {
            var d = new Date(selectedDate + 'T00:00:00');
            d.setDate(d.getDate() - 7);
            selectDate(toKey(d));
        }
    });
    document.getElementById('calNextBtn').addEventListener('click', function () {
        if (viewMode === 'month') {
            view.setMonth(view.getMonth() + 1);
            fetchAndRender();
        } else {
            var d = new Date(selectedDate + 'T00:00:00');
            d.setDate(d.getDate() + 7);
            selectDate(toKey(d));
        }
    });

    weekBtn.addEventListener('click', function () {
        viewMode = 'week';
        weekBtn.classList.add('active');
        monthBtn.classList.remove('active');
        renderAll();
    });
    monthBtn.addEventListener('click', function () {
        viewMode = 'month';
        monthBtn.classList.add('active');
        weekBtn.classList.remove('active');
        renderAll();
    });

    /* ---------- Assign modal (only present on pages that allow editing) ---------- */
    var modalEl = document.getElementById('taskCalModal');

    if (modalEl) {
        var dateLabelEl     = document.getElementById('taskCalDateLabel');
        var dateInput        = document.getElementById('taskCalDate');
        var typeTodoRadio    = document.getElementById('taskCalTypeTodo');
        var typeJobRadio     = document.getElementById('taskCalTypeJob');
        var todoFields        = document.getElementById('taskCalTodoFields');
        var jobFields         = document.getElementById('taskCalJobFields');
        var deptSelect         = document.getElementById('taskCalDept');
        var assigneeSelect     = document.getElementById('taskCalAssignee');
        var errorBox           = document.getElementById('taskCalError');
        var saveBtn             = document.getElementById('taskCalSaveBtn');

        var departments = [];
        users.forEach(function (u) {
            if (u.department && departments.indexOf(u.department) === -1) departments.push(u.department);
        });
        deptSelect.innerHTML = '<option value="">Select department...</option>' +
            departments.map(function (d) { return '<option value="' + d + '">' + d + '</option>'; }).join('');

        deptSelect.addEventListener('change', function () {
            var dept = this.value;
            var matches = users.filter(function (u) { return u.department === dept; });
            if (!dept) {
                assigneeSelect.innerHTML = '<option value="">Select department first...</option>';
                assigneeSelect.disabled = true;
                return;
            }
            assigneeSelect.innerHTML = '<option value="">Select person...</option>' +
                matches.map(function (u) { return '<option value="' + u.user_id + '">' + u.name + ' ' + u.surname + '</option>'; }).join('');
            assigneeSelect.disabled = false;
        });

        var toggleType = function () {
            var isJob = typeJobRadio.checked;
            todoFields.classList.toggle('d-none', isJob);
            jobFields.classList.toggle('d-none', !isJob);
        };
        typeTodoRadio.addEventListener('change', toggleType);
        typeJobRadio.addEventListener('change', toggleType);

        openTaskModal = function (dateKey) {
            dateInput.value = dateKey;
            var d = new Date(dateKey + 'T00:00:00');
            dateLabelEl.textContent = d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

            typeTodoRadio.checked = true;
            toggleType();

            document.getElementById('taskCalTodoTitle').value = '';
            document.getElementById('taskCalTodoTime').value  = '09:00';
            document.getElementById('taskCalTodoNotes').value = '';
            deptSelect.value = '';
            assigneeSelect.innerHTML = '<option value="">Select department first...</option>';
            assigneeSelect.disabled = true;
            document.getElementById('taskCalJobTitle').value = '';
            document.getElementById('taskCalJobNotes').value = '';
            errorBox.classList.add('d-none');

            bootstrap.Modal.getOrCreateInstance(modalEl).show();
        };

        var showError = function (msg) {
            errorBox.textContent = msg;
            errorBox.classList.remove('d-none');
        };

        saveBtn.addEventListener('click', function () {
            var date = dateInput.value;
            if (!date) return;

            saveBtn.disabled = true;

            if (typeTodoRadio.checked) {
                var title = document.getElementById('taskCalTodoTitle').value.trim();
                var time  = document.getElementById('taskCalTodoTime').value || '09:00';
                var notes = document.getElementById('taskCalTodoNotes').value.trim();

                if (title === '') {
                    showError('Title is required.');
                    saveBtn.disabled = false;
                    return;
                }

                fetch('php_action/quickAddMemo.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: 'title=' + encodeURIComponent(title) +
                          '&description=' + encodeURIComponent(notes) +
                          '&due_date=' + encodeURIComponent(date + 'T' + time)
                })
                .then(function (r) { return r.json(); })
                .then(function (data) {
                    saveBtn.disabled = false;
                    if (!data.success) { showError(data.error || 'Something went wrong.'); return; }
                    bootstrap.Modal.getInstance(modalEl).hide();
                    fetchAndRender();
                })
                .catch(function (err) { console.error(err); saveBtn.disabled = false; });

            } else {
                var jobTitle = document.getElementById('taskCalJobTitle').value.trim();
                var jobNotes = document.getElementById('taskCalJobNotes').value.trim();
                var assignedTo = assigneeSelect.value;

                if (!deptSelect.value) { showError('Please select a department.'); saveBtn.disabled = false; return; }
                if (!assignedTo)       { showError('Please select who to assign this to.'); saveBtn.disabled = false; return; }
                if (jobTitle === '')   { showError('Task is required.'); saveBtn.disabled = false; return; }

                fetch('php_action/createOfficeTask.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: 'title=' + encodeURIComponent(jobTitle) +
                          '&description=' + encodeURIComponent(jobNotes) +
                          '&due_date=' + encodeURIComponent(date) +
                          '&assigned_to=' + encodeURIComponent(assignedTo)
                })
                .then(function (r) { return r.json(); })
                .then(function (data) {
                    saveBtn.disabled = false;
                    if (!data.success) { showError(data.error || 'Something went wrong.'); return; }
                    bootstrap.Modal.getInstance(modalEl).hide();
                    fetchAndRender();
                })
                .catch(function (err) { console.error(err); saveBtn.disabled = false; });
            }
        });
    }

    fetchAndRender();
    setInterval(fetchAndRender, 25000);
});
