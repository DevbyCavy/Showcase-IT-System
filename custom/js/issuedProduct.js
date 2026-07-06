// Open Issue Modal and autofill tool name
function openIssueModal(productId, productName) {
  // Fill product info
  document.getElementById('issue_product_id').value = productId;
  document.querySelector('[name="tool_name"]').value = productName;

  // Show the modal
  const modal = new bootstrap.Modal(document.getElementById('issueProductModal'));
  modal.show();
}


// Submit Issue Form via AJAX
document.getElementById('issueProductForm').addEventListener('submit', function(e){
    e.preventDefault();

    const formData = new FormData(this);
    const productId = formData.get('product_id');
    const quantityEl = document.getElementById(`qty-${productId}`);
    const currentQty = parseInt(quantityEl.textContent);

    fetch('php_action/issueProduct.php', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            // Update quantity on the card
            quantityEl.textContent = currentQty - parseInt(formData.get('quantity_issued'));
            // Close modal
            var modal = bootstrap.Modal.getInstance(document.getElementById('issueProductModal'));
            modal.hide();
            alert('✅ Product issued successfully!');
        } else {
            alert('⚠️ ' + data.message);
        }
    })
    .catch(err => console.error(err));
});

// 🔹 Quantity adjuster
function adjustQuantity(productId, delta) {
    let qtyEl = document.getElementById(`qty-${productId}`);
    let currentQty = parseInt(qtyEl.textContent);
    let newQty = currentQty + delta;
    if (newQty < 0) newQty = 0;

    qtyEl.textContent = newQty;

    // Save update in DB via AJAX
    fetch('php_action/updateQuantity.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: productId, newQuantity: newQty })
    })
    .then(res => res.json())
    .then(data => {
        if (!data.success) {
            alert('⚠️ Failed to update quantity');
            qtyEl.textContent = currentQty;
        }
    })
    .catch(err => {
        console.error('Error:', err);
        qtyEl.textContent = currentQty;
    });
}

// 🔹 Live Search Filter
document.getElementById("productSearch").addEventListener("keyup", function() {
  const searchText = this.value.toLowerCase();
  const productCards = document.querySelectorAll(".product-card");

  productCards.forEach(card => {
    const text = card.textContent.toLowerCase();
    card.style.display = text.includes(searchText) ? "" : "none";
  });
});


document.addEventListener("DOMContentLoaded", function() {
  const issueForm = document.getElementById("issueProductForm");
  const messageBox = $("#issue-product-message"); // jQuery handle for consistency

  issueForm.addEventListener("submit", function(e) {
    e.preventDefault();
    let isValid = true;
    messageBox.html(""); // clear old messages

    // Clear previous warnings
    issueForm.querySelectorAll(".invalid-feedback").forEach(el => el.textContent = "");

    // Collect required fields (date_of_return excluded)
    const fields = {
      date_of_collection: issueForm.querySelector("[name='date_of_collection']"),
      collector_name: issueForm.querySelector("[name='collector_name']"),
      tool_name: issueForm.querySelector("[name='tool_name']"),
      quantity_issued: issueForm.querySelector("[name='quantity_issued']"),
      job_name: issueForm.querySelector("[name='job_name']")
    };

    // Validate each field
    Object.entries(fields).forEach(([key, input]) => {
      if (!input.value.trim()) {
        const feedback = input.parentElement.querySelector(".invalid-feedback");
        if (feedback) feedback.textContent = "This field is required.";
        isValid = false;
      }
    });

    // Stop if invalid
    if (!isValid) {
      messageBox.html(`
        <div class="alert alert-warning alert-dismissible fade show mt-2" role="alert">
          <i class="fa-solid fa-triangle-exclamation me-2"></i>
          Please fill in all required fields before saving.
          <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      `);
      return;
    }

    // Submit form if valid
    const formData = new FormData(issueForm);

    fetch("php_action/issueProduct.php", {
      method: "POST",
      body: formData
    })
    .then(res => res.json())
    .then(data => {
      const alertClass = data.success ? "alert-success" : "alert-danger";
      const icon = data.success ? "fa-circle-check" : "fa-triangle-exclamation";

      messageBox.html(`
        <div class="alert ${alertClass} alert-dismissible fade show mt-2" role="alert">
          <i class="fa-solid ${icon} me-2"></i>
          ${data.message}
          <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      `);

      // Auto-hide message + reset fields if success
      if (data.success) {
        setTimeout(() => {
          issueForm.reset();
          messageBox.html("");
          const modal = bootstrap.Modal.getInstance(document.getElementById("issueProductModal"));
          modal.hide();
        }, 5000);
      }
    })
    .catch(err => {
      console.error("Error:", err);
      messageBox.html(`
        <div class="alert alert-danger alert-dismissible fade show mt-2" role="alert">
          <i class="fa-solid fa-triangle-exclamation me-2"></i>
          An unexpected error occurred. Please try again.
          <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      `);
    });
  });
});
