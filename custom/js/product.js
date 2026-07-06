var manageProductTable;

$("#navProduct").addClass('active');
//manage product data table
manageProductTable = $("#manageProductTable").DataTable({
	"pagingType": "simple_numbers",
  	"dom": '<"row mb-2"<"col-md-6"l><"col-md-6"f>>t<"row mt-2"<"col-md-6"i><"col-md-6"p>>',
	'ajax': 'php_action/fetchProduct.php',
	'order': []
});

//add product modal btn clicked
$("#addProductModalBtn").unbind('click').bind('click', function(){

	//product form reset
	$("#submitProductForm")[0].reset();

	$("#productImage").fileinput({
		overwriteInitial: true,
		maxFileSize: 2500,
		showClose: false,
		showCaption: false,
		browseLabel: 'Browse',
		removeLabel: 'Cancel',
		browseIcon: '<i class="fa fa-folder-open "></i>',
		removeIcon: '<i class="fa fa-times"></i>',
		removeTitle: 'Cancel or reset changes',
		elErrorContainer: '#kv-avatar-errors-1',
		msgErrorClass: 'alert alert-block alert-danger',
		defaultPreviewContent: '<img src="images/images.png" alt="Profile Image" style="width:150px; height:auto; display:block; margin:auto; border-radius:8px;">',
		layoutTemplates: {main2: '{preview} {remove} {browse}'},								    
		allowedFileExtensions: ["jpg", "png", "gif", "JPG", "PNG", "GIF"]
	}); 

	//submit product form
	$("#submitProductForm").unbind('submit').bind('submit', function(){
		
		// Remove previous error messages and validation styles
		$(".text-danger").remove();
		$("input, select, textarea").removeClass('is-invalid is-valid');
		
		var productImage = $("#productImage").val();
		var productName = $("#productName").val();
		var quantity = $("#quantity").val();
		var rate = $("#rate").val();
		var brandName = $("#brandName").val();
		var categoryName = $("#categoryName").val();
		var productStatus = $("#productStatus").val();

		if (productImage == "") {
			$("#productImage")
				.closest('.col-sm-9')
				.append('<p class="text-danger mt-1">Product Image field is required</p>');
			$("#productImage").addClass('is-invalid');
		} else {
			$("#productImage").removeClass('is-invalid').addClass('is-valid');
			$("#productImage").closest('.col-sm-9').find('.text-danger').remove();
		}

		if (productName == "") {
			$("#productName")
				.closest('.col-sm-9')
				.append('<p class="text-danger mt-1">Product Name field is required</p>');
			$("#productName").addClass('is-invalid');
		} else {
			$("#productName").removeClass('is-invalid').addClass('is-valid');
			$("#productName").closest('.col-sm-9').find('.text-danger').remove();
		}

		if (quantity == "") {
			$("#quantity")
				.closest('.col-sm-9')
				.append('<p class="text-danger mt-1">Quantity field is required</p>');
			$("#quantity").addClass('is-invalid');
		} else {
			$("#quantity").removeClass('is-invalid').addClass('is-valid');
			$("#quantity").closest('.col-sm-9').find('.text-danger').remove();
		}

		if (rate == "") {
			$("#rate")
				.closest('.col-sm-9')
				.append('<p class="text-danger mt-1">Amount/Size field is required</p>');
			$("#rate").addClass('is-invalid');
		} else {
			$("#rate").removeClass('is-invalid').addClass('is-valid');
			$("#rate").closest('.col-sm-9').find('.text-danger').remove();
		}

		if (brandName == "") {
			$("#brandName")
				.closest('.col-sm-9')
				.append('<p class="text-danger mt-1">Brand Name field is required</p>');
			$("#brandName").addClass('is-invalid');
		} else {
			$("#brandName").removeClass('is-invalid').addClass('is-valid');
			$("#brandName").closest('.col-sm-9').find('.text-danger').remove();
		}

		if (categoryName == "") {
			$("#categoryName")
				.closest('.col-sm-9')
				.append('<p class="text-danger mt-1">Category Name field is required</p>');
			$("#categoryName").addClass('is-invalid');
		} else {
			$("#categoryName").removeClass('is-invalid').addClass('is-valid');
			$("#categoryName").closest('.col-sm-9').find('.text-danger').remove();
		}

		if (productStatus == "") {
			$("#productStatus")
				.closest('.col-sm-9')
				.append('<p class="text-danger mt-1">Product Status field is required</p>');
			$("#productStatus").addClass('is-invalid');
		} else {
			$("#productStatus").removeClass('is-invalid').addClass('is-valid');
			$("#productStatus").closest('.col-sm-9').find('.text-danger').remove();
		}


		if (productImage && productName && quantity && rate && brandName && categoryName && productStatus) {
			// disable and show loading state on submit button
			$("#createProductBtn")
				.prop("disabled", true)
				.html('<i class="fa-solid fa-spinner fa-spin me-2"></i> Saving...');

			var form = $(this);
			var formData = new FormData(this);

			$.ajax({
				url: form.attr("action"),
				type: form.attr("method"),
				data: formData,
				dataType: "json",
				cache: false,
				contentType: false,
				processData: false,
				success: function (response) {
				// reset button state
				$("#createProductBtn")
					.prop("disabled", false)
					.html('<i class="fa-solid fa-check me-1"></i> Save Changes');

				if (response.success === true) {
					$("#submitProductForm")[0].reset();
					$("html, body, .modal, .modal-content, .modal-body").animate(
					{ scrollTop: 0 },
					100
					);

					// ✅ Bootstrap 5 success alert + Font Awesome 6 icon
					$("#add-product-messages").html(`
					<div class="alert alert-success alert-dismissible fade show mt-2" role="alert">
						<i class="fa-solid fa-circle-check me-2"></i>
						${response.messages}
						<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
					</div>
					`);

					// fade out success message after 3 seconds
					setTimeout(() => {
					$(".alert-success").fadeOut(500, function () {
						$(this).remove();
					});
					}, 3000);

					// reload product DataTable
					manageProductTable.ajax.reload(null, true);

					// clear validation states
					$(".text-danger").remove();
					$(".form-group").removeClass("has-error has-success");
				} else {
					// ❌ Bootstrap 5 error alert + Font Awesome 6 icon
					$("#add-product-messages").html(`
					<div class="alert alert-danger alert-dismissible fade show mt-2" role="alert">
						<i class="fa-solid fa-triangle-exclamation me-2"></i>
						${response.messages}
						<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
					</div>
					`);
				}
				},
			});
		}


		return false;
	})
		
});

