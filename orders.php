<?php
/*
 * orders.php — include in storesDashboard.php, superDashboard.php, productionDashboard.php
 * Do NOT call header.php or footer.php here.
 */

if (!isset($conn)) {
    require_once 'php_action/db_connection.php';
}

$loggedUserId = $_SESSION['user_id'] ?? 0;

// 1. Auto-advance overdue New/Assigned → On Going
$conn->query("
    UPDATE orders
    SET status = 'On Going', ongoing_since = NOW()
    WHERE status IN ('New', 'Assigned')
      AND deadline_datetime IS NOT NULL
      AND deadline_datetime <= NOW()
      AND (ongoing_since IS NULL)
");

// 2. Auto-complete On Going orders that have been running for 24+ hours
$conn->query("
    UPDATE orders
    SET status = 'Completed'
    WHERE status = 'On Going'
      AND ongoing_since IS NOT NULL
      AND ongoing_since <= NOW() - INTERVAL 24 HOUR
");

// 3. Fetch all orders with team info
$result = $conn->query("
    SELECT o.*,
           GROUP_CONCAT(CONCAT(u.name, ' ', u.surname) ORDER BY u.name SEPARATOR '||') AS assigned_names,
           GROUP_CONCAT(u.user_id ORDER BY u.name SEPARATOR ',')                        AS assigned_user_ids
    FROM orders o
    LEFT JOIN order_assignments oa ON o.order_id = oa.order_id
    LEFT JOIN users u ON oa.user_id = u.user_id
    GROUP BY o.order_id
    ORDER BY o.created_at DESC
");

$tabOrders = ['new' => [], 'ongoing' => [], 'completed' => []];

while ($row = $result->fetch_assoc()) {
    switch ($row['status']) {
        case 'New':
        case 'Assigned':  $tabOrders['new'][]       = $row; break;
        case 'On Going':  $tabOrders['ongoing'][]   = $row; break;
        case 'Completed': $tabOrders['completed'][] = $row; break;
    }
}
?>

<style>
.modern-tabs { border-bottom: none; gap: 10px; }
.modern-tab-btn {
    border: none; background: #f1f1f1; color: #444;
    padding: 12px 20px; border-radius: 15px 15px 0 0;
    font-weight: 600; transition: all 0.25s ease;
}
.modern-tab-btn:hover { background: #e0e0e0; }
.modern-tab-btn.active {
    background: #ff7b00 !important; color: #fff !important;
    box-shadow: 0px -2px 10px rgba(0,0,0,0.15); transform: translateY(-3px);
}
.nav-tabs { border-bottom: 0 !important; }
.tab-badge {
    position: absolute; top: -5px; right: -5px;
    background: #ff3b3b; color: #fff; font-size: 0.75rem; font-weight: bold;
    width: 20px; height: 20px; border-radius: 50%;
    display: flex; justify-content: center; align-items: center;
    box-shadow: 0 0 6px rgba(0,0,0,0.3);
}
.order-card { transition: box-shadow 0.2s, opacity 0.3s; cursor: pointer; }
.order-card:hover { box-shadow: 0 8px 20px rgba(0,0,0,0.15); }
</style>

<div class="container-fluid p-4">
    <h3 class="mb-4 fw-bold">Manage Orders</h3>

    <ul class="nav nav-tabs modern-tabs">
        <li class="nav-item position-relative">
            <button class="nav-link modern-tab-btn active" data-bs-toggle="tab" data-bs-target="#new-orders">
                New Orders
            </button>
            <span class="tab-badge"><?= count($tabOrders['new']) ?></span>
        </li>
        <li class="nav-item position-relative">
            <button class="nav-link modern-tab-btn" data-bs-toggle="tab" data-bs-target="#ongoing-orders">
                On Going
            </button>
            <span class="tab-badge"><?= count($tabOrders['ongoing']) ?></span>
        </li>
        <li class="nav-item position-relative">
            <button class="nav-link modern-tab-btn" data-bs-toggle="tab" data-bs-target="#completed-orders">
                Completed
            </button>
            <span class="tab-badge"><?= count($tabOrders['completed']) ?></span>
        </li>
    </ul>

    <div class="tab-content p-3">

        <div class="tab-pane fade show active" id="new-orders" role="tabpanel">
            <div class="row g-3" id="new-orders-container">
                <?php if (empty($tabOrders['new'])): ?>
                    <div class="col-12 text-center text-muted py-5">
                        <i class="fas fa-inbox fa-3x mb-3 d-block"></i>No new orders yet.
                    </div>
                <?php else: ?>
                    <?php foreach ($tabOrders['new'] as $order): include 'php_action/order_card.php'; endforeach; ?>
                <?php endif; ?>
            </div>
        </div>

        <div class="tab-pane fade" id="ongoing-orders" role="tabpanel">
            <div class="row g-3" id="ongoing-orders-container">
                <?php if (empty($tabOrders['ongoing'])): ?>
                    <div class="col-12 text-center text-muted py-5">
                        <i class="fas fa-hard-hat fa-3x mb-3 d-block"></i>No jobs in progress.
                    </div>
                <?php else: ?>
                    <?php foreach ($tabOrders['ongoing'] as $order): include 'php_action/order_card.php'; endforeach; ?>
                <?php endif; ?>
            </div>
        </div>

        <div class="tab-pane fade" id="completed-orders" role="tabpanel">
            <div class="row g-3" id="completed-orders-container">
                <?php if (empty($tabOrders['completed'])): ?>
                    <div class="col-12 text-center text-muted py-5">
                        <i class="fas fa-check-circle fa-3x mb-3 d-block"></i>No completed jobs yet.
                    </div>
                <?php else: ?>
                    <?php foreach ($tabOrders['completed'] as $order): include 'php_action/order_card.php'; endforeach; ?>
                <?php endif; ?>
            </div>
        </div>

    </div>
</div>

<!-- Order Details Modal (shared, populated on card click) -->
<div class="modal fade" id="orderDetailsModal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered modal-lg">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Order Details</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        <table class="table table-borderless mb-0">
          <tbody>
            <tr><th style="width:160px">Order #</th><td id="odOrderNumber"></td></tr>
            <tr><th>Name</th><td id="odOrderName"></td></tr>
            <tr><th>Description</th><td id="odDescription"></td></tr>
            <tr><th>Location</th><td id="odLocation"></td></tr>
            <tr><th>Deadline</th><td id="odDeadline"></td></tr>
            <tr><th>Status</th><td id="odStatus"></td></tr>
            <tr><th>Team</th><td id="odTeam"></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>

<!-- ============================================================
     SHARED JS — defined ONCE, used by all cards
     ============================================================ -->
<script>
const ORDER_STATUS_URL = 'php_action/update_order_status.php';

function showOrderDetails(card) {
    document.getElementById('odOrderNumber').textContent = card.dataset.orderNumber || '';
    document.getElementById('odOrderName').textContent   = card.dataset.orderName || '';
    document.getElementById('odDescription').textContent = card.dataset.description || '(none)';
    document.getElementById('odLocation').textContent    = card.dataset.location || '';
    document.getElementById('odDeadline').textContent    = card.dataset.deadline || '';
    document.getElementById('odStatus').textContent      = card.dataset.status || '';
    document.getElementById('odTeam').textContent        = card.dataset.team || 'No team assigned';

    const modalEl = document.getElementById('orderDetailsModal');
    bootstrap.Modal.getOrCreateInstance(modalEl).show();
}

function orderUpdateStatus(orderId, newStatus) {
    fetch(ORDER_STATUS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'order_id=' + orderId + '&status=' + encodeURIComponent(newStatus)
    })
    .then(r => r.json())
    .then(data => {
        if (!data.success) {
            console.error('Status update failed:', data);
            return;
        }

        const col = document.querySelector('[data-order-id="' + orderId + '"]');
        if (!col) return;

        col.dataset.status   = newStatus;
        col.style.transition = 'opacity 0.3s';
        col.style.opacity    = '0';

        setTimeout(() => {
            // Move card to the right container
            const containerMap = {
                'New':       'new-orders-container',
                'Assigned':  'new-orders-container',
                'On Going':  'ongoing-orders-container',
                'Completed': 'completed-orders-container'
            };
            const container = document.getElementById(containerMap[newStatus]);
            if (container) container.appendChild(col);

            // Update status badge
            const badge = col.querySelector('.order-status-badge');
            if (badge) {
                const colourMap = {
                    'New':       'bg-primary',
                    'Assigned':  'bg-info text-dark',
                    'On Going':  'bg-warning text-dark',
                    'Completed': 'bg-success'
                };
                badge.className   = 'badge order-status-badge ' + (colourMap[newStatus] || 'bg-secondary');
                badge.textContent = newStatus;
            }

            // Handle Done button
            const doneBtn = col.querySelector('.btn-done');
            if (newStatus === 'Completed' && doneBtn) {
                doneBtn.remove();
            } else if (newStatus === 'On Going' && !doneBtn) {
                const btnRow = col.querySelector('.d-flex.flex-wrap');
                if (btnRow) {
                    const btn     = document.createElement('button');
                    btn.className = 'btn btn-sm btn-success ms-auto btn-done';
                    btn.title     = 'Mark as Completed';
                    btn.innerHTML = '<i class="fas fa-check me-1"></i> Done';
                    btn.onclick   = () => markComplete(orderId);
                    btnRow.appendChild(btn);
                }
            }

            // Switch to the tab where the card now lives
            const tabMap = {
                'New':       '[data-bs-target="#new-orders"]',
                'Assigned':  '[data-bs-target="#new-orders"]',
                'On Going':  '[data-bs-target="#ongoing-orders"]',
                'Completed': '[data-bs-target="#completed-orders"]'
            };
            const tabBtn = document.querySelector(tabMap[newStatus]);
            if (tabBtn) tabBtn.click();

            updateTabBadges();
            col.style.opacity = '1';

        }, 300);
    })
    .catch(err => console.error('Fetch error:', err));
}

function markComplete(orderId) {
    if (confirm('Mark this order as Completed?')) {
        orderUpdateStatus(orderId, 'Completed');
    }
}

function updateTabBadges() {
    const counts = [
        document.querySelectorAll('#new-orders-container [data-order-id]').length,
        document.querySelectorAll('#ongoing-orders-container [data-order-id]').length,
        document.querySelectorAll('#completed-orders-container [data-order-id]').length,
    ];
    document.querySelectorAll('.modern-tabs .tab-badge').forEach((b, i) => {
        if (counts[i] !== undefined) b.textContent = counts[i];
    });
}
</script>

<?php require_once 'includes/workLogSheet.php'; ?>
