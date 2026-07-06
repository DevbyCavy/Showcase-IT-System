var manageBrandTable;

$(document).ready(function() {

    // Highlight the Brand nav item
    $("#navBrand").addClass("active");

    // Initialize the DataTable
    manageBrandTable = $("#manageBrandTable").DataTable({
        'ajax': 'php_action/fetchBrand.php',
		'order': []	
    });

    // Submit Brand Form via AJAX
    $("#submitBrandForm").on('submit', function(e) {
        e.preventDefault(); // prevent default form submit

        // Remove old validation messages and reset input states
        $(".invalid-feedback").remove();
        $("#brandName, #brandStatus").removeClass("is-invalid is-valid");

        var form = $(this);
        var brandName = $("#brandName").val().trim();
        var brandStatus = $("#brandStatus").val().trim();
        var isValid = true;

        // Validate brand name
        if (brandName === "") {
            $("#brandName").addClass("is-invalid")
                .after('<div class="invalid-feedback">Brand Name field is required</div>');
            isValid = false;
        } else {
            $("#brandName").addClass("is-valid");
        }

        // Validate brand status
        if (brandStatus === "") {
            $("#brandStatus").addClass("is-invalid")
                .after('<div class="invalid-feedback">Status field is required</div>');
            isValid = false;
        } else {
            $("#brandStatus").addClass("is-valid");
        }

        // Only proceed with AJAX if form is valid
        if (isValid) {
            var $btn = $("#createBrandBtn");

            // Disable button and show loading
            $btn.prop("disabled", true).text("Loading...");

            $.ajax({
                url: form.attr('action'),
                type: form.attr('method'),
                data: form.serialize(),
                dataType: 'json',
                success: function(response) {
                    // Reset button
                    $btn.prop("disabled", false).text("Save Changes");

                    // Show message box modal
                    var msgTitle = response.success ? "Success" : "Error";
                    var msgBody = response.messages;

                    $("#messageBoxTitle").text(msgTitle);
                    $("#messageBoxBody").html(msgBody);
                    var msgModal = new bootstrap.Modal(document.getElementById('messageBoxModal'));
                    msgModal.show();

                    if (response.success) {
                        // Reload DataTable
                        manageBrandTable.ajax.reload(null, false);

                        // Reset form fields and validation
                        form[0].reset();
                        $("#brandName, #brandStatus").removeClass("is-valid is-invalid");
                    }
                },
                error: function() {
                    // Handle AJAX errors
                    $("#messageBoxTitle").text("Error");
                    $("#messageBoxBody").html("An unexpected error occurred.");
                    var msgModal = new bootstrap.Modal(document.getElementById('messageBoxModal'));
                    msgModal.show();

                    $btn.prop("disabled", false).text("Save Changes");
                }
            });
        }

    });


});