$(document).ready(function() {
		   
}); // document.ready fucntion

//edit product
function editProduct(productId = null){

	// Remove previous error messages and validation styles
	$(".text-danger").remove();
	$("input, select, textarea").removeClass('is-invalid is-valid');

	if(productId){
		$.ajax({
			url: 'php_action/fetchSelectedProduct.php',
			type: 'post',
			data: {productId: productId},
			dataType: 'json',
			success: function(response){
				
				$("#getProductImage").attr(
				'src',
				response.data.product_image 
					? response.data.product_image 
					: 'images/images.png'
				);


				// ✅ Initialize file input (Krajee plugin)
				$("#editProductImage").fileinput({
				overwriteInitial: true,
				maxFileSize: 2500,
				showClose: false,
				showCaption: false,
				browseLabel: "Browse",
				removeLabel: "Cancel",
				browseIcon: '<i class="fa-solid fa-folder-open"></i>',
				removeIcon: '<i class="fa-solid fa-xmark"></i>',
				removeTitle: "Cancel or reset changes",
				elErrorContainer: "#kv-avatar-errors-1",
				msgErrorClass: "alert alert-block alert-danger",
				defaultPreviewContent:
					'<img src="images/images.png" alt="Profile Image" style="width:150px; height:auto; display:block; margin:auto; border-radius:8px;">',
				layoutTemplates: { main2: "{preview} {remove} {browse}" },
				allowedFileExtensions: ["jpg", "png", "gif", "jpeg", "webp"],
				});

				// ✅ Add hidden input for product ID
				$(".editProductPhotoFooter").append(
				'<input type="hidden" name="productId" id="productId" value="' +
					response.data.product_id +
					'"/>'
				);

				// ✅ Submit event for image update form
				$("#updateProductImageForm")
				.unbind("submit")
				.bind("submit", function (e) {
					e.preventDefault();

					const form = $(this);
					const productImage = $("#editProductImage").val();

					// ✅ Basic validation
					if (productImage === "") {
					$("#kv-avatar-errors-1").html(
						'<p class="text-danger">Please select an image to upload.</p>'
					);
					return false;
					}

					// ✅ AJAX submit with FormData for file upload
					const formData = new FormData(this);

					$.ajax({
					url: form.attr("action"),
					type: form.attr("method"),
					data: formData,
					processData: false,
					contentType: false,
					dataType: "json",
					success: function (response) {
						if (response.success) {
						// ✅ Show success checkmark effect
						$("#editProductImage")
							.closest(".file-input")
							.find(".file-preview")
							.append(
							'<div class="text-center mt-2 text-success"><i class="fa-solid fa-circle-check"></i> Saved</div>'
							);

						// ✅ Update preview image dynamically
						$("#getProductImage").attr("src", response.newImageUrl || response.data?.product_image);
						} else {
						$("#kv-avatar-errors-1").html(
							'<p class="text-danger">' + response.messages + "</p>"
						);
						}
					},
					error: function (xhr, status, error) {
						console.error("Upload failed:", error);
						$("#kv-avatar-errors-1").html(
						'<p class="text-danger">Error uploading image.</p>'
						);
					},
					});

					return false;
				});


				$('#editProductName').val(response.data.product_name);
				$('#editQuantity').val(response.data.quantity);
				$('#editRate').val(response.data.rate);
				$('#editBrandName').val(response.data.brand_id);
				$('#editCategoryName').val(response.data.categories_id);
				$('#editProductStatus').val(response.data.status);
				
				// then append new one
				$('.editProductFooter').append(
				'<input type="hidden" name="productId" id="productId" value="' + response.data.product_id + '"/>'
				);

				$("#editProductForm").unbind('submit').bind('submit', function(){

					// Remove previous error messages and validation styles
					$(".text-danger").remove();
					$("input, select, textarea").removeClass('is-invalid is-valid');
					
					var productName = $("#editProductName").val();
					var quantity = $("#editQuantity").val();
					var rate = $("#editRate").val();
					var brandName = $("#editBrandName").val();
					var categoryName = $("#editCategoryName").val();
					var productStatus = $("#editProductStatus").val();


					if (productName == "") {
						$("#editProductName")
							.closest('.col-sm-9')
							.append('<p class="text-danger mt-1">Amount/Size field is required</p>');
						$("#editProductName").addClass('is-invalid');
					} else {
						$("#editProductName").removeClass('is-invalid').addClass('is-valid');
						$("#editProductName").closest('.col-sm-9').find('.text-danger').remove();
					}

					if (quantity == "") {
						$("#editQuantity")
							.closest('.col-sm-9')
							.append('<p class="text-danger mt-1">Amount/Size field is required</p>');
						$("#editQuantity").addClass('is-invalid');
					} else {
						$("#editQuantity").removeClass('is-invalid').addClass('is-valid');
						$("#editQuantity").closest('.col-sm-9').find('.text-danger').remove();
					}

					if (rate == "") {
						$("#editRate")
							.closest('.col-sm-9')
							.append('<p class="text-danger mt-1">Amount/Size field is required</p>');
						$("#editRate").addClass('is-invalid');
					} else {
						$("#editRate").removeClass('is-invalid').addClass('is-valid');
						$("#editRate").closest('.col-sm-9').find('.text-danger').remove();
					}

					if (productStatus == "") {
						$("#editProductStatus")
							.closest('.col-sm-9')
							.append('<p class="text-danger mt-1">Amount/Size field is required</p>');
						$("#editProductStatus").addClass('is-invalid');
					} else {
						$("#editProductStatus").removeClass('is-invalid').addClass('is-valid');
						$("#editProductStatus").closest('.col-sm-9').find('.text-danger').remove();
					}

					if (productName && quantity && rate && brandName && categoryName && productStatus) {
						var form = $(this)

						$.ajax({
							url:form.attr('action'),
							type: form.attr('method'),
							data: form.serialize(),
							dataType: 'json',
							success: function(response){
								if(response.success == true){
									$("html, body, .modal, .modal-content, .modal-body").animate(
									{ scrollTop: 0 },
									100
									);
 
									$("#edit-product-messages").html(`
									<div class="alert alert-success alert-dismissible fade show mt-2" role="alert">
										<i class="fa-solid fa-circle-check me-2"></i>
										${response.messages}
										<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
									</div>
									`);

									manageProductTable.ajax.reload(null, true);

									// Remove previous error messages and validation styles
									$(".text-danger").remove();
									$("input, select, textarea").removeClass('is-invalid is-valid');
								}  
							}
						});	
					}
					return false;
				});
			}
		})
	}
}

