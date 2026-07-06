var manageCategoriesTable;

$(document).ready(function(){
    $("#navCategories").addClass('active');

    manageCategoriesTable = $('#manageCategoriesTable').DataTable({
        'ajax' : 'php_action/fetchCategories.php',
		'order': []
    });

        // on click on submit categories form modal
        $('#addCategoriesModalBtn').unbind('click').bind('click', function() {
        // reset the form
        $("#submitCategoriesForm")[0].reset();
        $(".text-danger").remove();
        $('.form-group').removeClass('has-error has-success');

        // submit categories form
        $("#submitCategoriesForm").unbind('submit').bind('submit', function() {
            var categoryName = $("#categoryName").val();
            var categoryStatus = $("#categoryStatus").val();

            // validate Category Name
            if(categoryName == "") {
                $("#categoryName").after('<p class="text-danger">Category Name field is required</p>');
                $('#categoryName').closest('.form-group').addClass('has-error');
            } else {
                $("#categoryName").find('.text-danger').remove();
                $("#categoryName").closest('.form-group').addClass('has-success');	  	
            }

            // validate Status
            if(categoryStatus == "") {
                $("#categoryStatus").after('<p class="text-danger">Status field is required</p>');
                $('#categoryStatus').closest('.form-group').addClass('has-error');
            } else {
                $("#categoryStatus").find('.text-danger').remove();
                $("#categoryStatus").closest('.form-group').addClass('has-success');	  	
            }

            if(categoryName && categoryStatus) {
                var form = $(this);
                $("#createCategoryBtn").prop('disabled', true).text('Saving...');

                $.ajax({
                    url : form.attr('action'),
                    type: form.attr('method'),
                    data: form.serialize(),
                    dataType: 'json',
                    success:function(response) {
                        $("#createCategoryBtn").prop('disabled', false).text('Save Changes');

                        if(response.success === true) {
                            manageCategoriesTable.ajax.reload(null, false);

                            $("#submitCategoriesForm")[0].reset();
                            $(".text-danger").remove();
                            $('.form-group').removeClass('has-error has-success');
                            
                            $('#add-category-messages').html(`
                                <div class="alert alert-success">
                                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                                    <strong><i class="fa fa-check"></i></strong> ${response.messages}
                                </div>
                            `);
                        }
                    }
                });
            }

            return false;
        });

    });

});

