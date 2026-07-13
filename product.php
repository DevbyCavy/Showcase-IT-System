<?php
require_once 'php_action/auth_guard.php';
requireRole('Stores Admin');
require_once 'php_action/db_connection.php';

$activeTab = $_GET['tab'] ?? 'products';
if (!in_array($activeTab, ['products', 'brands', 'categories'], true)) {
    $activeTab = 'products';
}

$brandsResult = $conn->query("SELECT brand_id, brand_name FROM brand WHERE brand_status = 1 AND brand_active = 1 ORDER BY brand_name");
$brandOptions = [];
while ($row = $brandsResult->fetch_assoc()) $brandOptions[] = $row;

$categoriesResult = $conn->query("SELECT categories_id, categories_name FROM category WHERE categories_status = 1 AND categories_active = 1 ORDER BY categories_name");
$categoryOptions = [];
while ($row = $categoriesResult->fetch_assoc()) $categoryOptions[] = $row;

$pageTitle = 'Products';
require_once 'includes/sidebarStores.php';
?>

<div class="dash-card">
    <div class="dash-card-head">
        <h5><i class="fas fa-box me-2"></i>Manage Products</h5>
    </div>

    <!-- Tabs: Products | Brands | Categories -->
    <ul class="nav nav-tabs modern-tabs">
        <li class="nav-item">
            <button class="nav-link modern-tab-btn<?= $activeTab === 'products' ? ' active' : '' ?>" data-bs-toggle="tab" data-bs-target="#products-tab">
                <i class="fas fa-box me-1"></i> Products
            </button>
        </li>
        <li class="nav-item">
            <button class="nav-link modern-tab-btn<?= $activeTab === 'brands' ? ' active' : '' ?>" data-bs-toggle="tab" data-bs-target="#brands-tab">
                <i class="fas fa-copyright me-1"></i> Brands
            </button>
        </li>
        <li class="nav-item">
            <button class="nav-link modern-tab-btn<?= $activeTab === 'categories' ? ' active' : '' ?>" data-bs-toggle="tab" data-bs-target="#categories-tab">
                <i class="fas fa-tags me-1"></i> Categories
            </button>
        </li>
    </ul>

    <div class="tab-content pt-3">

        <!-- ── PRODUCTS TAB ── -->
        <div class="tab-pane fade<?= $activeTab === 'products' ? ' show active' : '' ?>" id="products-tab">
            <div class="d-flex justify-content-end mb-2">
                <button class="btn text-white" style="background:var(--brand-orange,#F15A2C);" data-bs-toggle="modal" data-bs-target="#addProductModal">
                    <i class="fas fa-plus-circle me-1"></i> Add Product
                </button>
            </div>
            <div class="table-responsive">
                <table class="table table-bordered table-striped mb-0" id="productsTable">
                    <thead class="table-dark">
                        <tr>
                            <th>Image</th>
                            <th>Product Name</th>
                            <th>Amnt/Size(mm/ml/kg)</th>
                            <th>Quantity</th>
                            <th>Brand</th>
                            <th>Category</th>
                            <th>Status</th>
                            <th style="width:12%;">Options</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        </div>

        <!-- ── BRANDS TAB ── -->
        <div class="tab-pane fade<?= $activeTab === 'brands' ? ' show active' : '' ?>" id="brands-tab">
            <div class="d-flex justify-content-end mb-2">
                <button class="btn text-white" style="background:var(--brand-orange,#F15A2C);" data-bs-toggle="modal" data-bs-target="#addBrandModal">
                    <i class="fas fa-plus-circle me-1"></i> Add Brand
                </button>
            </div>
            <div class="table-responsive">
                <table class="table table-bordered table-striped mb-0" id="brandsTable">
                    <thead class="table-dark">
                        <tr>
                            <th>Brand Name</th>
                            <th>Status</th>
                            <th style="width:15%;">Options</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        </div>

        <!-- ── CATEGORIES TAB ── -->
        <div class="tab-pane fade<?= $activeTab === 'categories' ? ' show active' : '' ?>" id="categories-tab">
            <div class="d-flex justify-content-end mb-2">
                <button class="btn text-white" style="background:var(--brand-orange,#F15A2C);" data-bs-toggle="modal" data-bs-target="#addCategoryModal">
                    <i class="fas fa-plus-circle me-1"></i> Add Category
                </button>
            </div>
            <div class="table-responsive">
                <table class="table table-bordered table-striped mb-0" id="categoriesTable">
                    <thead class="table-dark">
                        <tr>
                            <th>Category Name</th>
                            <th>Status</th>
                            <th style="width:15%;">Options</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        </div>

    </div>
