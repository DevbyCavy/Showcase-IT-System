document.addEventListener('DOMContentLoaded', function () {

    /* ---------- Mobile sidebar toggle ---------- */
    var toggleBtn = document.getElementById('sidebarToggle');
    var sidebar = document.getElementById('appSidebar');
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', function () {
            sidebar.classList.toggle('open');
        });
    }

    /* ---------- Orders carousel (arrows cycle New / On Going / Completed) ---------- */
    var panels = Array.prototype.slice.call(document.querySelectorAll('.orders-panel'));
    var label = document.getElementById('ordersTabLabel');
    var prevBtn = document.getElementById('ordersPrevBtn');
    var nextBtn = document.getElementById('ordersNextBtn');

    if (panels.length) {
        var current = panels.findIndex(function (p) { return p.classList.contains('active'); });
        if (current === -1) current = 0;

        function render() {
            panels.forEach(function (p, i) {
                p.classList.toggle('active', i === current);
            });
            if (label) label.textContent = panels[current].dataset.label || '';
        }

        function step(delta) {
            current = (current + delta + panels.length) % panels.length;
            render();
        }

        if (prevBtn) prevBtn.addEventListener('click', function () { step(-1); });
        if (nextBtn) nextBtn.addEventListener('click', function () { step(1); });

        render();
    }

    /* ---------- Pending requisitions quick "Process" action ---------- */
    document.querySelectorAll('.req-process-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var row = btn.closest('.req-row');
            var reqId = btn.dataset.requisitionId;
            btn.disabled = true;
            btn.textContent = 'Processing...';

            fetch('php_action/processRequisition.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: 'requisition_id=' + encodeURIComponent(reqId)
            })
                .then(function (r) { return r.json(); })
                .then(function (data) {
                    if (data.success) {
                        row.style.transition = 'opacity .25s';
                        row.style.opacity = '0';
                        setTimeout(function () {
                            row.remove();
                            var list = document.getElementById('reqList');
                            if (list && !list.querySelector('.req-row')) {
                                list.innerHTML = '<div class="req-empty">No pending requisitions.</div>';
                            }
                        }, 250);
                    } else {
                        btn.disabled = false;
                        btn.textContent = 'Process';
                        alert(data.error || 'Could not process requisition.');
                    }
                })
                .catch(function () {
                    btn.disabled = false;
                    btn.textContent = 'Process';
                    alert('Network error while processing requisition.');
                });
        });
    });

    /* ---------- Pending quotations quick "Approve" action ---------- */
    document.querySelectorAll('.quo-approve-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var row = btn.closest('.quo-row');
            var quoId = btn.dataset.quotationId;
            btn.disabled = true;
            btn.textContent = 'Approving...';

            fetch('php_action/processQuotation.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: 'quotation_id=' + encodeURIComponent(quoId)
            })
                .then(function (r) { return r.json(); })
                .then(function (data) {
                    if (data.success) {
                        row.style.transition = 'opacity .25s';
                        row.style.opacity = '0';
                        setTimeout(function () {
                            row.remove();
                            var list = document.getElementById('quoList');
                            if (list && !list.querySelector('.quo-row')) {
                                list.innerHTML = '<div class="req-empty">No pending quotations right now.</div>';
                            }
                        }, 250);
                    } else {
                        btn.disabled = false;
                        btn.textContent = 'Approve';
                        alert(data.error || 'Could not approve quotation.');
                    }
                })
                .catch(function () {
                    btn.disabled = false;
                    btn.textContent = 'Approve';
                    alert('Network error while approving quotation.');
                });
        });
    });

    /* ---------- Calendar widget ---------- */
    var calRoot = document.getElementById('dashCalendar');
    if (calRoot) {
        var markedDates = {};
        try {
            markedDates = JSON.parse(calRoot.dataset.marked || '{}');
        } catch (e) { /* ignore malformed data */ }

        var monthLabelEl = document.getElementById('calMonthLabel');
        var gridEl = document.getElementById('calGrid');
        var view = new Date();
        view.setDate(1);

        var monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        var dow = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

        function toKey(d) {
            return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        }

        function renderCalendar() {
            var year = view.getFullYear();
            var month = view.getMonth();
            monthLabelEl.textContent = monthNames[month] + ' ' + year;

            var firstDay = new Date(year, month, 1);
            var startOffset = (firstDay.getDay() + 6) % 7; // Monday-first grid
            var gridStart = new Date(year, month, 1 - startOffset);

            var today = new Date();
            var todayKey = toKey(today);

            var html = dow.map(function (d) { return '<div class="cal-dow">' + d + '</div>'; }).join('');

            for (var i = 0; i < 42; i++) {
                var cellDate = new Date(gridStart);
                cellDate.setDate(gridStart.getDate() + i);
                var key = toKey(cellDate);
                var inMonth = cellDate.getMonth() === month;
                var classes = 'cal-day' + (inMonth ? ' in-month' : '') + (key === todayKey ? ' today' : '');
                var dot = markedDates[key] ? '<span class="dot"></span>' : '';
                html += '<div class="' + classes + '">' + cellDate.getDate() + dot + '</div>';
            }

            gridEl.innerHTML = html;
        }

        document.getElementById('calPrevBtn').addEventListener('click', function () {
            view.setMonth(view.getMonth() - 1);
            renderCalendar();
        });
        document.getElementById('calNextBtn').addEventListener('click', function () {
            view.setMonth(view.getMonth() + 1);
            renderCalendar();
        });

        renderCalendar();
    }

    /* ---------- Global search (client-side filter of order tiles + requisition rows) ---------- */
    var searchInput = document.getElementById('globalSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            var q = searchInput.value.trim().toLowerCase();
            document.querySelectorAll('.order-tile').forEach(function (tile) {
                tile.style.display = !q || tile.textContent.toLowerCase().indexOf(q) !== -1 ? '' : 'none';
            });
            document.querySelectorAll('.req-row').forEach(function (row) {
                row.style.display = !q || row.textContent.toLowerCase().indexOf(q) !== -1 ? '' : 'none';
            });
        });
    }
});
