<?php

require_once 'php_action/db_connection.php';

/*
|--------------------------------------------------------------------------
| ADD VEHICLE
|--------------------------------------------------------------------------
*/

$message = "";

if(isset($_POST['add_vehicle'])) {

    $registration_number = trim($_POST['registration_number']);
    $make                = trim($_POST['make']);
    $model               = trim($_POST['model']);
    $vehicle_year        = trim($_POST['vehicle_year']);
    $color               = trim($_POST['color']);
    $fuel_type           = trim($_POST['fuel_type']);
    $capacity            = trim($_POST['capacity']);
    $department          = trim($_POST['department']);
    $assigned_user       = !empty($_POST['assigned_user']) ? $_POST['assigned_user'] : NULL;
    $status              = trim($_POST['status']);
    $purchase_date       = trim($_POST['purchase_date']);
    $notes               = trim($_POST['notes']);

    $check = $conn->prepare("
        SELECT vehicle_id
        FROM vehicles
        WHERE registration_number = ?
    ");

    $check->bind_param("s", $registration_number);
    $check->execute();
    $result = $check->get_result();

    if($result->num_rows > 0){

        $message = '<div class="alert alert-danger">
                        Registration number already exists.
                    </div>';

    } else {

        $stmt = $conn->prepare("
            INSERT INTO vehicles
            (
                registration_number,
                make,
                model,
                vehicle_year,
                color,
                fuel_type,
                capacity,
                department,
                assigned_user,
                status,
                purchase_date,
                notes
            )
            VALUES
            (
                ?,?,?,?,?,?,?,?,?,?,?,?
            )
        ");

        $stmt->bind_param(
            "ssssssssisss",
            $registration_number,
            $make,
            $model,
            $vehicle_year,
            $color,
            $fuel_type,
            $capacity,
            $department,
            $assigned_user,
            $status,
            $purchase_date,
            $notes
        );

        if($stmt->execute()) {

            $message = '<div class="alert alert-success">
                            Vehicle added successfully.
                        </div>';

        } else {

            $message = '<div class="alert alert-danger">
                            Failed to save vehicle.
                        </div>';
        }
    }
}

/*
|--------------------------------------------------------------------------
| UPDATE VEHICLE
|--------------------------------------------------------------------------
*/

if(isset($_POST['update_vehicle'])) {

    $vehicle_id          = (int)$_POST['vehicle_id'];
    $registration_number = trim($_POST['registration_number']);
    $make                = trim($_POST['make']);
    $model               = trim($_POST['model']);
    $vehicle_year        = trim($_POST['vehicle_year']);
    $color               = trim($_POST['color']);
    $fuel_type           = trim($_POST['fuel_type']);
    $capacity            = trim($_POST['capacity']);
    $department          = trim($_POST['department']);
    $assigned_user       = !empty($_POST['assigned_user']) ? $_POST['assigned_user'] : NULL;
    $status              = trim($_POST['status']);
    $purchase_date       = trim($_POST['purchase_date']);
    $notes               = trim($_POST['notes']);

    $stmt = $conn->prepare("
        UPDATE vehicles
        SET
            registration_number=?,
            make=?,
            model=?,
            vehicle_year=?,
            color=?,
            fuel_type=?,
            capacity=?,
            department=?,
            assigned_user=?,
            status=?,
            purchase_date=?,
            notes=?
        WHERE vehicle_id=?
    ");

    $stmt->bind_param(
        "ssssssssisssi",
        $registration_number,
        $make,
        $model,
        $vehicle_year,
        $color,
        $fuel_type,
        $capacity,
        $department,
        $assigned_user,
        $status,
        $purchase_date,
        $notes,
        $vehicle_id
    );

    if($stmt->execute()){

        $message =
        '<div class="alert alert-success">
            Vehicle updated successfully.
        </div>';

    } else {

        $message =
        '<div class="alert alert-danger">
            Failed to update vehicle.
        </div>';
    }
}

/*
|--------------------------------------------------------------------------
| FETCH USERS
|--------------------------------------------------------------------------
*/

$users = [];

$userQuery = $conn->query("
    SELECT user_id, name, surname
    FROM users
    ORDER BY name ASC
");

while($row = $userQuery->fetch_assoc()) {
    $users[] = $row;
}

/*
|--------------------------------------------------------------------------
| FETCH VEHICLES
|--------------------------------------------------------------------------
*/

$vehicles = [];

$vehicleQuery = $conn->query("
    SELECT
        v.*,
        CONCAT(u.name,' ',u.surname) AS assigned_name
    FROM vehicles v
    LEFT JOIN users u
        ON v.assigned_user = u.user_id
    ORDER BY vehicle_id DESC
");

while($row = $vehicleQuery->fetch_assoc()) {
    $vehicles[] = $row;
}

?>

<div class="d-flex justify-content-between align-items-center mb-3">
    <input type="text"
           id="vehicleSearch"
           class="form-control"
           style="max-width:320px;"
           placeholder="Search vehicle...">

    <button class="btn text-white flex-shrink-0 ms-3"
            style="background:var(--brand-orange,#F15A2C);"
            data-bs-toggle="modal"
            data-bs-target="#addVehicleModal">
        <i class="fas fa-plus-circle me-1"></i> Add Vehicle
    </button>
</div>

<?= $message ?>

<div class="table-responsive">

    <table class="table table-bordered table-striped mb-0"
           id="vehicleTable">

        <thead class="table-dark">

            <tr>
                <th>Reg Number</th>
                <th>Vehicle</th>
                <th>Department</th>
                <th>Assigned User</th>
                <th>Status</th>
                <th>Purchase Date</th>
                <th width="140">Actions</th>
            </tr>

        </thead>

        <tbody>

        <?php if (empty($vehicles)): ?>
            <tr><td colspan="7" class="text-center text-muted py-4">No vehicles registered yet.</td></tr>
        <?php endif; ?>

        <?php foreach($vehicles as $vehicle): ?>

            <tr>

                <td>
                    <?= htmlspecialchars($vehicle['registration_number']) ?>
                </td>

                <td>
                    <?= htmlspecialchars($vehicle['make']) ?>
                    <?= htmlspecialchars($vehicle['model']) ?>
                </td>

                <td>
                    <?= htmlspecialchars($vehicle['department']) ?>
                </td>

                <td>
                    <?= htmlspecialchars($vehicle['assigned_name']) ?>
                </td>

                <td>

                <?php

                switch($vehicle['status']) {

                    case 'Available':
                        echo '<span class="mini-badge badge-delivered">Available</span>';
                        break;

                    case 'On Trip':
                        echo '<span class="mini-badge badge-transit">On Trip</span>';
                        break;

                    case 'Under Maintenance':
                        echo '<span class="mini-badge badge-maintenance">Maintenance</span>';
                        break;

                    case 'Out of Service':
                        echo '<span class="mini-badge badge-delayed">Out of Service</span>';
                        break;
                }

                ?>

                </td>

                <td>
                    <?= htmlspecialchars($vehicle['purchase_date']) ?>
                </td>

                <td>

                    <button
                        class="row-action viewVehicleBtn"
                        title="View details"
                        data-id="<?= $vehicle['vehicle_id'] ?>">
                        <i class="fas fa-eye"></i>
                    </button>

                    <button
                        class="row-action editVehicleBtn"
                        title="Edit vehicle"
                        data-id="<?= $vehicle['vehicle_id'] ?>">
                        <i class="fas fa-pen"></i>
                    </button>

                    <a href="php_action/deleteVehicle.php?id=<?= $vehicle['vehicle_id'] ?>"
                       class="row-action"
                       title="Delete vehicle"
                       onclick="return confirm('Delete this vehicle?')">
                        <i class="fas fa-trash"></i>
                    </a>

                </td>

            </tr>

        <?php endforeach; ?>

        </tbody>

    </table>

</div>

<!-- ADD VEHICLE MODAL -->

<div class="modal fade"
     id="addVehicleModal">

<div class="modal-dialog modal-lg">

<div class="modal-content">

<form method="POST">

<div class="modal-header text-white" style="background:linear-gradient(135deg, var(--brand-orange,#F15A2C), var(--brand-orange-dark,#D94E22));">

    <h5 class="modal-title"><i class="fa-solid fa-plus me-2"></i>Add Vehicle</h5>

    <button type="button"
            class="btn-close btn-close-white"
            data-bs-dismiss="modal"></button>

</div>

<div class="modal-body">

<div class="row">

<div class="col-md-6 mb-3">
<label>Registration Number</label>
<input type="text"
       name="registration_number"
       class="form-control"
       required>
</div>

<div class="col-md-6 mb-3">
<label>Make</label>
<input type="text"
       name="make"
       class="form-control"
       required>
</div>

<div class="col-md-6 mb-3">
<label>Model</label>
<input type="text"
       name="model"
       class="form-control"
       required>
</div>

<div class="col-md-6 mb-3">
<label>Year</label>
<input type="number"
       name="vehicle_year"
       class="form-control">
</div>

<div class="col-md-6 mb-3">
<label>Colour</label>
<input type="text"
       name="color"
       class="form-control">
</div>

<div class="col-md-6 mb-3">
<label>Fuel Type</label>

<select name="fuel_type"
        class="form-select">

<option>Petrol</option>
<option>Diesel</option>
<option>Hybrid</option>
<option>Electric</option>

</select>

</div>

<div class="col-md-6 mb-3">
<label>Capacity</label>
<input type="text"
       name="capacity"
       class="form-control">
</div>

<div class="col-md-6 mb-3">
<label>Department</label>
<input type="text"
       name="department"
       class="form-control">
</div>

<div class="col-md-6 mb-3">
<label>Assigned User</label>

<select name="assigned_user"
        class="form-select">

<option value="">
Select User
</option>

<?php foreach($users as $user): ?>

<option value="<?= $user['user_id'] ?>">

<?= $user['name'] ?>
<?= $user['surname'] ?>

</option>

<?php endforeach; ?>

</select>

</div>

<div class="col-md-6 mb-3">
<label>Status</label>

<select name="status"
        class="form-select">

<option>Available</option>
<option>On Trip</option>
<option>Under Maintenance</option>
<option>Out of Service</option>

</select>

</div>

<div class="col-md-6 mb-3">
<label>Purchase Date</label>

<input type="date"
       name="purchase_date"
       class="form-control">

</div>

<div class="col-md-12 mb-3">

<label>Notes</label>

<textarea name="notes"
          class="form-control"></textarea>

</div>

</div>

</div>

<div class="modal-footer">

<button type="button" class="btn btn-secondary" data-bs-dismiss="modal"><i class="fa-solid fa-xmark me-1"></i> Close</button>

<button class="btn text-white" style="background:var(--brand-orange,#F15A2C);"
        name="add_vehicle">
<i class="fa-solid fa-check me-1"></i> Save Vehicle
</button>

</div>

</form>

</div>

</div>

</div>

<div class="modal fade" id="vehicleDetailsModal">

    <div class="modal-dialog modal-lg">
    
        <div class="modal-content">
        
            <div class="modal-header">

                <h5 class="modal-title">
                    <i class="fa-solid fa-truck me-2"></i>Vehicle Details
                </h5>

                <button
                    type="button"
                    class="btn-close"
                    data-bs-dismiss="modal">
                </button>

            </div>
            
            <div class="modal-body"
                 id="vehicleDetailsContent">
            
            Loading...
            
            </div>
        
        </div>
    
    </div>

</div>

<div class="modal fade" id="editVehicleModal">

<div class="modal-dialog modal-lg">

<div class="modal-content">

<form method="POST">

<div class="modal-header text-white" style="background:linear-gradient(135deg, var(--brand-orange,#F15A2C), var(--brand-orange-dark,#D94E22));">

<h5 class="modal-title"><i class="fa-solid fa-pen-to-square me-2"></i>Edit Vehicle</h5>

<button
type="button"
class="btn-close btn-close-white"
data-bs-dismiss="modal">
</button>

</div>

<div class="modal-body">

<input type="hidden"
       name="vehicle_id"
       id="edit_vehicle_id">

<div class="row">

<div class="col-md-6 mb-3">
<label>Registration Number</label>

<input type="text"
       name="registration_number"
       id="edit_registration_number"
       class="form-control"
       required>
</div>

<div class="col-md-6 mb-3">
<label>Make</label>

<input type="text"
       name="make"
       id="edit_make"
       class="form-control">
</div>

<div class="col-md-6 mb-3">
<label>Model</label>

<input type="text"
       name="model"
       id="edit_model"
       class="form-control">
</div>

<div class="col-md-6 mb-3">
<label>Year</label>

<input type="number"
       name="vehicle_year"
       id="edit_year"
       class="form-control">
</div>

<div class="col-md-6 mb-3">
<label>Colour</label>

<input type="text"
       name="color"
       id="edit_color"
       class="form-control">
</div>

<div class="col-md-6 mb-3">
<label>Fuel Type</label>

<select name="fuel_type"
        id="edit_fuel_type"
        class="form-select">

<option>Petrol</option>
<option>Diesel</option>
<option>Hybrid</option>
<option>Electric</option>

</select>

</div>

<div class="col-md-6 mb-3">
<label>Capacity</label>

<input type="text"
       name="capacity"
       id="edit_capacity"
       class="form-control">
</div>

<div class="col-md-6 mb-3">
<label>Department</label>

<input type="text"
       name="department"
       id="edit_department"
       class="form-control">
</div>

<div class="col-md-6 mb-3">
<label>Status</label>

<select name="status"
        id="edit_status"
        class="form-select">

<option>Available</option>
<option>On Trip</option>
<option>Under Maintenance</option>
<option>Out of Service</option>

</select>

</div>

<div class="col-md-6 mb-3">
<label>Purchase Date</label>

<input type="date"
       name="purchase_date"
       id="edit_purchase_date"
       class="form-control">
</div>

<div class="col-md-12 mb-3">
<label>Notes</label>

<textarea
name="notes"
id="edit_notes"
class="form-control"></textarea>
</div>

</div>

</div>

<div class="modal-footer">

<button type="button" class="btn btn-secondary" data-bs-dismiss="modal"><i class="fa-solid fa-xmark me-1"></i> Close</button>

<button
name="update_vehicle"
class="btn text-white" style="background:var(--brand-orange,#F15A2C);">
<i class="fa-solid fa-check me-1"></i> Update Vehicle
</button>

</div>

</form>

</div>

</div>

</div>

<script>

document.getElementById('vehicleSearch')
.addEventListener('keyup', function() {

let value = this.value.toLowerCase();

document.querySelectorAll('#vehicleTable tbody tr')
.forEach(row => {

row.style.display =
row.innerText.toLowerCase().includes(value)
? ''
: 'none';

});

});

document.querySelectorAll('.viewVehicleBtn')
.forEach(button => {

    button.addEventListener('click', function() {

        let id = this.dataset.id;

        fetch('php_action/getVehicleDetails.php?id=' + id)

        .then(response => response.text())

        .then(data => {

            document.getElementById(
                'vehicleDetailsContent'
            ).innerHTML = data;

            new bootstrap.Modal(
                document.getElementById(
                    'vehicleDetailsModal'
                )
            ).show();

        });

    });

});

document.querySelectorAll('.editVehicleBtn')
.forEach(button => {

    button.addEventListener('click', function(){

        let id = this.dataset.id;

        fetch(
            'php_action/getVehicle.php?id=' + id
        )

        .then(response => response.json())

        .then(data => {

            document.getElementById(
                'edit_vehicle_id'
            ).value = data.vehicle_id;

            document.getElementById(
                'edit_registration_number'
            ).value = data.registration_number;

            document.getElementById(
                'edit_make'
            ).value = data.make;

            document.getElementById(
                'edit_model'
            ).value = data.model;

            document.getElementById(
                'edit_year'
            ).value = data.vehicle_year;

            document.getElementById(
                'edit_color'
            ).value = data.color;

            document.getElementById(
                'edit_fuel_type'
            ).value = data.fuel_type;

            document.getElementById(
                'edit_capacity'
            ).value = data.capacity;

            document.getElementById(
                'edit_department'
            ).value = data.department;

            document.getElementById(
                'edit_status'
            ).value = data.status;

            document.getElementById(
                'edit_purchase_date'
            ).value = data.purchase_date;

            document.getElementById(
                'edit_notes'
            ).value = data.notes;

            new bootstrap.Modal(
                document.getElementById(
                    'editVehicleModal'
                )
            ).show();

        });

    });

});

</script>