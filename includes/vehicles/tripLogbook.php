<?php

require_once 'php_action/db_connection.php';

$message = '';

/*
|--------------------------------------------------------------------------
| CREATE TRIP
|--------------------------------------------------------------------------
*/

if(isset($_POST['create_trip'])) {

    $vehicle_id         = (int)$_POST['vehicle_id'];
    $user_id            = (int)$_POST['user_id'];
    $destination        = trim($_POST['destination']);
    $purpose            = trim($_POST['purpose']);
    $departure_datetime = trim($_POST['departure_datetime']);
    $odometer_start     = (float)$_POST['odometer_start'];

    // Verify vehicle availability

    $check = $conn->prepare("
        SELECT status
        FROM vehicles
        WHERE vehicle_id = ?
    ");

    $check->bind_param("i", $vehicle_id);
    $check->execute();

    $vehicle = $check->get_result()->fetch_assoc();

    if(!$vehicle){

        $message =
        '<div class="alert alert-danger">
            Vehicle not found.
        </div>';

    } elseif($vehicle['status'] != 'Available') {

        $message =
        '<div class="alert alert-danger">
            Vehicle is not available for assignment.
        </div>';

    } else {

        $stmt = $conn->prepare("
            INSERT INTO vehicle_trips
            (
                vehicle_id,
                user_id,
                destination,
                purpose,
                departure_datetime,
                odometer_start,
                trip_status
            )
            VALUES
            (
                ?, ?, ?, ?, ?, ?, 'Active'
            )
        ");

        $stmt->bind_param(
            "iisssd",
            $vehicle_id,
            $user_id,
            $destination,
            $purpose,
            $departure_datetime,
            $odometer_start
        );

        if($stmt->execute()) {

            // Update vehicle status

            $updateVehicle = $conn->prepare("
                UPDATE vehicles
                SET status = 'On Trip'
                WHERE vehicle_id = ?
            ");

            $updateVehicle->bind_param(
                "i",
                $vehicle_id
            );

            $updateVehicle->execute();

            $message =
            '<div class="alert alert-success">
                Trip started successfully.
            </div>';

        } else {

            $message =
            '<div class="alert alert-danger">
                Failed to start trip.
            </div>';
        }
    }
}

/*
|--------------------------------------------------------------------------
| END TRIP
|--------------------------------------------------------------------------
*/

if(isset($_POST['end_trip'])) {

    $trip_id         = (int)$_POST['trip_id'];
    $return_datetime = $_POST['return_datetime'];
    $odometer_end    = (float)$_POST['odometer_end'];
    $remarks         = trim($_POST['remarks']);

    $tripQuery = $conn->prepare("
        SELECT
            vehicle_id,
            odometer_start
        FROM vehicle_trips
        WHERE trip_id = ?
    ");

    $tripQuery->bind_param(
        "i",
        $trip_id
    );

    $tripQuery->execute();

    $trip = $tripQuery
            ->get_result()
            ->fetch_assoc();

    if($trip){

        $distance =
            $odometer_end -
            $trip['odometer_start'];

        $updateTrip = $conn->prepare("
            UPDATE vehicle_trips
            SET
                return_datetime=?,
                odometer_end=?,
                distance_travelled=?,
                remarks=?,
                trip_status='Completed'
            WHERE trip_id=?
        ");

        $updateTrip->bind_param(
            "sddsi",
            $return_datetime,
            $odometer_end,
            $distance,
            $remarks,
            $trip_id
        );

        $updateTrip->execute();

        $vehicleUpdate = $conn->prepare("
            UPDATE vehicles
            SET status='Available'
            WHERE vehicle_id=?
        ");

        $vehicleUpdate->bind_param(
            "i",
            $trip['vehicle_id']
        );

        $vehicleUpdate->execute();

        $message =
        '<div class="alert alert-success">
            Trip completed successfully.
        </div>';
    }
}

/*
|--------------------------------------------------------------------------
| FETCH AVAILABLE VEHICLES
|--------------------------------------------------------------------------
*/

$vehicles = [];

$vQuery = $conn->query("
    SELECT
        vehicle_id,
        registration_number,
        make,
        model,
        status
    FROM vehicles
    WHERE status = 'Available'
    ORDER BY registration_number ASC
");

while($row = $vQuery->fetch_assoc()){
    $vehicles[] = $row;
}

/*
|--------------------------------------------------------------------------
| ACTIVE TRIPS
|--------------------------------------------------------------------------
*/

$activeTrips = [];

$activeQuery = $conn->query("
    SELECT
        vt.*,
        v.registration_number,
        v.make,
        v.model,
        CONCAT(u.name,' ',u.surname) AS driver_name
    FROM vehicle_trips vt

    INNER JOIN vehicles v
        ON vt.vehicle_id = v.vehicle_id

    INNER JOIN users u
        ON vt.user_id = u.user_id

    WHERE vt.trip_status = 'Active'

    ORDER BY vt.trip_id DESC
");

while($row = $activeQuery->fetch_assoc()) {

    $activeTrips[] = $row;
}

/*
|--------------------------------------------------------------------------
| TRIP HISTORY
|--------------------------------------------------------------------------
*/

$tripHistory = [];

$historyQuery = $conn->query("
    SELECT
        vt.*,
        v.registration_number,
        v.make,
        v.model,
        CONCAT(u.name,' ',u.surname) AS driver_name
    FROM vehicle_trips vt

    INNER JOIN vehicles v
        ON vt.vehicle_id = v.vehicle_id

    INNER JOIN users u
        ON vt.user_id = u.user_id

    WHERE vt.trip_status = 'Completed'

    ORDER BY vt.trip_id DESC
");

while($row = $historyQuery->fetch_assoc()){

    $tripHistory[] = $row;
}

/*
|--------------------------------------------------------------------------
| FETCH USERS
|--------------------------------------------------------------------------
*/

$users = [];

$uQuery = $conn->query("
    SELECT
        user_id,
        name,
        surname
    FROM users
    ORDER BY name ASC
");

while($row = $uQuery->fetch_assoc()){
    $users[] = $row;
}

?>

<div class="container-fluid">
    
    <?php

    $totalTrips =
    $conn->query("
        SELECT COUNT(*) total
        FROM vehicle_trips
    ")->fetch_assoc()['total'];
    
    $activeTripCount =
    $conn->query("
        SELECT COUNT(*) total
        FROM vehicle_trips
        WHERE trip_status='Active'
    ")->fetch_assoc()['total'];
    
    $totalDistance =
    $conn->query("
        SELECT IFNULL(
            SUM(distance_travelled),
            0
        ) total
        FROM vehicle_trips
    ")->fetch_assoc()['total'];
    
    ?>
    
    <div class="row mb-4">
    
        <div class="col-md-4">
    
            <div class="card border-0 shadow-sm">
    
                <div class="card-body">
    
                    <h6>Total Trips</h6>
    
                    <h2>
                        <?= $totalTrips ?>
                    </h2>
    
                </div>
    
            </div>
    
        </div>
    
        <div class="col-md-4">
    
            <div class="card border-0 shadow-sm">
    
                <div class="card-body">
    
                    <h6>Active Trips</h6>
    
                    <h2>
                        <?= $activeTripCount ?>
                    </h2>
    
                </div>
    
            </div>
    
        </div>
    
        <div class="col-md-4">
    
            <div class="card border-0 shadow-sm">
    
                <div class="card-body">
    
                    <h6>Total Distance</h6>
    
                    <h2>
                        <?= number_format($totalDistance,2) ?>
                        KM
                    </h2>
    
                </div>
    
            </div>
    
        </div>
    
    </div>

    <ul class="nav nav-tabs mb-4">

        <li class="nav-item">
            <button
                class="nav-link active"
                data-bs-toggle="tab"
                data-bs-target="#newTrip">

                New Trip

            </button>
        </li>

        <li class="nav-item">
            <button
                class="nav-link"
                data-bs-toggle="tab"
                data-bs-target="#activeTrips">

                Active Trips

            </button>
        </li>

        <li class="nav-item">
            <button
                class="nav-link"
                data-bs-toggle="tab"
                data-bs-target="#tripHistory">

                Trip History

            </button>
        </li>

    </ul>

    <div class="tab-content">

        <!-- ===================================================== -->
        <!-- NEW TRIP -->
        <!-- ===================================================== -->

        <div class="tab-pane fade show active"
             id="newTrip">

            <div class="card shadow-sm">

                <div class="card-header">

                    <h5 class="mb-0">

                        <i class="fas fa-route me-2"></i>

                        Create New Trip

                    </h5>

                </div>

                <div class="card-body">

                    <?= $message ?>

                    <form method="POST">

                        <div class="row">

                            <div class="col-md-6 mb-3">

                                <label class="form-label">
                                    Vehicle
                                </label>

                                <select
                                    name="vehicle_id"
                                    class="form-select"
                                    required>

                                    <option value="">
                                        Select Vehicle
                                    </option>

                                    <?php foreach($vehicles as $vehicle): ?>

                                    <option
                                        value="<?= $vehicle['vehicle_id'] ?>">

                                        <?= $vehicle['registration_number'] ?>
                                        -
                                        <?= $vehicle['make'] ?>
                                        <?= $vehicle['model'] ?>

                                    </option>

                                    <?php endforeach; ?>

                                </select>

                            </div>

                            <div class="col-md-6 mb-3">

                                <label class="form-label">
                                    Driver / Operator
                                </label>

                                <select
                                    name="user_id"
                                    class="form-select"
                                    required>

                                    <option value="">
                                        Select User
                                    </option>

                                    <?php foreach($users as $user): ?>

                                    <option
                                        value="<?= $user['user_id'] ?>">

                                        <?= $user['name'] ?>
                                        <?= $user['surname'] ?>

                                    </option>

                                    <?php endforeach; ?>

                                </select>

                            </div>

                            <div class="col-md-6 mb-3">

                                <label class="form-label">
                                    Destination
                                </label>

                                <input
                                    type="text"
                                    name="destination"
                                    class="form-control"
                                    required>

                            </div>

                            <div class="col-md-6 mb-3">

                                <label class="form-label">
                                    Departure Date & Time
                                </label>

                                <input
                                    type="datetime-local"
                                    name="departure_datetime"
                                    class="form-control"
                                    required>

                            </div>

                            <div class="col-md-12 mb-3">

                                <label class="form-label">
                                    Purpose
                                </label>

                                <textarea
                                    name="purpose"
                                    class="form-control"
                                    rows="3"></textarea>

                            </div>

                            <div class="col-md-4 mb-3">

                                <label class="form-label">
                                    Odometer Start
                                </label>

                                <input
                                    type="number"
                                    step="0.01"
                                    name="odometer_start"
                                    class="form-control"
                                    required>

                            </div>

                        </div>

                        <button
                            type="submit"
                            name="create_trip"
                            class="btn btn-success">

                            <i class="fas fa-save me-1"></i>

                            Start Trip

                        </button>

                    </form>

                </div>

            </div>

        </div>
        
        <div class="modal fade"
                 id="endTripModal">
            
            <div class="modal-dialog">
            
            <div class="modal-content">
            
            <form method="POST">
            
            <div class="modal-header">
            
            <h5>End Trip</h5>
            
            <button
            type="button"
            class="btn-close"
            data-bs-dismiss="modal">
            </button>
            
            </div>
            
            <div class="modal-body">
            
            <input
            type="hidden"
            name="trip_id"
            id="trip_id">
            
            <div class="mb-3">
            
            <label>
            Return Date & Time
            </label>
            
            <input
            type="datetime-local"
            name="return_datetime"
            class="form-control"
            required>
            
            </div>
            
            <div class="mb-3">
            
            <label>
            Odometer End
            </label>
            
            <input
            type="number"
            step="0.01"
            name="odometer_end"
            class="form-control"
            required>
            
            </div>
            
            <div class="mb-3">
            
            <label>
            Remarks
            </label>
            
            <textarea
            name="remarks"
            class="form-control"></textarea>
            
            </div>
            
            </div>
            
            <div class="modal-footer">
            
            <button
            name="end_trip"
            class="btn btn-success">
            
            Complete Trip
            
            </button>
            
            </div>
            
            </form>
            
            </div>
            
            </div>
            
        </div>

        <!-- ===================================================== -->
        <!-- ACTIVE TRIPS -->
        <!-- ===================================================== -->

        <div class="tab-pane fade"
             id="activeTrips">

            <div class="card shadow-sm">

                <div class="card-header">

                    Active Trips

                </div>

                <div class="card-body">

                    <table class="table table-bordered">

                        <thead>

                            <tr>

                                <th>Vehicle</th>
                                <th>Driver</th>
                                <th>Destination</th>
                                <th>Departure</th>
                                <th>Status</th>
                                <th>Action</th>

                            </tr>

                        </thead>

                        <tbody>

                            <?php foreach($activeTrips as $trip): ?>
                            
                            <tr>
                            
                                <td>
                            
                                    <?= $trip['registration_number'] ?>
                            
                                </td>
                            
                                <td>
                            
                                    <?= $trip['driver_name'] ?>
                            
                                </td>
                            
                                <td>
                            
                                    <?= htmlspecialchars($trip['destination']) ?>
                            
                                </td>
                            
                                <td>
                            
                                    <?= date(
                                        'd M Y H:i',
                                        strtotime($trip['departure_datetime'])
                                    ) ?>
                            
                                </td>
                            
                                <td>
                            
                                    <span class="badge bg-primary">
                            
                                        Active
                            
                                    </span>
                            
                                </td>
                            
                                <td>
                            
                                    <button
                                        class="btn btn-success btn-sm endTripBtn"
                                        data-id="<?= $trip['trip_id'] ?>">
                            
                                        End Trip
                            
                                    </button>
                            
                                </td>
                            
                            </tr>
                            
                            <?php endforeach; ?>
                            
                        </tbody>

                    </table>

                </div>

            </div>

        </div>
        
        

        <!-- ===================================================== -->
        <!-- TRIP HISTORY -->
        <!-- ===================================================== -->

        <div class="card-body">

            <input
                type="text"
                id="historySearch"
                class="form-control mb-3"
                placeholder="Search trips...">
        
            <table class="table table-striped table-bordered"
                   id="historyTable">
        
                <thead>
        
                    <tr>
        
                        <th>Vehicle</th>
                        <th>Driver</th>
                        <th>Destination</th>
                        <th>Departure</th>
                        <th>Return</th>
                        <th>Distance (KM)</th>
                        <th>Status</th>
        
                    </tr>
        
                </thead>
        
                <tbody>
        
                <?php foreach($tripHistory as $trip): ?>
        
                    <tr>
        
                        <td>
                            <?= $trip['registration_number'] ?>
                        </td>
        
                        <td>
                            <?= htmlspecialchars($trip['driver_name']) ?>
                        </td>
        
                        <td>
                            <?= htmlspecialchars($trip['destination']) ?>
                        </td>
        
                        <td>
                            <?= date(
                                'd M Y H:i',
                                strtotime($trip['departure_datetime'])
                            ) ?>
                        </td>
        
                        <td>
                            <?= date(
                                'd M Y H:i',
                                strtotime($trip['return_datetime'])
                            ) ?>
                        </td>
        
                        <td>
                            <?= number_format(
                                $trip['distance_travelled'],
                                2
                            ) ?>
                        </td>
        
                        <td>
                            <span class="badge bg-success">
                                Completed
                            </span>
                        </td>
        
                    </tr>
        
                <?php endforeach; ?>
        
                </tbody>
        
            </table>
        
        </div>


<script>
    document.querySelectorAll('.endTripBtn')
    .forEach(button => {
    
        button.addEventListener('click', function(){
    
            document.getElementById(
                'trip_id'
            ).value = this.dataset.id;
    
            new bootstrap.Modal(
                document.getElementById(
                    'endTripModal'
                )
            ).show();
    
        });
    
    });
    
    document.getElementById('historySearch')
    .addEventListener('keyup', function(){
    
        let value =
            this.value.toLowerCase();
    
        document.querySelectorAll(
            '#historyTable tbody tr'
        ).forEach(row => {
    
            row.style.display =
                row.innerText
                   .toLowerCase()
                   .includes(value)
                ? ''
                : 'none';
    
        });
    
    });
</script>