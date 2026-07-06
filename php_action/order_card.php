<?php
/*
 * php_action/order_card.php
 * Pure HTML + per-card countdown IIFE. No shared JS functions here.
 * Shared functions (orderUpdateStatus, markComplete) live in orders.php.
 */

$assignedNames = !empty($order['assigned_names'])
    ? explode('||', $order['assigned_names'])
    : [];

$boqPath     = !empty($order['boq_file'])     ? htmlspecialchars($order['boq_file'])     : '';
$artworkPath = !empty($order['artwork_file']) ? htmlspecialchars($order['artwork_file']) : '';

$badgeClass = match($order['status']) {
    'New'       => 'bg-primary',
    'Assigned'  => 'bg-info text-dark',
    'On Going'  => 'bg-warning text-dark',
    'Completed' => 'bg-success',
    default     => 'bg-secondary',
};

// 24hr completion deadline for On Going orders
$ongoingSince       = $order['ongoing_since'] ?? null;
$completionDeadline = $ongoingSince
    ? date('Y-m-d H:i:s', strtotime($ongoingSince) + 86400)
    : null;
?>

<div class="col-md-6 col-lg-4"
     data-order-id="<?= $order['order_id'] ?>"
     data-status="<?= htmlspecialchars($order['status']) ?>">
    <div class="card shadow-sm order-card h-100">
        <div class="card-body d-flex flex-column">

            <!-- Header -->
            <div class="d-flex justify-content-between align-items-start mb-2">
                <div>
                    <div class="fw-bold fs-5 mb-1">Order #<?= htmlspecialchars($order['order_number']) ?></div>
                    <div class="fw-semibold text-dark mb-1"><?= htmlspecialchars($order['order_name']) ?></div>
                    <div class="text-muted small"><?= htmlspecialchars($order['description'] ?? '') ?></div>
                </div>
                <div class="text-end ms-2 flex-shrink-0">
                    <?php if ($order['status'] === 'On Going' && $completionDeadline): ?>
                        <small class="fw-bold d-block text-muted">Completes in</small>
                        <span id="countdown<?= $order['order_id'] ?>" class="fw-bold"></span>
                    <?php elseif ($order['status'] === 'Completed'): ?>
                        <span class="fw-bold text-success"><i class="fas fa-check-circle"></i> Done</span>
                    <?php else: ?>
                        <small class="fw-bold d-block text-muted">Time Left</small>
                        <span id="countdown<?= $order['order_id'] ?>" class="fw-bold"></span>
                    <?php endif; ?>
                </div>
            </div>

            <hr class="my-2">

            <p class="mb-2 small">
                <i class="fas fa-map-marker-alt me-1 text-secondary"></i>
                <?= htmlspecialchars($order['location']) ?>
            </p>

            <p class="mb-3">
                <span class="badge <?= $badgeClass ?> order-status-badge"><?= htmlspecialchars($order['status']) ?></span>
            </p>

            <!-- Action buttons -->
            <div class="d-flex flex-wrap gap-2 mt-auto align-items-center">

                <?php if ($boqPath): ?>
                    <a href="<?= $boqPath ?>" target="_blank" class="btn btn-sm btn-outline-secondary">
                        <i class="fas fa-file-alt me-1"></i> B.O.Q
                    </a>
                <?php else: ?>
                    <button class="btn btn-sm btn-outline-secondary" disabled title="No BOQ uploaded">
                        <i class="fas fa-file-alt me-1"></i> B.O.Q
                    </button>
                <?php endif; ?>

                <?php if ($artworkPath): ?>
                    <a href="<?= $artworkPath ?>" target="_blank" class="btn btn-sm btn-outline-secondary">
                        <i class="fas fa-image me-1"></i> Artwork
                    </a>
                <?php else: ?>
                    <button class="btn btn-sm btn-outline-secondary" disabled title="No artwork uploaded">
                        <i class="fas fa-image me-1"></i> Artwork
                    </button>
                <?php endif; ?>

                <!-- Team dropdown -->
                <div class="dropdown" style="position: static;">
                    <button class="btn btn-sm btn-outline-primary dropdown-toggle"
                            type="button"
                            data-bs-toggle="dropdown"
                            data-bs-auto-close="true"
                            data-bs-reference="toggle">
                        <i class="fas fa-users me-1"></i>
                        Team <span class="badge bg-primary ms-1"><?= count($assignedNames) ?></span>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end" style="z-index: 9999; position: fixed;">
                        <?php if (!empty($assignedNames)): ?>
                            <?php foreach ($assignedNames as $name): ?>
                                <li>
                                    <span class="dropdown-item">
                                        <i class="fas fa-user me-2 text-secondary"></i>
                                        <?= htmlspecialchars(trim($name)) ?>
                                    </span>
                                </li>
                            <?php endforeach; ?>
                        <?php else: ?>
                            <li><span class="dropdown-item text-muted">No team assigned</span></li>
                        <?php endif; ?>
                    </ul>
                </div>

                <!-- Done button — only for On Going orders -->
                <?php if ($order['status'] === 'On Going'): ?>
                    <button class="btn btn-sm btn-success ms-auto btn-done"
                            onclick="markComplete(<?= $order['order_id'] ?>)"
                            title="Mark as Completed">
                        <i class="fas fa-check me-1"></i> Done
                    </button>
                <?php endif; ?>

            </div>
        </div>
    </div>