function editBrands(brandId = null) {
    if (!brandId) {
        alert('Error! Refresh the page and try again.');
        return;
    }

    // Remove hidden brandId if it exists
    $('#brandId').remove();

    // Reset form states
    $(".invalid-feedback").remove();
    $("#editBrandName, #editBrandStatus").removeClass("is-valid is-invalid");

    // Show loading
    $('.modal-loading').removeClass('d-none');
    $('.edit-brand-result, .editBrandFooter').addClass('d-none');

    $.ajax({
        url: 'php_action/fetchSelectedBrand.php',
        type: 'POST',
        data: { brandId: brandId },
        dataType: 'json',
        success: function(response) {
            if (response.error) {
                alert(response.message || "Failed to fetch brand details.");
                return;
            }

            // Hide loading, show form
            $('.modal-loading').addClass('d-none');
            $('.edit-brand-result, .editBrandFooter').removeClass('d-none');

            // Fill form values
            $('#editBrandName').val(response.brand_name);
            $('#editBrandStatus').val(response.brand_active);

            // Add hidden brandId
            $(".editBrandFooter").after(
                `<input type="hidden" name="brandId" id="brandId" value="${response.brand_id}">`
            );

            // Handle form submit
            $('#editBrandForm').off('submit').on('submit', function(e) {
                e.preventDefault();

                // Reset validation
                $(".invalid-feedback").remove();
                $("#editBrandName, #editBrandStatus").removeClass("is-invalid is-valid");

                let brandName = $('#editBrandName').val().trim();
                let brandStatus = $('#editBrandStatus').val().trim();
                let isValid = true;

                // Validate brandName
                if (!brandName) {
                    $("#editBrandName").addClass("is-invalid")
                        .after('<div class="invalid-feedback">Brand name is required</div>');
                    isValid = false;
                } else {
                    $("#editBrandName").addClass("is-valid");
                }

                // Validate brandStatus
                if (!brandStatus) {
                    $("#editBrandStatus").addClass("is-invalid")
                        .after('<div class="invalid-feedback">Status is required</div>');
                    isValid = false;
                } else {
                    $("#editBrandStatus").addClass("is-valid");
                }

                if (!isValid) return;

                // Button loading state
                let $btn = $('#editBrandBtn');
                $btn.prop("disabled", true).html('<i class="fa-solid fa-spinner fa-spin"></i> Saving...');

                $.ajax({
                    url: $(this).attr('action'),
                    type: $(this).attr('method'),
                    data: $(this).serialize(),
                    dataType: 'json',
                    success: function(res) {
                        $btn.prop("disabled", false).html('<i class="fa-solid fa-check"></i> Save Changes');

                        if (res.success) {
                            // Reload DataTable
                            manageBrandTable.ajax.reload(null, false);

                            // Reset form validation
                            $("#editBrandName, #editBrandStatus").removeClass("is-valid is-invalid");

                            // Show success alert
                            $('#edit-brand-messages').html(`
                                <div class="alert alert-success alert-dismissible fade show" role="alert">
                                    <i class="fa-solid fa-circle-check"></i> ${res.messages}
                                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                                </div>
                            `);
                        } else {
                            $('#edit-brand-messages').html(`
                                <div class="alert alert-danger alert-dismissible fade show" role="alert">
                                    <i class="fa-solid fa-triangle-exclamation"></i> ${res.messages}
                                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                                </div>
                            `);
                        }
                    },
                    error: function() {
                        $btn.prop("disabled", false).html('<i class="fa-solid fa-check"></i> Save Changes');
                        alert('An unexpected error occurred. Please try again.');
                    }
                });
            });
        },
        error: function() {
            alert("Failed to fetch brand details. Please refresh and try again.");
        }
    });
}


function removeBrands(brandId = null) {
    if (!brandId) {
        alert('Error! Refresh the page and try again.');
        return;
    }

    // Remove old hidden input if exists
    $('#removeBrandId').remove();

    // Fetch selected brand details (optional, for confirmation)
    $.ajax({
        url: 'php_action/fetchSelectedBrand.php',
        type: 'POST',
        data: { brandId: brandId },
        dataType: 'json',
        success: function(response) {

            // Add hidden input to modal
            $('.removeBrandFooter').after(`
                <input type="hidden" name="removeBrandId" id="removeBrandId" value="${response.brand_id}" />
            `);

            // Bind click event to Remove button
            $("#removeBrandBtn").unbind('click').bind('click', function() {
                let $btn = $(this);
                $btn.prop("disabled", true).html('<i class="fa-solid fa-spinner fa-spin"></i> Removing...');

                $.ajax({
                    url: 'php_action/removeBrand.php',
                    type: 'POST',
                    data: { brandId: brandId },
                    dataType: 'json',
                    success: function(response) {
                        $btn.prop("disabled", false).html('<i class="fa-solid fa-check"></i> Remove');

                        if (response.success) {
                            // Hide modal
                            let removeModal = bootstrap.Modal.getInstance(document.getElementById('removeBrandModal'));
                            if(removeModal) removeModal.hide();

                            // Reload DataTable
                            manageBrandTable.ajax.reload(null, false);

                            // Show message
                            let alertBox = `
                                <div class="alert alert-success alert-dismissible fade show" role="alert">
                                    <i class="fa-solid fa-circle-check"></i> ${response.messages}
                                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                                </div>`;
                            $('.remove-messages').html(alertBox);
                        }
                    },
                    error: function() {
                        $btn.prop("disabled", false).html('<i class="fa-solid fa-check"></i> Remove');
                        alert('An unexpected error occurred. Please try again.');
                    }
                });
            });
        },
        error: function() {
            alert('Failed to fetch brand details. Please refresh and try again.');
        }
    });
}


