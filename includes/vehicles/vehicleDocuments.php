<?php

require_once __DIR__ . '/../../php_action/db_connection.php';

$message = '';

$uploadedFile = '';

if(isset($_FILES['document_file']) &&
   $_FILES['document_file']['error'] == 0){

    $allowed = [
        'pdf',
        'jpg',
        'jpeg',
        'png'
    ];

    $ext = strtolower(
        pathinfo(
            $_FILES['document_file']['name'],
            PATHINFO_EXTENSION
        )
    );
    
    $uploadDir = __DIR__ . '/../../uploads/vehicle_documents/';
    
    if(in_array($ext,$allowed)){

        $fileName = time().'_'.$_FILES['document_file']['name'];

        move_uploaded_file(
            $_FILES['document_file']['tmp_name'],
            $uploadDir . $fileName
        );



        $destination =
        'uploads/vehicle_documents/'.
        $fileName;

        move_uploaded_file(
            $_FILES['document_file']['tmp_name'],
            $destination
        );

        $uploadedFile = 'uploads/vehicle_documents/' . $fileName;
        
    }
}

if(isset($_POST['save_document'])){

    $vehicle_id      = (int)$_POST['vehicle_id'];
    $document_type   = trim($_POST['document_type']);
    $document_number = trim($_POST['document_number']);
    $issue_date      = $_POST['issue_date'];
    $expiry_date     = $_POST['expiry_date'];
    $reminder_days   = (int)$_POST['reminder_days'];
    $notes           = trim($_POST['notes']);

    $status = 'Valid';

    if(strtotime($expiry_date) < time()){

        $status = 'Expired';

    } elseif(
        strtotime($expiry_date)
        <= strtotime("+{$reminder_days} days")
    ){

        $status = 'Expiring Soon';
    }

    $stmt = $conn->prepare("
        INSERT INTO vehicle_documents
        (
            vehicle_id,
            document_type,
            document_number,
            issue_date,
            expiry_date,
            reminder_days,
            status,
            uploaded_file,
            notes
        )
        VALUES
        (
            ?,?,?,?,?,?,?,?,?
        )
    ");

    $stmt->bind_param(
        "issssisss",
        $vehicle_id,
        $document_type,
        $document_number,
        $issue_date,
        $expiry_date,
        $reminder_days,
        $status,
        $uploadeFile,
        $notes
    );

    if($stmt->execute()){

        $message =
        '<div class="alert alert-success">
            Document saved successfully.
        </div>';

    }else{

        $message =
        '<div class="alert alert-danger">
            Failed to save document.
        </div>';
    }
}

if($daysRemaining < 0){

    echo '<span class="badge bg-danger">
            Expired '.abs($daysRemaining).' Days Ago
          </span>';

}
elseif($daysRemaining <= 30){

    echo '<span class="badge bg-warning">
            '.$daysRemaining.' Days Left
          </span>';

}
else{

    echo '<span class="badge bg-success">
            '.$daysRemaining.' Days Left
          </span>';
}


?>


<?php

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
?>

<?php

$totalDocs =
$conn->query("
SELECT COUNT(*) total
FROM vehicle_documents
")->fetch_assoc()['total'];

$expiredDocs =
$conn->query("
SELECT COUNT(*) total
FROM vehicle_documents
WHERE status='Expired'
")->fetch_assoc()['total'];

$expiringDocs =
$conn->query("
SELECT COUNT(*) total
FROM vehicle_documents
WHERE status='Expiring Soon'
")->fetch_assoc()['total'];

?>

<?php

$documents = $conn->query("
SELECT
    d.*,
    v.registration_number
FROM vehicle_documents d
INNER JOIN vehicles v
ON d.vehicle_id = v.vehicle_id
ORDER BY d.expiry_date ASC
");
?>


<!DOCTYPE html>
<html lang="en">
<head>

<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">

<title>Logistics Management</title>

<link rel="stylesheet" href="/../../assets/bootstrap/css/bootstrap.min.css">
<link rel="stylesheet" href="/../../assets/font-awesome/css/all.min.css">

<style>

body{
    background:#f5f6fa;
    margin: 10px 20px;
}

.module-card{
    border:none;
    border-radius:12px;
    box-shadow:0 3px 12px rgba(0,0,0,.08);
}

.modern-tabs{
    border-bottom:none;
}

.modern-tab-btn{
    border:none !important;
    margin-right:5px;
    border-radius:10px 10px 0 0 !important;
    background:#e9ecef;
    color:#333;
    font-weight:600;
}

.modern-tab-btn.active{
    background:#ff7b00 !important;
    color:#fff !important;
}

</style>

</head>

<?php include 'includes/headerLogistics.php'; ?>

<body>


    
<!-- Breadcrumb -->

<div class="card module-card mb-3">

    <div class="card-body">

        <nav aria-label="breadcrumb">

            <ol class="breadcrumb mb-0">

                <li class="breadcrumb-item">
                    <a href="dashboard.php">Home</a>
                </li>

                <li class="breadcrumb-item active">
                    Fuel Log
                </li>

            </ol>

        </nav>

    </div>

</div>

<!-- Page Title -->

<h3 class="fw-bold mb-3">

    <i class="fas fa-truck me-2"></i>

    Fuel Log

</h3>


<div class="row mb-4">

<div class="col-md-4">
<div class="card shadow-sm">
<div class="card-body">

<h6>Total Documents</h6>
<h3><?= $totalDocs ?></h3>

</div>
</div>
</div>

<div class="col-md-4">
<div class="card shadow-sm">
<div class="card-body">

<h6>Expired</h6>
<h3 class="text-danger">
<?= $expiredDocs ?>
</h3>

</div>
</div>
</div>

<div class="col-md-4">
<div class="card shadow-sm">
<div class="card-body">

<h6>Expiring Soon</h6>
<h3 class="text-warning">
<?= $expiringDocs ?>
</h3>

</div>
</div>
</div>

</div>

<form method="POST" enctype="multipart/form-data">

    <select name="document_type" class="form-select" required>
        <option value="">Select Document</option>
        <option>Vehicle License</option>
        <option>Insurance</option>
        <option>Fitness Certificate</option>
        <option>Radio License</option>
        <option>Other</option>
    </select>

    <button class="btn btn-primary mt-2" name="save_document">
        Save Document
    </button>

</form>

<table class="table table-bordered table-striped">

    <thead>
        
        <tr>
        
            <th>Vehicle</th>
            <th>Type</th>
            <th>Number</th>
            <th>Issue Date</th>
            <th>Expiry Date</th>
            <th>Status</th>
            <th>Document</th>
            <th>Actions</th>
        
        </tr>
    
    </thead>
    
    <tbody>
    
        <?php while($row = $documents->fetch_assoc()): ?>
        
        <?php

            $daysRemaining =
            floor(
                (
                    strtotime($row['expiry_date'])
                    -
                    time()
                )
                / 86400
            );
        
        ?>
        
        <tr>

            <td><?= $row['registration_number'] ?></td>
        
            <td><?= $row['document_type'] ?></td>
        
            <td><?= $row['document_number'] ?></td>
        
            <td><?= $row['issue_date'] ?></td>
        
            <td><?= $row['expiry_date'] ?></td>
        
            <td>
                <?php
                if ($row['status'] == 'Expired') {
                    echo '<span class="badge bg-danger">Expired</span>';
                } elseif ($row['status'] == 'Expiring Soon') {
                    echo '<span class="badge bg-warning">Expiring Soon</span>';
                } else {
                    echo '<span class="badge bg-success">Valid</span>';
                }
                ?>
            </td>
        
            <td>
                <?php if (!empty($row['uploaded_file'])): ?>
                    <a href="<?= $row['uploaded_file'] ?>" target="_blank" class="btn btn-sm btn-primary">
                        View
                    </a>
                <?php endif; ?>
            </td>
        
            <td>
                <a href="renewDocument.php?id=<?= $row['document_id'] ?>" class="btn btn-sm btn-warning">
                    Renew
                </a>
            </td>
        
        </tr>
        
        <?php endwhile; ?>
        
    </tbody>

</table>



<script src="/assets/bootstrap/js/bootstrap.bundle.min.js"></script>

</body>
</html>