function removeCategories(categoriesId = null) {
    if (!categoriesId) {
        alert('Error! Refresh the page and try again.');
        return;
    }

    // Remove old hidden input if exists
    $('#removeCategoriesId').remove();

    // Fetch selected category details (optional, for confirmation)
    $.ajax({
        url: 'php_action/fetchSelectedCategories.php',
        type: 'POST',
        data: { categoriesId: categoriesId },
        dataType: 'json',
        success: function(response) {

            // Add hidden input to modal
            $('.removeCategoriesFooter').after(`
                <input type="hidden" name="removeCategoriesId" id="removeCategoriesId" value="${response.categories_id}" />
            `);

            // Bind click event to Remove button
            $("#removeCategoriesBtn").unbind('click').bind('click', function() {
                let $btn = $(this);
                $btn.prop("disabled", true).html('<i class="fa-solid fa-spinner fa-spin"></i> Removing...');

                $.ajax({
                    url: 'php_action/removeCategories.php',
                    type: 'POST',
                    data: { categoriesId: categoriesId },
                    dataType: 'json',
                    success: function(response) {
                        $btn.prop("disabled", false).html('<i class="fa-solid fa-check"></i> Remove');

                        if (response.success) {
                            // Hide modal
                            let removeModal = bootstrap.Modal.getInstance(document.getElementById('removeCategoriesModal'));
                            if(removeModal) removeModal.hide();

                            // Reload DataTable
                            manageCategoriesTable.ajax.reload(null, false);

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
            alert('Failed to fetch category details. Please refresh and try again.');
        }
    });
}


// Edit category function
function editCategories(categoriesId = null) {
  if (!categoriesId) {
    alert('Oops! Refresh the page and try again.');
    return;
  }

  // Reset form and UI
  $('#editCategoriesId').remove();
  $("#editCategoriesForm")[0].reset();
  $(".text-danger").remove();
  $(".form-group, .mb-3").removeClass('has-error has-success');
  $("#edit-categories-messages").html("");
  $(".modal-loading").removeClass('d-none');
  $(".edit-categories-result").addClass('d-none');
  $(".editCategoriesFooter").addClass('d-none');

  // Fetch the selected category details
  $.ajax({
    url: 'php_action/fetchSelectedCategories.php',
    type: 'POST',
    data: { categoriesId: categoriesId },
    dataType: 'json',
    success: function (response) {
      // Hide loader, show form
      $(".modal-loading").addClass('d-none');
      $(".edit-categories-result").removeClass('d-none');
      $(".editCategoriesFooter").removeClass('d-none');

      if (!response || !response.categories_id) {
        $("#edit-categories-messages").html(
          `<div class="alert alert-danger">
            <i class="fas fa-exclamation-circle me-2"></i> Failed to load category details. Please refresh and try again.
          </div>`
        );
        return;
      }

      // Fill form with data
      $("#editCategoriesName").val(response.categories_name);
      $("#editCategoriesStatus").val(response.categories_active);
      $(".editCategoriesFooter").after(
        `<input type="hidden" name="editCategoriesId" id="editCategoriesId" value="${response.categories_id}" />`
      );

      // Show modal if not already open
      const modal = new bootstrap.Modal(document.getElementById('editCategoriesModel'));
      modal.show();

      // Handle form submission
      $("#editCategoriesForm").off('submit').on('submit', function (e) {
        e.preventDefault();

        const categoriesName = $("#editCategoriesName").val().trim();
        const categoriesStatus = $("#editCategoriesStatus").val();

        let isValid = true;

        if (categoriesName === "") {
          $("#editCategoriesName")
            .after('<div class="text-danger small mt-1">Category Name is required.</div>');
          isValid = false;
        }

        if (categoriesStatus === "") {
          $("#editCategoriesStatus")
            .after('<div class="text-danger small mt-1">Status is required.</div>');
          isValid = false;
        }

        if (!isValid) return;

        // Disable button while submitting
        const $btn = $("#editCategoriesBtn");
        $btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin me-2"></i> Saving...');

        $.ajax({
          url: $(this).attr('action'),
          type: $(this).attr('method'),
          data: $(this).serialize(),
          dataType: 'json',
          success: function (response) {
            $btn.prop('disabled', false).html('<i class="fas fa-check me-2"></i> Save Changes');

            if (response.success) {
              // Refresh table
              if (typeof manageCategoriesTable !== "undefined") {
                manageCategoriesTable.ajax.reload(null, false);
              }

              // Success message
              $("#edit-categories-messages").html(`
                <div class="alert alert-success alert-dismissible fade show" role="alert">
                  <i class="fas fa-check-circle me-2"></i> ${response.messages}
                  <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
              `);

              setTimeout(() => modal.hide(), 2000);
            } else {
              $("#edit-categories-messages").html(`
                <div class="alert alert-danger alert-dismissible fade show" role="alert">
                  <i class="fas fa-exclamation-circle me-2"></i> ${response.messages || "Update failed."}
                  <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
              `);
            }
          },
          error: function () {
            $btn.prop('disabled', false).html('<i class="fas fa-check me-2"></i> Save Changes');
            $("#edit-categories-messages").html(`
              <div class="alert alert-danger alert-dismissible fade show" role="alert">
                <i class="fas fa-exclamation-circle me-2"></i> Something went wrong. Please try again.
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
              </div>
            `);
          },
        });
      });
    },
    error: function () {
      $(".modal-loading").addClass('d-none');
      $("#edit-categories-messages").html(
        `<div class="alert alert-danger">
          <i class="fas fa-exclamation-circle me-2"></i> Failed to fetch category details. Please refresh and try again.
        </div>`
      );
    },
  });
}