</div>

<?php
/* Reusable brand/category <option> lists for the product modals */
function wls_brand_options($brandOptions, $selectedId = null) {
    foreach ($brandOptions as $b) {
        $sel = ((string)$selectedId === (string)$b['brand_id']) ? 'selected' : '';
        echo '<option value="' . $b['brand_id'] . '" ' . $sel . '>' . htmlspecialchars($b['brand_name']) . '</option>';
    }
}
function wls_category_options($categoryOptions, $selectedId = null) {
    foreach ($categoryOptions as $c) {
        $sel = ((string)$selectedId === (string)$c['categories_id']) ? 'selected' : '';
        echo '<option value="' . $c['categories_id'] . '" ' . $sel . '>' . htmlspecialchars($c['categories_name']) . '</option>';
    }
}
?>

<!-- ============================================================
     PRODUCT MODALS
     ============================================================ -->

<!-- Add Product Modal -->
<div class="modal fade" id="addProductModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <form id="submitProductForm" action="php_action/createProduct.php" method="POST" enctype="multipart/form-data">
                <div class="modal-header" style="background:linear-gradient(135deg, var(--brand-orange,#F15A2C), var(--brand-orange-dark,#D94E22));">
                    <h5 class="modal-title text-white"><i class="fa-solid fa-plus me-2"></i>Add Product</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body" style="max-height:450px; overflow-y:auto;">
                    <div id="add-product-messages"></div>

                    <div class="mb-3 row align-items-center">
                        <label for="productImage" class="col-sm-3 col-form-label">Product Image</label>
                        <div class="col-sm-9">
                            <input type="file" class="form-control" id="productImage" name="productImage">
                        </div>
                    </div>
                    <div class="mb-3 row align-items-center">
                        <label for="productName" class="col-sm-3 col-form-label">Product Name</label>
                        <div class="col-sm-9">
                            <input type="text" class="form-control" id="productName" name="productName" placeholder="Enter Product Name" autocomplete="off">
                        </div>
                    </div>
                    <div class="mb-3 row align-items-center">
                        <label for="quantity" class="col-sm-3 col-form-label">Quantity</label>
                        <div class="col-sm-9">
                            <input type="text" class="form-control" id="quantity" name="quantity" placeholder="Enter Quantity" autocomplete="off">
                        </div>
                    </div>
                    <div class="mb-3 row align-items-center">
                        <label for="rate" class="col-sm-3 col-form-label">Amnt/Size(mm/ml/kg)</label>
                        <div class="col-sm-9">
                            <input type="text" class="form-control" id="rate" name="rate" placeholder="Enter Size" autocomplete="off">
                        </div>
                    </div>
                    <div class="mb-3 row align-items-center">
                        <label for="brandName" class="col-sm-3 col-form-label">Brand</label>
                        <div class="col-sm-9 d-flex gap-2">
                            <select class="form-select" id="brandName" name="brandName">
                                <option value="">SELECT</option>
                                <?php wls_brand_options($brandOptions); ?>
                            </select>
                            <button type="button" class="btn btn-outline-secondary flex-shrink-0 quick-add-btn" data-quick-add="brand" data-return-modal="addProductModal" title="Add new brand">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    </div>
                    <div class="mb-3 row align-items-center">
                        <label for="categoryName" class="col-sm-3 col-form-label">Category</label>
                        <div class="col-sm-9 d-flex gap-2">
                            <select class="form-select" id="categoryName" name="categoryName">
                                <option value="">SELECT</option>
                                <?php wls_category_options($categoryOptions); ?>
                            </select>
                            <button type="button" class="btn btn-outline-secondary flex-shrink-0 quick-add-btn" data-quick-add="category" data-return-modal="addProductModal" title="Add new category">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    </div>
                    <div class="mb-3 row align-items-center">
                        <label for="productStatus" class="col-sm-3 col-form-label">Status</label>
                        <div class="col-sm-9">
                            <select class="form-select" id="productStatus" name="productStatus">
                                <option value="1">Available</option>
                                <option value="2">Not Available</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal"><i class="fa-solid fa-xmark me-1"></i> Close</button>
                    <button type="submit" class="btn text-white" style="background:var(--brand-orange,#F15A2C);" id="createProductBtn"><i class="fa-solid fa-check me-1"></i> Save</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Edit Product Modal -->
