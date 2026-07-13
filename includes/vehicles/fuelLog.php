<?php
require_once __DIR__ . '/../../php_action/db_connection.php';

$message = '';

/*
|--------------------------------------------------------------------------
| SAVE FUEL ENTRY
|--------------------------------------------------------------------------
*/

if(isset($_POST['save_fuel'])){

    $vehicle_id       = (int)$_POST['vehicle_id'];
    $fuel_date        = $_POST['fuel_date'];
    $odometer_reading = (float)$_POST['odometer_reading'];
    $litres           = (float)$_POST['litres'];
    $fuel_cost        = (float)$_POST['fuel_cost'];
    $fuel_station     = trim($_POST['fuel_station']);
    $receipt_number   = trim($_POST['receipt_number']);
    $notes            = trim($_POST['notes']);

    $stmt = $conn->prepare("
        INSERT INTO fuel_logs
        (
            vehicle_id,
            fuel_date,
            odometer_reading,
            litres,
            fuel_cost,
            fuel_station,
            receipt_number,
            notes
        )
        VALUES
        (
            ?,?,?,?,?,?,?,?
        )
    ");

    $stmt->bind_param(
        "isdddsss",
        $vehicle_id,
        $fuel_date,
        $odometer_reading,
        $litres,
        $fuel_cost,
        $fuel_station,
        $receipt_number,
        $notes
    );

    if($stmt->execute()){

        $message =
        '<div class="alert alert-success">
            Fuel entry saved successfully.
        </div>';

    } else {

        $message =
        '<div class="alert alert-danger">
            Failed to save fuel entry.
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

$totalFuelEntries =
$conn->query("
SELECT COUNT(*) total
FROM fuel_logs
")->fetch_assoc()['total'];

$totalLitres =
$conn->query("
SELECT IFNULL(SUM(litres),0) total
FROM fuel_logs
")->fetch_assoc()['total'];

$totalFuelCost =
$conn->query("
SELECT IFNULL(SUM(fuel_cost),0) total
FROM fuel_logs
")->fetch_assoc()['total'];

$fuelHistory = [];

$historyResult = $conn->query("
    SELECT
        fl.*,
        v.registration_number,
        v.make,
        v.model
    FROM fuel_logs fl
    JOIN vehicles v ON fl.vehicle_id = v.vehicle_id
    ORDER BY fl.fuel_date DESC, fl.fuel_id DESC
    LIMIT 20
");

while($row = $historyResult->fetch_assoc()){
    $fuelHistory[] = $row;
}
?>

<div class="dash-card">
    <div class="dash-card-head">
        <h5><i class="fas fa-gas-pump me-2"></i>Fuel Log</h5>
    </div>

    <div class="overview-stats mb-4">

        <div class="stat-box">
            <i class="fas fa-list-check"></i>
            <strong><?= (int)$totalFuelEntries ?></strong>
            <span>Total Entries</span>
        </div>

        <div class="stat-box">
            <i class="fas fa-gas-pump"></i>
            <strong><?= number_format($totalLitres, 2) ?> L</strong>
            <span>Total Litres</span>
        </div>

        <div class="stat-box">
            <i class="fas fa-money-bill-wave"></i>
            <strong>$<?= number_format($totalFuelCost, 2) ?></strong>
            <span>Total Fuel Cost</span>
        </div>

    </div>

    <div class="dash-card-head">
        <h5><i class="fas fa-plus me-2"></i>Add Fuel Entry</h5>
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

                    <?php foreach($vehicles as $v): ?>

                    <option
                        value="<?= $v['vehicle_id'] ?>">

                        <?= htmlspecialchars($v['registration_number']) ?>
                        -
                        <?= htmlspecialchars($v['make']) ?>
                        <?= htmlspecialchars($v['model']) ?>

                    </option>

                    <?php endforeach; ?>

                </select>

            </div>

            <div class="col-md-4 mb-3">

                <label class="form-label">Fuel Date</label>

                <input
                    type="date"
                    name="fuel_date"
                    class="form-control"
                    required>

            </div>

            <div class="col-md-4 mb-3">

                <label class="form-label">Odometer Reading</label>

                <input
                    type="number"
                    step="0.01"
                    name="odometer_reading"
                    class="form-control"
                    required>

            </div>

            <div class="col-md-3 mb-3">

                <label class="form-label">Litres</label>

                <input
                    type="number"
                    step="0.01"
                    name="litres"
                    class="form-control"
                    required>

            </div>

            <div class="col-md-3 mb-3">

                <label class="form-label">Fuel Cost</label>

                <input
                    type="number"
                    step="0.01"
                    name="fuel_cost"
                    class="form-control"
                    required>

            </div>

            <div class="col-md-3 mb-3">

                <label class="form-label">Fuel Station</label>

                <input
                    type="text"
                    name="fuel_station"
                    class="form-control">

            </div>

            <div class="col-md-3 mb-3">

                <label class="form-label">Receipt Number</label>

                <input
                    type="text"
                    name="receipt_number"
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
            name="save_fuel">
            <i class="fas fa-save me-1"></i> Save Fuel Entry
        </button>

    </form>

    <hr class="my-4">

    <div class="dash-card-head">
        <h5><i class="fas fa-clock-rotate-left me-2"></i>Recent Fuel Entries</h5>
    </div>

    <div class="table-responsive">
        <table class="mini-table">
            <thead>
                <tr>
                    <th>Vehicle</th>
                    <th>Date</th>
                    <th>Odometer</th>
                    <th>Litres</th>
                    <th>Cost</th>
                    <th>Station</th>
                    <th>Receipt #</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($fuelHistory)): ?>
                    <tr class="table-empty"><td colspan="7">No fuel entries logged yet.</td></tr>
                <?php else: ?>
                    <?php foreach ($fuelHistory as $f): ?>
                        <tr>
                            <td><?= htmlspecialchars($f['registration_number']) ?> &middot; <?= htmlspecialchars($f['make']) ?> <?= htmlspecialchars($f['model']) ?></td>
                            <td><?= date('d M Y', strtotime($f['fuel_date'])) ?></td>
                            <td><?= number_format($f['odometer_reading'], 2) ?></td>
                            <td><?= number_format($f['litres'], 2) ?> L</td>
                            <td>$<?= number_format($f['fuel_cost'], 2) ?></td>
                            <td><?= htmlspecialchars($f['fuel_station'] ?: '—') ?></td>
                            <td><?= htmlspecialchars($f['receipt_number'] ?: '—') ?></td>
                        </tr>
                    <?php endforeach; ?>
                <?php endif; ?>
            </tbody>
        </table>
    </div>

</div>
