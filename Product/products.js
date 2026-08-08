// Core Supabase Connection Configuration
const PRODUCT_SUPABASE_URL = "https://ycipxljvymewdltlblvn.supabase.co";
const PRODUCT_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljaXB4bGp2eW1ld2RsdGxibHZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzNzA5MzksImV4cCI6MjA5Nzk0NjkzOX0.dleDKMUuavLtA_pPKicnBexgGb4SqOGM7oU7QoEBm9I";
const dochakiClient = window.supabase.createClient(PRODUCT_SUPABASE_URL, PRODUCT_SUPABASE_ANON_KEY);

// Core Cart Storage Engine Array Loop 
let globalCart = JSON.parse(localStorage.getItem('dochaki_cart')) || [];

function getSubCategoryIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('sub_id');
}

function normalizeCategoryIdValue(value) {
    if (value === null || value === undefined) return [];
    if (Array.isArray(value)) {
        return value.map(item => String(item).trim()).filter(Boolean);
    }
    if (typeof value === 'string') {
        return value
            .split(',')
            .map(item => item.trim())
            .filter(Boolean);
    }
    return [String(value).trim()].filter(Boolean);
}

function productMatchesSelectedCategory(product, fieldName, selectedCategoryId) {
    const normalizedSelectedCategoryId = String(selectedCategoryId || '').trim();
    if (!normalizedSelectedCategoryId) return false;

    const rawValue = product?.[fieldName];
    if (rawValue === null || rawValue === undefined || rawValue === '') return false;

    const categoryValues = normalizeCategoryIdValue(rawValue);
    return categoryValues.includes(normalizedSelectedCategoryId);
}

// 1. Fetch products from database safely
async function fetchModelProducts() {
    const subId = getSubCategoryIdFromURL();
    if (!subId) { showErrorState(); return; }

    // TARGETING NEW PREFIX IDs PERFECTLY
    document.getElementById('dks-prd-loading-state').style.display = 'block';
    document.getElementById('dks-prd-error-state').style.display = 'none';

    try {
        const productFieldCandidates = ['sub_category_id', 'sub_category', 'subcategory_id', 'subCategoryId'];
        let productsData = [];

        const { data: allProducts, error: productsLoadError } = await dochakiClient
            .from('products')
            .select('*')
            .order('id', { ascending: true });

        if (productsLoadError) {
            throw productsLoadError;
        }

        for (const field of productFieldCandidates) {
            const matchingProducts = (allProducts || []).filter(item => productMatchesSelectedCategory(item, field, subId));
            if (matchingProducts.length) {
                productsData = matchingProducts;
                break;
            }
        }

        try {
            const { data: subCatData, error: subCatError } = await dochakiClient
                .from('sub_categories')
                .select('name')
                .eq('id', subId)
                .maybeSingle();

            if (!subCatError && subCatData?.name) {
                document.getElementById('main-model-title').innerText = `${subCatData.name} Accessories`;
            }
        } catch (subCatErr) {
            console.warn('Sub-category title fetch skipped:', subCatErr.message);
        }

        if (!productsData || productsData.length === 0) {
            document.getElementById('dks-prd-loading-state').style.display = 'none';
            document.getElementById('dks-prd-error-state').style.display = 'block';
            document.getElementById('dks-prd-error-state').innerText = 'No products found for this model yet.';
            document.getElementById('product-count').innerText = 'Showing 0 products';
            return;
        }

        renderProductsGrid(productsData);
        syncCartLogicUI();

    } catch (err) {
        console.error('Products fetch failed:', err.message || err);
        showErrorState();
    }
}

// 2. Render Products Matrix with Updated Unique Classes
function renderProductsGrid(products) {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = '';
    if (!products || products.length === 0) { showErrorState(); return; }

    products.forEach(item => {
        let buttonText = "View Details";
        let clickAction = `goToDetails(${item.id})`;

        let hasSize = false;
        if (item.bolt_sizes && Array.isArray(item.bolt_sizes)) {
            if (item.bolt_sizes.length > 0 && !item.bolt_sizes.includes("N/A") && !item.bolt_sizes.includes("n/a")) {
                hasSize = true;
            }
        }

        if (!hasSize) {
            buttonText = "Add to Cart";
            clickAction = `directCartTrigger(${item.id}, '${item.name.replace(/'/g, "\\'")}', ${item.price}, ${item.cut_price || 0}, '${item.image_url}', event)`;
        }

        // Output code strictly matching dks-prd- CSS Architectures
        const cardHTML = `
            <div class="dks-prd-item-card" onclick="goToDetails(${item.id})">
                <div class="dks-prd-media-box">
                    <span class="dks-prd-tag">Premium</span>
                    <img src="${item.image_url}" alt="${item.name}" class="dks-prd-item-img" onerror="this.src='https://dmototech.co.in/wp-content/uploads/2026/01/G-310-GS.webp'">
                </div>
                <div class="dks-prd-body-box">
                    <h3 class="dks-prd-item-title">${item.name}</h3>
                    <div class="dks-prd-price-row">
                        <span class="dks-prd-sale-price">₹${item.price.toLocaleString('en-IN')}</span>
                        ${item.cut_price ? `<span class="dks-prd-mrp-price">₹${item.cut_price.toLocaleString('en-IN')}</span>` : ''}
                    </div>
                    <button class="dks-prd-action-btn" onclick="${clickAction}">${buttonText}</button>
                </div>
            </div>
        `;
        grid.innerHTML += cardHTML;
    });

    document.getElementById('dks-prd-loading-state').style.display = 'none';
    document.getElementById('product-count').innerText = `Showing all ${products.length} premium products`;
}