<div class="modal fade" id="editProductModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title"><i class="fa-solid fa-pen-to-square me-2"></i>Edit Product</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body" style="max-height:450px; overflow:auto;">
                <ul class="nav nav-tabs mb-3">
                    <li class="nav-item"><button class="nav-link active" data-bs-toggle="tab" data-bs-target="#photo-pane" type="button"><i class="fa-solid fa-image"></i> Photo</button></li>
                    <li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#info-pane" type="button"><i class="fa-solid fa-box"></i> Product Info</button></li>
                </ul>
                <div class="tab-content">
                    <div class="tab-pane fade show active" id="photo-pane">
                        <div id="edit-product-photo-messages"></div>
                        <form id="updateProductImageForm" action="php_action/editProductImage.php" method="POST" enctype="multipart/form-data">
                            <input type="hidden" name="productId" id="editImageProductId">
                            <div class="mb-3 row align-items-center">
                                <label class="col-sm-4 col-form-label fw-semibold">Current Image</label>
                                <div class="col-sm-8">
                                    <div class="p-2 border rounded-3 shadow-sm bg-white d-inline-block">
                                        <img src="images/images.png" id="getProductImage" alt="Product Image" class="img-fluid rounded-3" style="width:180px; height:180px; object-fit:cover;">
                                    </div>
                                </div>
                            </div>
                            <div class="mb-3 row align-items-center">
                                <label for="editProductImage" class="col-sm-4 col-form-label fw-semibold">Upload New Image</label>
                                <div class="col-sm-8">
                                    <input id="editProductImage" name="editProductImage" type="file">
                                </div>
                            </div>
                            <div class="text-end">
                                <button type="submit" class="btn text-white" style="background:var(--brand-orange,#F15A2C);"><i class="fa-solid fa-check me-1"></i> Save Image</button>
                            </div>
                        </form>
                    </div>
                    <div class="tab-pane fade" id="info-pane">
                        <div id="edit-product-messages"></div>
                        <form id="editProductForm" action="php_action/editProduct.php" method="POST">
                            <input type="hidden" name="productId" id="editProductId">
                            <div class="mb-3 row align-items-center">
                                <label for="editProductName" class="col-sm-4 col-form-label">Product Name</label>
                                <div class="col-sm-8"><input type="text" class="form-control" id="editProductName" name="editProductName" autocomplete="off"></div>
                            </div>
                            <div class="mb-3 row align-items-center">
                                <label for="editQuantity" class="col-sm-4 col-form-label">Quantity</label>
                                <div class="col-sm-8"><input type="text" class="form-control" id="editQuantity" name="editQuantity" autocomplete="off"></div>
                            </div>
                            <div class="mb-3 row align-items-center">
                                <label for="editRate" class="col-sm-4 col-form-label">Amnt/Size</label>
                                <div class="col-sm-8"><input type="text" class="form-control" id="editRate" name="editRate" autocomplete="off"></div>
                            </div>
                            <div class="mb-3 row align-items-center">
                                <label for="editBrandName" class="col-sm-4 col-form-label">Brand</label>
                                <div class="col-sm-8 d-flex gap-2">
                                    <select class="form-select" id="editBrandName" name="editBrandName">
                                        <option value="">SELECT</option>
                                        <?php wls_brand_options($brandOptions); ?>
                                    </select>
                                    <button type="button" class="btn btn-outline-secondary flex-shrink-0 quick-add-btn" data-quick-add="brand" data-return-modal="editProductModal" title="Add new brand">
                                        <i class="fas fa-plus"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="mb-3 row align-items-center">
                                <label for="editCategoryName" class="col-sm-4 col-form-label">Category</label>
                                <div class="col-sm-8 d-flex gap-2">
                                    <select class="form-select" id="editCategoryName" name="editCategoryName">
                                        <option value="">SELECT</option>
                                        <?php wls_category_options($categoryOptions); ?>
                                    </select>
                                    <button type="button" class="btn btn-outline-secondary flex-shrink-0 quick-add-btn" data-quick-add="category" data-return-modal="editProductModal" title="Add new category">
                                        <i class="fas fa-plus"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="mb-3 row align-items-center">
                                <label for="editProductStatus" class="col-sm-4 col-form-label">Status</label>
                                <div class="col-sm-8">
                                    <select class="form-select" id="editProductStatus" name="editProductStatus">
                                        <option value="1">Available</option>
                                        <option value="2">Not Available</option>
                                    </select>
                                </div>
                            </div>
                            <div class="text-end">
                                <button type="submit" class="btn text-white" style="background:var(--brand-orange,#F15A2C);"><i class="fa-solid fa-check me-1"></i> Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Remove Product Modal -->
