const PRODUCT_DETAIL_SUPABASE_URL = "https://ycipxljvymewdltlblvn.supabase.co";
const PRODUCT_DETAIL_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljaXB4bGp2eW1ld2RsdGxibHZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzNzA5MzksImV4cCI6MjA5Nzk0NjkzOX0.dleDKMUuavLtA_pPKicnBexgGb4SqOGM7oU7QoEBm9I";
const productDetailSupabase = (window.supabase && window.supabase.createClient) ? window.supabase.createClient(PRODUCT_DETAIL_SUPABASE_URL, PRODUCT_DETAIL_SUPABASE_ANON_KEY) : null;
let currentProduct = null;

function getProductId() {
    return new URLSearchParams(window.location.search).get('id');
}

function normalizeFeatureItems(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(String).filter(Boolean);
    if (typeof value === 'string') {
        const cleaned = value.trim();
        if (!cleaned) return [];
        const splitRegex = /<br\s*\/?>|\r?\n|•|\*|\u2022|\u2023|\u2219|\-\s*/;
        return cleaned
            .split(splitRegex)
            .map(item => item.trim())
            .filter(Boolean);
    }
    if (typeof value === 'object') {
        return Object.values(value).map(val => String(val).trim()).filter(Boolean);
    }
    return [String(value).trim()];
}

function getBoltSizesInfo(product) {
    const sizes = normalizeFeatureItems(product?.bolt_sizes || product?.sizes || []);
    const filteredSizes = sizes.map(size => String(size).trim()).filter(Boolean);
    const totalCount = product?.total_bolt_sizes ?? product?.totalBoltSizes ?? product?.total_bolt_size ?? product?.totalSizes;
    const normalizedCount = Number(String(totalCount ?? '').replace(/[^0-9]/g, ''));

    if (!filteredSizes.length) return { sizes: [], displayText: '' };

    const displayText = Number.isFinite(normalizedCount) && normalizedCount > 0
        ? `Available in ${normalizedCount} Sizes ${filteredSizes.join(', ')}`
        : filteredSizes.join(', ');

    return { sizes: filteredSizes, displayText };
}