function goToDetails(productId) {
    window.location.href = `../Product_detail/Product_deatail.html?id=${productId}`;
}

// 3. Live Sync Cart Engine Logic (Corrected to active state class pipeline)
function toggleCartDrawer() {
    const drawer = document.getElementById('cartDrawer');
    const overlay = document.getElementById('cartOverlay');
    if (drawer && overlay) {
        drawer.classList.toggle('active'); // CSS matches '.active' 
        overlay.classList.toggle('active');
    }
}

function directCartTrigger(productId, productName, productPrice, productCutPrice, productImg, event) {
    event.stopPropagation();

    globalCart = JSON.parse(localStorage.getItem('dochaki_cart')) || [];

    const existingIndex = globalCart.findIndex(item => item.id === productId);
    if (existingIndex > -1) {
        globalCart[existingIndex].qty += 1;
    } else {
        globalCart.push({ 
            id: productId, 
            name: productName, 
            price: productPrice, 
            old_price: productCutPrice || productPrice, 
            img: productImg, 
            qty: 1,
            variant: '',
            variant_label: ''
        });
    }

    localStorage.setItem('dochaki_cart', JSON.stringify(globalCart));
    syncCartLogicUI();

    window.dispatchEvent(new Event('storage'));

    // Open drawer panel instantly when clicked
    const drawer = document.getElementById('cartDrawer');
    const overlay = document.getElementById('cartOverlay');
    if (drawer && overlay) {
        drawer.classList.add('active');
        overlay.classList.add('active');
    }
}

function removeLiveCartItem(productId) {
    globalCart = globalCart.filter(item => item.id !== productId);
    localStorage.setItem('dochaki_cart', JSON.stringify(globalCart));
    syncCartLogicUI();
    window.dispatchEvent(new Event('storage'));
}

function syncCartLogicUI() {
    globalCart = JSON.parse(localStorage.getItem('dochaki_cart')) || [];

    const container = document.getElementById('cartDrawerContainer');
    const headerCount = document.getElementById('dmt-header-cart-count');
    const subCount = document.getElementById('dmt-cart-drawer-subcount');
    const footerTotal = document.getElementById('dmt-cart-drawer-total');

    if (container) container.innerHTML = '';
    let totalItems = 0;
    let totalPrice = 0;

    if (globalCart.length === 0) {
        if (container) container.innerHTML = `<p style="text-align:center; color:#94a3b8; padding-top:40px; font-size:14px; font-family:'Inter', sans-serif;">Your cart bag is empty.</p>`;
        if (headerCount) headerCount.innerText = "0";
        if (subCount) subCount.innerText = "0 Items";
        if (footerTotal) footerTotal.innerText = "₹0";
        return;
    }

    globalCart.forEach(item => {
        const itemPrice = Number(String(item.price).replace(/[^0-9.-]+/g, '')) || 0;
        const itemQty = parseInt(item.qty, 10) || 0;
        totalItems += itemQty;
        totalPrice += (itemPrice * itemQty);

        if (container) {
            const fallbackImg = 'https://dmototech.co.in/wp-content/uploads/2026/01/G-310-GS.webp';
            const itemMarkup = `
                <div class="cart-live-item" style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px;">
                    <img src="${item.img || fallbackImg}" alt="${item.name}" class="cart-live-img" style="width: 60px; height: 60px; object-fit: cover; border-radius: 6px;">
                    <div class="cart-live-details" style="flex-grow: 1;">
                        <h4 class="cart-live-name" style="margin: 0 0 4px 0; font-size: 14px; color: #0f172a;">${item.name} <span style="color:#64748b; font-weight:400;">(x${itemQty})</span></h4>
                        <span class="cart-live-price" style="font-weight: 700; font-size: 14px; color: #0f172a;">₹${(itemPrice * itemQty).toLocaleString('en-IN')}</span>
                    </div>
                    <button class="cart-live-remove" onclick="removeLiveCartItem(${item.id})" style="background: transparent; border: none; color: #94a3b8; cursor: pointer; font-size: 16px;">✕</button>
                </div>
            `;
            container.innerHTML += itemMarkup;
        }
    });

    if (headerCount) headerCount.innerText = totalItems;
    if (subCount) subCount.innerText = `${totalItems} ${totalItems === 1 ? 'Item' : 'Items'}`;
    if (footerTotal) footerTotal.innerText = `₹${totalPrice.toLocaleString('en-IN')}`;
}

// WhatsApp/Razorpay Checkout trigger router redirection
function triggerCheckout() {
    if (globalCart.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    localStorage.setItem("dochaki_cart", JSON.stringify(globalCart));

    const drawer = document.getElementById('cartDrawer');
    const overlay = document.getElementById('cartOverlay');

    if (drawer && overlay) {
        drawer.classList.remove('active');
        overlay.classList.remove('active');
    }

    window.location.href = "../Checkout/checkout.html";
}

function showErrorState() {
    document.getElementById('dks-prd-loading-state').style.display = 'none';
    document.getElementById('dks-prd-error-state').style.display = 'block';
    document.getElementById('product-count').innerText = `Showing 0 products`;
}

// Event Listeners for localstorage synchronization across pages
window.addEventListener('storage', function (e) {
    if (!e.key || e.key === 'dochaki_cart') {
        syncCartLogicUI();
    }
});

// Bind methods globally so inline HTML onclick calls execute correctly
window.directCartTrigger = directCartTrigger;
window.removeLiveCartItem = removeLiveCartItem;
window.goToDetails = goToDetails;
window.triggerCheckout = triggerCheckout;
window.toggleCartDrawer = toggleCartDrawer;

// Window initialization 
window.addEventListener('DOMContentLoaded', fetchModelProducts);