<div class="modal fade" id="removeProductModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title"><i class="fa-solid fa-trash-can me-2"></i>Remove Product</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <div id="remove-product-messages"></div>
                <p>Do you really want to remove this product?</p>
                <input type="hidden" id="removeProductId">
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal"><i class="fa-solid fa-xmark"></i> Close</button>
                <button type="button" class="btn btn-danger" id="removeProductBtn"><i class="fa-solid fa-check"></i> Remove</button>
            </div>
        </div>
    </div>
</div>

<!-- ============================================================
     BRAND MODALS
     ============================================================ -->

<div class="modal fade" id="addBrandModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <form id="submitBrandForm" action="php_action/createBrand.php" method="POST">
                <div class="modal-header">
                    <h5 class="modal-title"><i class="fa fa-plus me-1"></i> Add Brand</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div id="add-brand-messages"></div>
                    <div class="mb-3 row">
                        <label for="brandNameInput" class="col-sm-4 col-form-label fw-semibold">Brand Name</label>
                        <div class="col-sm-8"><input type="text" class="form-control" id="brandNameInput" name="brandName" autocomplete="off"></div>
                    </div>
                    <div class="mb-3 row">
                        <label for="brandStatus" class="col-sm-4 col-form-label fw-semibold">Status</label>
                        <div class="col-sm-8">
                            <select class="form-select" id="brandStatus" name="brandStatus">
                                <option value="1">Available</option>
                                <option value="2">Not Available</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    <button type="submit" class="btn text-white" style="background:var(--brand-orange,#F15A2C);" id="createBrandBtn">Save Changes</button>
                </div>
            </form>
        </div>
    </div>
</div>

