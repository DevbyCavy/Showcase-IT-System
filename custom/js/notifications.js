/* Notification bell dropdown — shared by the modern sidebar shell and the
 * legacy navbar shell. Self-contained: no-ops on any page without #notifDropdown.
 */
document.addEventListener('DOMContentLoaded', function () {
    var dropdown = document.getElementById('notifDropdown');
    var listEl = document.getElementById('notifList');
    if (!dropdown || !listEl) return;

    var TYPE_ICONS = {
        quotation_approved: 'fa-file-invoice-dollar',
        requisition_processed: 'fa-file-signature',
        design_job_assigned: 'fa-pen-ruler',
        design_job_submitted: 'fa-upload',
        design_job_approved: 'fa-check-circle',
        design_job_revision: 'fa-rotate-left',
        office_task_assigned: 'fa-briefcase'
    };

    function escapeHtml(s) {
        var div = document.createElement('div');
        div.textContent = s;
        return div.innerHTML;
    }

    function formatWhen(createdAt) {
        var d = new Date(createdAt.replace(' ', 'T'));
        if (isNaN(d.getTime())) return createdAt;
        return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    function render(notifications) {
        if (!notifications.length) {
            listEl.innerHTML = '<li class="text-center text-muted small py-3">No notifications yet.</li>';
            return;
        }

        listEl.innerHTML = notifications.map(function (n) {
            var icon = TYPE_ICONS[n.type] || 'fa-bell';
            var href = n.link || '#';
            return '<li>' +
                '<a class="dropdown-item notif-item' + (n.seen ? '' : ' notif-unseen') + '" href="' + escapeHtml(href) + '">' +
                    '<div class="d-flex align-items-start gap-2">' +
                        '<i class="fas ' + icon + ' mt-1 text-muted"></i>' +
                        '<div class="flex-grow-1">' +
                            '<div class="notif-actor">' + escapeHtml(n.actor_name) + '</div>' +
                            '<div class="notif-message">' + escapeHtml(n.message) + '</div>' +
                            '<div class="notif-time">' + escapeHtml(formatWhen(n.created_at)) + '</div>' +
                        '</div>' +
                    '</div>' +
                '</a>' +
            '</li>';
        }).join('');
    }

    function loadNotifications() {
        fetch('php_action/getNotifications.php')
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (data.success) render(data.notifications);
            })
            .catch(function (err) { console.error(err); });
    }

    function markSeen() {
        fetch('php_action/markNotificationsSeen.php', { method: 'POST' })
            .then(function () {
                dropdown.querySelectorAll('.icon-dot, .notif-badge-dot').forEach(function (dot) {
                    dot.remove();
                });
            })
            .catch(function (err) { console.error(err); });
    }

    dropdown.addEventListener('show.bs.dropdown', function () {
        listEl.innerHTML = '<li class="text-center text-muted small py-3">Loading…</li>';
        loadNotifications();
        markSeen();
    });
});