// Remove Product 
function removeProduct(productId = null) {
  if (productId) {
    // remove product button clicked
    $("#removeProductBtn").unbind('click').bind('click', function () {

      // disable button + show spinner
      const $btn = $("#removeProductBtn");
      $btn.prop("disabled", true)
        .html('<i class="fa-solid fa-spinner fa-spin"></i> Removing...');

      $.ajax({
        url: 'php_action/removeProduct.php',
        type: 'post',
        data: { productId: productId },
        dataType: 'json',
        success: function (response) {

          // re-enable button
          $btn.prop("disabled", false)
            .html('<i class="fa-solid fa-check"></i> Save changes');

          if (response.success === true) {
            // close modal
            $("#removeProductModal").modal('hide');

            // reload DataTable
            manageProductTable.ajax.reload(null, false);

            // show success alert
            $(".remove-messages").html(`
              <div class="alert alert-success alert-dismissible fade show" role="alert">
                <i class="fa-solid fa-circle-check"></i> ${response.messages}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
              </div>
            `);

          } else {
            // show error alert
            $(".removeProductMessages").html(`
              <div class="alert alert-danger alert-dismissible fade show" role="alert">
                <i class="fa-solid fa-triangle-exclamation"></i> ${response.messages}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
              </div>
            `);
          }

          // auto-hide alerts
          $(".alert").delay(500).show(10, function () {
            $(this).delay(3000).fadeOut(400, function () {
              $(this).remove();
            });
          });

        } // /success
      }); // /ajax
      return false;
    }); // /remove product btn clicked
  } // /if productId
} // /remove product function


$.fn.dataTable.ext.errMode = 'none';