<div class="modal fade" id="editBrandModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <form id="editBrandForm" action="php_action/editBrand.php" method="POST">
                <input type="hidden" name="brandId" id="editBrandId">
                <div class="modal-header">
                    <h5 class="modal-title"><i class="fa fa-edit me-1"></i> Edit Brand</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div id="edit-brand-messages"></div>
                    <div class="mb-3 row">
                        <label for="editBrandNameInput" class="col-sm-4 col-form-label">Brand Name</label>
                        <div class="col-sm-8"><input type="text" class="form-control" id="editBrandNameInput" name="editBrandName" autocomplete="off"></div>
                    </div>
                    <div class="mb-3 row">
                        <label for="editBrandStatus" class="col-sm-4 col-form-label">Status</label>
                        <div class="col-sm-8">
                            <select class="form-select" id="editBrandStatus" name="editBrandStatus">
                                <option value="1">Available</option>
                                <option value="2">Not Available</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    <button type="submit" class="btn btn-success" id="editBrandBtn">Save Changes</button>
                </div>
            </form>
        </div>
    </div>
</div>

<div class="modal fade" id="removeBrandModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title"><i class="fa-solid fa-trash me-2"></i>Remove Brand</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <div id="remove-brand-messages"></div>
                <p>Do you really want to remove this brand?</p>
                <input type="hidden" id="removeBrandId">
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                <button type="button" class="btn btn-danger" id="removeBrandBtn">Remove</button>
            </div>
        </div>
    </div>
</div>

<!-- ============================================================
     CATEGORY MODALS
     ============================================================ -->

<div class="modal fade" id="addCategoryModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <form id="submitCategoryForm" action="php_action/createCategory.php" method="POST">
                <div class="modal-header">
                    <h5 class="modal-title"><i class="fa fa-plus me-2"></i> Add Category</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div id="add-category-messages"></div>
                    <div class="mb-3 row">
                        <label for="categoryNameInput" class="col-sm-4 col-form-label">Category Name</label>
                        <div class="col-sm-8"><input type="text" class="form-control" id="categoryNameInput" name="categoryName" autocomplete="off"></div>
                    </div>
                    <div class="mb-3 row">
                        <label for="categoryStatus" class="col-sm-4 col-form-label">Status</label>
                        <div class="col-sm-8">
                            <select class="form-select" id="categoryStatus" name="categoryStatus">
                                <option value="1">Available</option>
                                <option value="2">Not Available</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    <button type="submit" class="btn text-white" style="background:var(--brand-orange,#F15A2C);" id="createCategoryBtn">Save Changes</button>
                </div>
            </form>
        </div>
    </div>
</div>

<div class="modal fade" id="editCategoryModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <form id="editCategoryForm" action="php_action/editCategories.php" method="POST">
                <input type="hidden" name="editCategoriesId" id="editCategoriesId">
                <div class="modal-header">
                    <h5 class="modal-title"><i class="fas fa-edit me-2"></i> Edit Category</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div id="edit-category-messages"></div>
                    <div class="mb-3 row">
                        <label for="editCategoriesNameInput" class="col-sm-4 col-form-label">Category Name</label>
                        <div class="col-sm-8"><input type="text" class="form-control" id="editCategoriesNameInput" name="editCategoriesName" autocomplete="off"></div>
                    </div>
                    <div class="mb-3 row">
                        <label for="editCategoriesStatus" class="col-sm-4 col-form-label">Status</label>
                        <div class="col-sm-8">
                            <select class="form-select" id="editCategoriesStatus" name="editCategoriesStatus">
                                <option value="1">Available</option>
                                <option value="2">Not Available</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    <button type="submit" class="btn text-white" style="background:var(--brand-orange,#F15A2C);" id="editCategoriesBtn">Save Changes</button>
                </div>
            </form>
        </div>
    </div>
</div>

<div class="modal fade" id="removeCategoryModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title"><i class="fas fa-trash-alt me-2"></i>Remove Category</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <div id="remove-category-messages"></div>
                <p>Do you really want to remove this category?</p>
                <input type="hidden" id="removeCategoryId">
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                <button type="button" class="btn btn-danger" id="removeCategoryBtn">Confirm</button>
            </div>
        </div>
    </div>
</div>

<script src="custom/js/manageProducts.js"></script>

<?php require_once 'includes/footerDashboard.php'; ?>