function setActiveNav() {
    const currentPath = window.location.pathname.replace(/\\/g, '/').toLowerCase();
    document.querySelectorAll('.dmt-web-link, .dmt-mobile-nav-links a').forEach(link => {
        const href = link.getAttribute('href');
        if (!href || href === '#') return;
        const normalizedHref = href.replace(/\.\//g, '').replace(/\.\./g, '').split('/').pop().toLowerCase();
        if (currentPath.endsWith(normalizedHref)) {
            link.classList.add('active');
        }
    });
}

function switchTab(evt, panelId) {
    document.querySelectorAll('.dmt-tab-content-panel').forEach(panel => panel.classList.remove('active'));
    document.querySelectorAll('.dmt-tab-trigger').forEach(button => button.classList.remove('active'));
    const target = document.getElementById(panelId);
    if (target) target.classList.add('active');
    if (evt && evt.currentTarget) evt.currentTarget.classList.add('active');
}

function showProductError(message) {
    const container = document.querySelector('.dmt-detail-container');
    const hero = document.querySelector('.dmt-product-hero');
    const tabs = document.querySelector('.dmt-tabs-wrapper');

    if (container) container.style.display = 'none';
    if (hero) hero.innerHTML = '';
    if (tabs) tabs.remove();
}

function toggleAdditionalInfoTab(shouldShow) {
    const additionalButton = document.querySelector('.dmt-js-additional-tab-btn');
    const additionalPanel = document.getElementById('dmt-panel-additional');

    if (!additionalButton && !additionalPanel) return;

    if (shouldShow) {
        if (additionalButton) additionalButton.style.display = '';
        if (additionalPanel) additionalPanel.style.display = '';
        return;
    }

    if (additionalButton) additionalButton.remove();
    if (additionalPanel) additionalPanel.remove();
}

function renderProduct(product) {
    if (!product) {
        showProductError('Product data is unavailable.');
        return;
    }
    currentProduct = product;

    const img = document.querySelector('.dmt-js-img');
    const title = document.querySelector('.dmt-js-title');
    const price = document.querySelector('.dmt-js-price');
    const shortDesc = document.querySelector('.dmt-js-short-desc');
    const heroFeatures = document.querySelector('.dmt-js-hero-features');
    const boltSelect = document.querySelector('.dmt-js-bolt-select');
    const longDesc = document.querySelector('.dmt-js-long-desc');
    const featuresList = document.querySelector('.dmt-js-features-list');
    const categoryLabel = document.querySelector('.dmt-js-categories');
    const weightLabel = document.querySelector('.dmt-js-table-weight');
    const dimensionsLabel = document.querySelector('.dmt-js-table-dimensions');
    const boltSizesLabel = document.querySelector('.dmt-js-table-bolt-sizes');
    const breadcrumbTitle = document.querySelector('.dmt-js-crumbs');

    const boltSizesInfo = getBoltSizesInfo(product);
    const hasAdditionalInfo = [
        product.weight,
        product.product_weight,
        product.dimensions,
        product.size,
        product.product_dimensions,
        boltSizesInfo.displayText
    ].some(value => {
        const normalized = String(value ?? '').trim();
        return normalized !== '' && normalized.toLowerCase() !== 'n/a';
    });

    toggleAdditionalInfoTab(hasAdditionalInfo);

    if (img && product.image_url) img.src = product.image_url;
    if (title) title.innerText = product.name || 'Product';
    if (price) price.innerText = product.price ? `₹${Number(product.price).toLocaleString('en-IN')}` : '₹0';
    if (shortDesc) shortDesc.innerHTML = product.description_1 || product.short_description || product.description || product.summary || '';
    if (longDesc) longDesc.innerHTML = product.description_2 || product.long_description || product.details || product.full_description || '';
    if (categoryLabel) categoryLabel.innerText = product.category || product.sub_category || product.category_name || 'General';
    if (weightLabel) weightLabel.innerText = product.weight || product.product_weight || 'N/A';
    if (dimensionsLabel) dimensionsLabel.innerText = product.dimensions || product.size || product.product_dimensions || 'N/A';
    if (breadcrumbTitle) breadcrumbTitle.innerText = product.name || 'Product Details';

    const featuresA = normalizeFeatureItems(product.keyfeatures_1 || product.keyfeatures || product.features || product.specifications || '');
    if (heroFeatures) {
        heroFeatures.innerHTML = '';
        featuresA.forEach(feature => {
            const li = document.createElement('li');
            li.innerHTML = feature;
            heroFeatures.appendChild(li);
        });
    }

    const featuresB = normalizeFeatureItems(product.keyfeatures_2 || '');
    if (featuresList) {
        featuresList.innerHTML = '';
        featuresB.forEach(feature => {
            const li = document.createElement('li');
            li.innerHTML = feature;
            featuresList.appendChild(li);
        });
    }

    if (boltSelect) {
        const { sizes, displayText } = getBoltSizesInfo(product);
        const boltRow = document.querySelector('.dmt-js-bolt-row');

        if (!sizes.length) {
            boltSelect.innerHTML = '';
            if (boltRow) boltRow.style.display = 'none';
            if (boltSizesLabel) boltSizesLabel.innerText = 'N/A';
            return;
        }

        boltSelect.innerHTML = '<option value="">Choose an option</option>';
        sizes.forEach(size => {
            const option = document.createElement('option');
            option.value = size;
            option.innerText = size;
            boltSelect.appendChild(option);
        });
        if (boltRow) boltRow.style.display = '';
        if (boltSizesLabel) boltSizesLabel.innerText = displayText;
    }
}

function addProductToCart() {
    if (!currentProduct) {
        alert('Please wait until the product is loaded.');
        return;
    }

    const qtyInput = document.querySelector('.dmt-qty-input');
    const variantSelect = document.querySelector('.dmt-js-bolt-select');
    const qty = qtyInput ? parseInt(qtyInput.value, 10) : 1;
    const variant = variantSelect ? variantSelect.value : '';

    if (!qty || qty < 1) {
        alert('Enter a valid quantity.');
        return;
    }

    if (variantSelect && variantSelect.options.length > 1 && !variant) {
        alert('Please select a bolt size.');
        return;
    }

    const cartKey = 'dochaki_cart';
    const cartItems = JSON.parse(localStorage.getItem(cartKey)) || [];
    const variantLabel = (variantSelect && variantSelect.selectedOptions && variantSelect.selectedOptions[0])
        ? variantSelect.selectedOptions[0].textContent.trim()
        : variant;
    const existing = cartItems.find(item => item.id === currentProduct.id && item.variant === variant);
    if (existing) {
        existing.qty += qty;
        if (variantLabel) existing.variant_label = variantLabel;
    } else {
        cartItems.push({
            id: currentProduct.id,
            name: currentProduct.name,
            price: Number(currentProduct.price) || 0,
            img: currentProduct.image_url,
            qty,
            variant,
            variant_label: variantLabel || ''
        });
    }
    localStorage.setItem(cartKey, JSON.stringify(cartItems));
    if (typeof window.forceSyncHomeCart === 'function') window.forceSyncHomeCart();
    alert('Product added to cart.');
}

function submitReview() {
    var nameInput = document.querySelector('.dmt-js-input-name');
    var ratingInput = document.querySelector('.dmt-js-input-rating');
    var commentInput = document.querySelector('.dmt-js-input-comment');
    const name = nameInput ? nameInput.value.trim() : '';
    const rating = ratingInput ? ratingInput.value.trim() : '';
    const comment = commentInput ? commentInput.value.trim() : '';

    if (!name || !rating || !comment) {
        alert('Please fill in all review fields.');
        return;
    }
    if (!productDetailSupabase) {
        alert('Unable to submit review. Try again later.');
        return;
    }

    const pId = getProductId();
    productDetailSupabase.from('reviews').insert([{ product_id: parseInt(pId, 10), user_name: name, rating: parseInt(rating, 10), comment }])
        .then(({ error }) => {
            if (error) {
                alert('Review save failed: ' + error.message);
                return;
            }
            alert('Thank you! Your review has been submitted.');
            document.querySelector('.dmt-js-input-name').value = '';
            document.querySelector('.dmt-js-input-rating').value = '';
            document.querySelector('.dmt-js-input-comment').value = '';
            loadProductData();
        });
}

function loadProductData() {
    const pId = getProductId();
    if (!pId || !productDetailSupabase) return;

    productDetailSupabase.from('products').select('*').eq('id', parseInt(pId, 10)).single()
        .then(({ data: product, error }) => {
            if (error || !product) {
                console.error('Product loading failed:', error);
                const message = error ? error.message || 'Unable to load this product.' : 'Product not found.';
                showProductError(message);
                return;
            }
            console.log('Product loaded for ID', pId, product);
            renderProduct(product);
            return productDetailSupabase.from('reviews').select('*').eq('product_id', pId).order('created_at', { ascending: false });
        })
        .then(response => {
            if (!response) return;
            const { data: reviews } = response;
            const reviewHeader = document.querySelector('.dmt-js-review-header');
            const reviewContainer = document.querySelector('.dmt-js-reviews-container');
            if (reviewContainer) reviewContainer.innerHTML = '';
            if (reviewHeader) reviewHeader.innerText = reviews && reviews.length ? `Reviews (${reviews.length})` : 'There are no reviews yet.';
            if (!reviews || !reviews.length) return;
            reviews.forEach(review => {
                const card = document.createElement('div');
                card.className = 'dmt-review-item';
                card.innerHTML = `<strong>${review.user_name || 'Guest'}</strong> - <span>${review.rating || 0}/5</span><p>${review.comment || ''}</p>`;
                reviewContainer.appendChild(card);
            });
        })
        .catch(err => {
            console.error('Product page data error:', err);
        });
}

function loadHeaderFooter() {
    const headerPromise = fetch('../Header/Header.html').then(res => res.text()).then(html => {
        document.getElementById('global-header').innerHTML = html;
    });
    const footerPromise = fetch('../footer/footer.html').then(res => res.text()).then(html => {
        document.getElementById('global-footer').innerHTML = html;
    });
    return Promise.all([headerPromise, footerPromise]);
}

window.switchTab = switchTab;
window.addProductToCart = addProductToCart;
window.submitReview = submitReview;

document.addEventListener('DOMContentLoaded', async () => {
    await loadHeaderFooter();
    if (typeof initSupabaseAuth === 'function') initSupabaseAuth();
    if (typeof window.forceSyncHomeCart === 'function') window.forceSyncHomeCart();
    setActiveNav();
    loadProductData();
});
