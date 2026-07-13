<?php

require_once __DIR__ . '/../../php_action/db_connection.php';

$message = '';

if(isset($_POST['save_maintenance'])){

    $vehicle_id            = (int)$_POST['vehicle_id'];
    $maintenance_type      = trim($_POST['maintenance_type']);
    $service_provider      = trim($_POST['service_provider']);
    $service_date          = $_POST['service_date'];
    $odometer_reading      = (float)$_POST['odometer_reading'];
    $service_cost          = (float)$_POST['service_cost'];
    $next_service_date     = $_POST['next_service_date'];
    $next_service_odometer = (float)$_POST['next_service_odometer'];
    $notes                 = trim($_POST['notes']);

    $stmt = $conn->prepare("
        INSERT INTO maintenance_logs
        (
            vehicle_id,
            maintenance_type,
            service_provider,
            service_date,
            odometer_reading,
            service_cost,
            next_service_date,
            next_service_odometer,
            notes
        )
        VALUES
        (
            ?,?,?,?,?,?,?,?,?
        )
    ");

    $stmt->bind_param(
        "isssddsss",
        $vehicle_id,
        $maintenance_type,
        $service_provider,
        $service_date,
        $odometer_reading,
        $service_cost,
        $next_service_date,
        $next_service_odometer,
        $notes
    );

    if($stmt->execute()){

        $message =
        '<div class="alert alert-success">
            Maintenance record saved successfully.
        </div>';

    }else{

        $message =
        '<div class="alert alert-danger">
            Failed to save maintenance record.
        </div>';
    }
}

$vehicles = [];

$result = $conn->query("
    SELECT
        vehicle_id,
        registration_number,
        make,
        model
    FROM vehicles
    ORDER BY registration_number
");

while($row = $result->fetch_assoc()){
    $vehicles[] = $row;
}

$totalMaintenance =
$conn->query("
SELECT COUNT(*) total
FROM maintenance_logs
")->fetch_assoc()['total'];

$totalCost =
$conn->query("
SELECT IFNULL(SUM(service_cost),0) total
FROM maintenance_logs
")->fetch_assoc()['total'];

$dueServices =
$conn->query("
SELECT COUNT(*) total
FROM maintenance_logs
WHERE next_service_date <= DATE_ADD(CURDATE(),INTERVAL 30 DAY)
")->fetch_assoc()['total'];

$history = $conn->query("
SELECT
    m.*,
    v.registration_number
FROM maintenance_logs m
INNER JOIN vehicles v
ON m.vehicle_id = v.vehicle_id
ORDER BY m.service_date DESC
");
?>

<div class="dash-card">
    <div class="dash-card-head">
        <h5><i class="fas fa-screwdriver-wrench me-2"></i>Maintenance Log</h5>
    </div>

    <div class="overview-stats mb-4">

        <div class="stat-box">
            <i class="fas fa-list-check"></i>
            <strong><?= (int)$totalMaintenance ?></strong>
            <span>Total Services</span>
        </div>

        <div class="stat-box">
            <i class="fas fa-money-bill-wave"></i>
            <strong>$<?= number_format($totalCost, 2) ?></strong>
            <span>Total Maintenance Cost</span>
        </div>

        <div class="stat-box">
            <i class="fas fa-triangle-exclamation"></i>
            <strong><?= (int)$dueServices ?></strong>
            <span>Services Due Soon</span>
        </div>

    </div>

    <div class="dash-card-head">
        <h5><i class="fas fa-plus me-2"></i>Add Maintenance Record</h5>
    </div>

    <?= $message ?>

    <form method="POST">

        <div class="row">

            <div class="col-md-4 mb-3">

                <label class="form-label">Vehicle</label>

                <select
                    name="vehicle_id"
                    class="form-select"
                    required>

                    <option value="">
                        Select Vehicle
                    </option>

                    <?php foreach($vehicles as $vehicle): ?>

                    <option value="<?= $vehicle['vehicle_id'] ?>">

                        <?= htmlspecialchars($vehicle['registration_number']) ?>
                        -
                        <?= htmlspecialchars($vehicle['make']) ?>
                        <?= htmlspecialchars($vehicle['model']) ?>

                    </option>

                    <?php endforeach; ?>

                </select>

            </div>

            <div class="col-md-4 mb-3">

                <label class="form-label">Maintenance Type</label>

                <select
                    name="maintenance_type"
                    class="form-select"
                    required>

                    <option value="">
                        Select Type
                    </option>

                    <option>Service</option>
                    <option>Oil Change</option>
                    <option>Tyre Replacement</option>
                    <option>Brake Repair</option>
                    <option>Engine Repair</option>
                    <option>Accident Repair</option>
                    <option>Other</option>

                </select>

            </div>

            <div class="col-md-4 mb-3">

                <label class="form-label">Service Provider</label>

                <input
                    type="text"
                    name="service_provider"
                    class="form-control">

            </div>

            <div class="col-md-3 mb-3">

                <label class="form-label">Service Date</label>

                <input
                    type="date"
                    name="service_date"
                    class="form-control"
                    required>

            </div>

            <div class="col-md-3 mb-3">

                <label class="form-label">Odometer</label>

                <input
                    type="number"
                    step="0.01"
                    name="odometer_reading"
                    class="form-control">

            </div>

            <div class="col-md-3 mb-3">

                <label class="form-label">Service Cost</label>

                <input
                    type="number"
                    step="0.01"
                    name="service_cost"
                    class="form-control">

            </div>

            <div class="col-md-3 mb-3">

                <label class="form-label">Next Service Date</label>

                <input
                    type="date"
                    name="next_service_date"
                    class="form-control">

            </div>

            <div class="col-md-6 mb-3">

                <label class="form-label">Next Service Odometer</label>

                <input
                    type="number"
                    step="0.01"
                    name="next_service_odometer"
                    class="form-control">

            </div>

            <div class="col-md-12 mb-3">

                <label class="form-label">Notes</label>

                <textarea
                    name="notes"
                    class="form-control"></textarea>

            </div>

        </div>

        <button
            type="submit"
            class="btn text-white" style="background:var(--brand-orange,#F15A2C);"
            name="save_maintenance">
            <i class="fas fa-save me-1"></i> Save Maintenance Record
        </button>

    </form>

    <hr class="my-4">

    <div class="dash-card-head">
        <h5><i class="fas fa-clock-rotate-left me-2"></i>Maintenance History</h5>
    </div>

    <div class="table-responsive">
        <table class="mini-table">

            <thead>
                <tr>
                    <th>Date</th>
                    <th>Vehicle</th>
                    <th>Type</th>
                    <th>Provider</th>
                    <th>Cost</th>
                    <th>Next Service</th>
                </tr>
            </thead>

            <tbody>

                <?php if ($history->num_rows === 0): ?>
                    <tr class="table-empty"><td colspan="6">No maintenance records logged yet.</td></tr>
                <?php else: ?>
                    <?php while($row = $history->fetch_assoc()): ?>
                        <tr>
                            <td><?= date('d M Y', strtotime($row['service_date'])) ?></td>
                            <td><?= htmlspecialchars($row['registration_number']) ?></td>
                            <td><?= htmlspecialchars($row['maintenance_type']) ?></td>
                            <td><?= htmlspecialchars($row['service_provider'] ?: '—') ?></td>
                            <td>$<?= number_format($row['service_cost'], 2) ?></td>
                            <td><?= $row['next_service_date'] ? date('d M Y', strtotime($row['next_service_date'])) : '—' ?></td>
                        </tr>
                    <?php endwhile; ?>
                <?php endif; ?>

            </tbody>

        </table>
    </div>

</div>