</div>

<script>
(function () {
    const id     = <?= $order['order_id'] ?>;
    const status = <?= json_encode($order['status']) ?>;
    const el     = document.getElementById('countdown' + id);

    <?php if ($order['status'] === 'On Going' && $completionDeadline): ?>
    // 24hr completion countdown
    const deadline = new Date('<?= $completionDeadline ?>').getTime();
    let autoMoved = false;

    function tick() {
        const dist = deadline - Date.now();
        if (dist <= 0) {
            if (el) { el.textContent = 'Completing...'; el.className = 'fw-bold text-success'; }
            clearInterval(timer);
            if (!autoMoved) {
                autoMoved = true;
                if (typeof orderUpdateStatus === 'function') orderUpdateStatus(id, 'Completed');
            }
            return;
        }
        const h = Math.floor(dist / 3600000);
        const m = Math.floor((dist % 3600000) / 60000);
        const s = Math.floor((dist % 60000)   / 1000);
        if (el) {
            el.textContent = h + 'h ' + m + 'm ' + s + 's';
            el.className   = dist <= 3600000 ? 'fw-bold text-danger' : 'fw-bold text-warning';
        }
    }
    const timer = setInterval(tick, 1000);
    tick();

    <?php elseif ($order['status'] !== 'Completed'): ?>
    // Regular deadline countdown (New / Assigned)
    const deadline = new Date('<?= $order['deadline_datetime'] ?>').getTime();
    let autoMoved = false;

    function tick() {
        const dist = deadline - Date.now();
        if (dist <= 0) {
            if (el) { el.textContent = 'Deadline passed'; el.className = 'fw-bold text-danger'; }
            clearInterval(timer);
            const col = document.querySelector('[data-order-id="' + id + '"]');
            if (!autoMoved && col && (col.dataset.status === 'New' || col.dataset.status === 'Assigned')) {
                autoMoved = true;
                if (typeof orderUpdateStatus === 'function') orderUpdateStatus(id, 'On Going');
            }
            return;
        }
        const d = Math.floor(dist / 86400000);
        const h = Math.floor((dist % 86400000) / 3600000);
        const m = Math.floor((dist % 3600000)  / 60000);
        const s = Math.floor((dist % 60000)    / 1000);
        if (el) {
            el.textContent = d + 'd ' + h + 'h ' + m + 'm ' + s + 's';
            el.className   = dist <= 3600000  ? 'fw-bold text-danger'
                           : dist <= 86400000 ? 'fw-bold text-warning'
                           :                    'fw-bold text-success';
        }
    }
    const timer = setInterval(tick, 1000);
    tick();
    <?php endif; ?>
})();
</script>
