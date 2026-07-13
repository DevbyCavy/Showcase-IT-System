/* Manage Products page — Products / Brands / Categories tabs.
 * Self-contained: no-ops on any page without #productsTable.
 */
$(document).ready(function () {
    if (!document.getElementById('productsTable')) return;

    $.fn.dataTable.ext.errMode = 'none';

    function showAlert(containerId, type, message) {
        const el = document.getElementById(containerId);
        if (!el) return;
        el.innerHTML = '<div class="alert alert-' + type + ' alert-dismissible fade show py-2" role="alert">' +
            message +
            '<button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>';
    }

    /* ---------- DataTables ---------- */
    const productsTable = $('#productsTable').DataTable({
        ajax: 'php_action/fetchProduct.php',
        order: [],
        pagingType: 'simple_numbers'
    });
    const brandsTable = $('#brandsTable').DataTable({
        ajax: 'php_action/fetchBrand.php',
        order: []
    });
    const categoriesTable = $('#categoriesTable').DataTable({
        ajax: 'php_action/fetchCategories.php',
        order: []
    });

    // Hidden-tab DataTables miscalculate column widths — fix on tab shown.
    document.querySelectorAll('.modern-tab-btn').forEach(function (btn) {
        btn.addEventListener('shown.bs.tab', function (e) {
            const target = e.target.getAttribute('data-bs-target');
            if (target === '#brands-tab') brandsTable.columns.adjust();
            if (target === '#categories-tab') categoriesTable.columns.adjust();
            if (target === '#products-tab') productsTable.columns.adjust();
        });
    });

    /* ---------- Product image upload widgets ---------- */
    $('#productImage').fileinput({
        showUpload: false,
        showCaption: false,
        dropZoneEnabled: false,
        browseClass: 'btn btn-outline-secondary',
        removeClass: 'btn btn-outline-danger',
        defaultPreviewContent: '<img src="images/images.png" style="height:120px;">',
        allowedFileExtensions: ['jpg', 'jpeg', 'png', 'gif']
    });
    $('#editProductImage').fileinput({
        showUpload: false,
        showCaption: false,
        dropZoneEnabled: false,
        browseClass: 'btn btn-outline-secondary',
        removeClass: 'btn btn-outline-danger',
        allowedFileExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp']
    });

    /* ================================================================
       PRODUCTS
       ================================================================ */

    $('#submitProductForm').on('submit', function (e) {
        e.preventDefault();
        const form = this;
        const formData = new FormData(form);
        const btn = document.getElementById('createProductBtn');
        btn.disabled = true;

        fetch(form.action, { method: 'POST', body: formData })
            .then(r => r.json())
            .then(data => {
                btn.disabled = false;
                showAlert('add-product-messages', data.success ? 'success' : 'warning', data.message);
                if (data.success) {
                    form.reset();
                    $('#productImage').fileinput('clear');
                    productsTable.ajax.reload(null, false);
                    setTimeout(() => bootstrap.Modal.getInstance(document.getElementById('addProductModal'))?.hide(), 600);
                }
            })
            .catch(err => { console.error(err); btn.disabled = false; });
    });

    window.editProduct = function (productId) {
        fetch('php_action/fetchSelectedProduct.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'productId=' + encodeURIComponent(productId)
        })
        .then(r => r.json())
        .then(data => {
            if (!data.success) { showAlert('edit-product-messages', 'warning', data.message || 'Could not load product.'); return; }
            const p = data.data;
            document.getElementById('editProductId').value = p.product_id;
            document.getElementById('editImageProductId').value = p.product_id;
            document.getElementById('getProductImage').src = p.product_image || 'images/images.png';
            document.getElementById('editProductName').value = p.product_name;
            document.getElementById('editQuantity').value = p.quantity;
            document.getElementById('editRate').value = p.rate;
            document.getElementById('editBrandName').value = p.brand_id;
            document.getElementById('editCategoryName').value = p.categories_id;
            document.getElementById('editProductStatus').value = p.active;
        })
        .catch(err => console.error(err));
    };

    $('#editProductForm').on('submit', function (e) {
        e.preventDefault();
        const form = this;
        fetch(form.action, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: $(form).serialize()
        })
        .then(r => r.json())
        .then(data => {
            showAlert('edit-product-messages', data.success ? 'success' : 'warning', data.message);
            if (data.success) {
                productsTable.ajax.reload(null, false);
                setTimeout(() => bootstrap.Modal.getInstance(document.getElementById('editProductModal'))?.hide(), 600);
            }
        })
        .catch(err => console.error(err));
    });

    $('#updateProductImageForm').on('submit', function (e) {
        e.preventDefault();
        const form = this;
        const formData = new FormData(form);
        fetch(form.action, { method: 'POST', body: formData })
            .then(r => r.json())
            .then(data => {
                showAlert('edit-product-photo-messages', data.success ? 'success' : 'warning', data.message);
                if (data.success) {
                    document.getElementById('getProductImage').src = data.image_url;
                    productsTable.ajax.reload(null, false);
                }
            })
            .catch(err => console.error(err));
    });

    window.removeProduct = function (productId) {
        document.getElementById('removeProductId').value = productId;
    };
    document.getElementById('removeProductBtn').addEventListener('click', function () {
        const id = document.getElementById('removeProductId').value;
        if (!id) return;
        fetch('php_action/removeProduct.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'productId=' + encodeURIComponent(id)
        })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                productsTable.ajax.reload(null, false);
                bootstrap.Modal.getInstance(document.getElementById('removeProductModal'))?.hide();
            } else {
                showAlert('remove-product-messages', 'warning', data.message);
            }
        })
        .catch(err => console.error(err));
    });

    /* ================================================================
       BRANDS
       ================================================================ */

    $('#submitBrandForm').on('submit', function (e) {
        e.preventDefault();
        const form = this;
        fetch(form.action, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: $(form).serialize()
        })
        .then(r => r.json())
        .then(data => {
            showAlert('add-brand-messages', data.success ? 'success' : 'warning', data.message);
            if (data.success) {
                brandsTable.ajax.reload(null, false);
                const name = document.getElementById('brandNameInput').value;
                form.reset();
                bootstrap.Modal.getInstance(document.getElementById('addBrandModal'))?.hide();
                finishQuickAdd('brand', data.brand_id, name);
            }
        })
        .catch(err => console.error(err));
    });

    window.editBrand = function (brandId) {
        fetch('php_action/fetchSelectedBrand.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'brandId=' + encodeURIComponent(brandId)
        })
        .then(r => r.json())
        .then(data => {
            if (!data.success) { showAlert('edit-brand-messages', 'warning', data.message || 'Could not load brand.'); return; }
            document.getElementById('editBrandId').value = data.data.brand_id;
            document.getElementById('editBrandNameInput').value = data.data.brand_name;
            document.getElementById('editBrandStatus').value = data.data.brand_active;
        })
        .catch(err => console.error(err));
    };

    $('#editBrandForm').on('submit', function (e) {
        e.preventDefault();
        const form = this;
        fetch(form.action, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: $(form).serialize()
        })
        .then(r => r.json())
        .then(data => {
            showAlert('edit-brand-messages', data.success ? 'success' : 'warning', data.message);
            if (data.success) {
                brandsTable.ajax.reload(null, false);
                setTimeout(() => bootstrap.Modal.getInstance(document.getElementById('editBrandModal'))?.hide(), 600);
            }
        })
        .catch(err => console.error(err));
    });

    window.removeBrand = function (brandId) {
        document.getElementById('removeBrandId').value = brandId;
    };
    document.getElementById('removeBrandBtn').addEventListener('click', function () {
        const id = document.getElementById('removeBrandId').value;
        if (!id) return;
        fetch('php_action/removeBrand.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'brandId=' + encodeURIComponent(id)
        })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                brandsTable.ajax.reload(null, false);
                bootstrap.Modal.getInstance(document.getElementById('removeBrandModal'))?.hide();
            } else {
                showAlert('remove-brand-messages', 'warning', data.message);
            }
        })
        .catch(err => console.error(err));
    });

    /* ================================================================
       CATEGORIES
       ================================================================ */

    $('#submitCategoryForm').on('submit', function (e) {
        e.preventDefault();
        const form = this;
        fetch(form.action, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: $(form).serialize()
        })
        .then(r => r.json())
        .then(data => {
            showAlert('add-category-messages', data.success ? 'success' : 'warning', data.message);
            if (data.success) {
                categoriesTable.ajax.reload(null, false);
                const name = document.getElementById('categoryNameInput').value;
                form.reset();
                bootstrap.Modal.getInstance(document.getElementById('addCategoryModal'))?.hide();
                finishQuickAdd('category', data.category_id, name);
            }
        })
        .catch(err => console.error(err));
    });

    window.editCategory = function (categoryId) {
        fetch('php_action/fetchSelectedCategories.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'categoriesId=' + encodeURIComponent(categoryId)
        })
        .then(r => r.json())
        .then(data => {
            if (!data.success) { showAlert('edit-category-messages', 'warning', data.message || 'Could not load category.'); return; }
            document.getElementById('editCategoriesId').value = data.data.categories_id;
            document.getElementById('editCategoriesNameInput').value = data.data.categories_name;
            document.getElementById('editCategoriesStatus').value = data.data.categories_active;
        })
        .catch(err => console.error(err));
    };

    $('#editCategoryForm').on('submit', function (e) {
        e.preventDefault();
        const form = this;
        fetch(form.action, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: $(form).serialize()
        })
        .then(r => r.json())
        .then(data => {
            showAlert('edit-category-messages', data.success ? 'success' : 'warning', data.message);
            if (data.success) {
                categoriesTable.ajax.reload(null, false);
                setTimeout(() => bootstrap.Modal.getInstance(document.getElementById('editCategoryModal'))?.hide(), 600);
            }
        })
        .catch(err => console.error(err));
    });

    window.removeCategory = function (categoryId) {
        document.getElementById('removeCategoryId').value = categoryId;
    };
    document.getElementById('removeCategoryBtn').addEventListener('click', function () {
        const id = document.getElementById('removeCategoryId').value;
        if (!id) return;
        fetch('php_action/removeCategories.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'categoriesId=' + encodeURIComponent(id)
        })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                categoriesTable.ajax.reload(null, false);
                bootstrap.Modal.getInstance(document.getElementById('removeCategoryModal'))?.hide();
            } else {
                showAlert('remove-category-messages', 'warning', data.message);
            }
        })
        .catch(err => console.error(err));
    });

    /* ================================================================
       Quick-add: "+" next to Brand/Category in the product modals
       ================================================================ */

    let pendingReturnModal = null;

    document.querySelectorAll('.quick-add-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            const type = this.dataset.quickAdd;
            pendingReturnModal = this.dataset.returnModal;

            const productModalEl = document.getElementById(pendingReturnModal);
            const productModal = bootstrap.Modal.getInstance(productModalEl);
            const targetModalEl = document.getElementById(type === 'brand' ? 'addBrandModal' : 'addCategoryModal');

            productModalEl.addEventListener('hidden.bs.modal', function onHidden() {
                productModalEl.removeEventListener('hidden.bs.modal', onHidden);
                new bootstrap.Modal(targetModalEl).show();
            });
            productModal?.hide();
        });
    });

    function finishQuickAdd(type, newId, newName) {
        if (!pendingReturnModal || !newId) return;

        const selectIds = type === 'brand' ? ['brandName', 'editBrandName'] : ['categoryName', 'editCategoryName'];
        selectIds.forEach(function (selId) {
            const sel = document.getElementById(selId);
            if (!sel) return;
            const opt = document.createElement('option');
            opt.value = newId;
            opt.textContent = newName;
            sel.appendChild(opt);
            sel.value = newId;
        });

        const returnModalEl = document.getElementById(pendingReturnModal);
        const sourceModalEl = document.getElementById(type === 'brand' ? 'addBrandModal' : 'addCategoryModal');
        pendingReturnModal = null;

        sourceModalEl.addEventListener('hidden.bs.modal', function onHidden() {
            sourceModalEl.removeEventListener('hidden.bs.modal', onHidden);
            new bootstrap.Modal(returnModalEl).show();
        });
    }
});
