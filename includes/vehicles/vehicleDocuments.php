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
            uploaded_file
        )
        VALUES
        (
            ?,?,?,?,?,?,?,?
        )
    ");

    $stmt->bind_param(
        "issssiss",
        $vehicle_id,
        $document_type,
        $document_number,
        $issue_date,
        $expiry_date,
        $reminder_days,
        $status,
        $uploadedFile
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

<div class="dash-card">
    <div class="dash-card-head">
        <h5><i class="fas fa-file-shield me-2"></i>Vehicle Documents</h5>
    </div>

    <div class="overview-stats mb-4">

        <div class="stat-box">
            <i class="fas fa-file-lines"></i>
            <strong><?= (int)$totalDocs ?></strong>
            <span>Total Documents</span>
        </div>

        <div class="stat-box">
            <i class="fas fa-circle-xmark"></i>
            <strong><?= (int)$expiredDocs ?></strong>
            <span>Expired</span>
        </div>

        <div class="stat-box">
            <i class="fas fa-triangle-exclamation"></i>
            <strong><?= (int)$expiringDocs ?></strong>
            <span>Expiring Soon</span>
        </div>

    </div>

    <div class="dash-card-head">
        <h5><i class="fas fa-plus me-2"></i>Add Document</h5>
    </div>

    <?= $message ?>

    <form method="POST" enctype="multipart/form-data">

        <div class="row">

            <div class="col-md-4 mb-3">

                <label class="form-label">Vehicle</label>

                <select name="vehicle_id" class="form-select" required>
                    <option value="">Select Vehicle</option>
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

                <label class="form-label">Document Type</label>

                <select name="document_type" class="form-select" required>
                    <option value="">Select Document</option>
                    <option>Vehicle Licence</option>
                    <option>Insurance</option>
                    <option>Fitness Certificate</option>
                    <option>Road Tax</option>
                    <option>Registration Book</option>
                    <option>Other</option>
                </select>

            </div>

            <div class="col-md-4 mb-3">

                <label class="form-label">Document Number</label>

                <input type="text" name="document_number" class="form-control" required>

            </div>

            <div class="col-md-3 mb-3">

                <label class="form-label">Issue Date</label>

                <input type="date" name="issue_date" class="form-control">

            </div>

            <div class="col-md-3 mb-3">

                <label class="form-label">Expiry Date</label>

                <input type="date" name="expiry_date" class="form-control" required>

            </div>

            <div class="col-md-3 mb-3">

                <label class="form-label">Reminder (days before expiry)</label>

                <input type="number" name="reminder_days" class="form-control" value="30" min="1">

            </div>

            <div class="col-md-3 mb-3">

                <label class="form-label">Document File</label>

                <input type="file" name="document_file" class="form-control" accept=".pdf,.jpg,.jpeg,.png">

            </div>

        </div>

        <button
            type="submit"
            class="btn text-white" style="background:var(--brand-orange,#F15A2C);"
            name="save_document">
            <i class="fas fa-save me-1"></i> Save Document
        </button>

    </form>

    <hr class="my-4">

    <div class="dash-card-head">
        <h5><i class="fas fa-clock-rotate-left me-2"></i>All Documents</h5>
    </div>

    <div class="table-responsive">
        <table class="mini-table">

            <thead>
                <tr>
                    <th>Vehicle</th>
                    <th>Type</th>
                    <th>Number</th>
                    <th>Issue Date</th>
                    <th>Expiry Date</th>
                    <th>Status</th>
                    <th>Document</th>
                </tr>
            </thead>

            <tbody>

                <?php if ($documents->num_rows === 0): ?>
                    <tr class="table-empty"><td colspan="7">No documents on file yet.</td></tr>
                <?php else: ?>
                    <?php while($row = $documents->fetch_assoc()): ?>
                        <tr>
                            <td><?= htmlspecialchars($row['registration_number']) ?></td>
                            <td><?= htmlspecialchars($row['document_type']) ?></td>
                            <td><?= htmlspecialchars($row['document_number']) ?></td>
                            <td><?= $row['issue_date'] ? date('d M Y', strtotime($row['issue_date'])) : '—' ?></td>
                            <td><?= date('d M Y', strtotime($row['expiry_date'])) ?></td>
                            <td>
                                <?php if ($row['status'] === 'Expired'): ?>
                                    <span class="mini-badge badge-delayed">Expired</span>
                                <?php elseif ($row['status'] === 'Expiring Soon'): ?>
                                    <span class="mini-badge badge-maintenance">Expiring Soon</span>
                                <?php else: ?>
                                    <span class="mini-badge badge-delivered">Valid</span>
                                <?php endif; ?>
                            </td>
                            <td>
                                <?php if (!empty($row['uploaded_file'])): ?>
                                    <a href="<?= htmlspecialchars($row['uploaded_file']) ?>" target="_blank" class="row-action" title="View document">
                                        <i class="fas fa-eye"></i>
                                    </a>
                                <?php else: ?>
                                    &mdash;
                                <?php endif; ?>
                            </td>
                        </tr>
                    <?php endwhile; ?>
                <?php endif; ?>

            </tbody>

        </table>
    </div>

</div>
