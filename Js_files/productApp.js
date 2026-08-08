// productApp.js - Main Application Logic (Module)
import { client } from '../Config/Supabse_config.js';

let currentProduct = null;

// URL se ID nikalne ke liye
function getParamId() {
    return new URLSearchParams(window.location.search).get('id');
}

// Global Supabase Client accessor
function getDbClient() {
    return client || window.client || null;
}

// 2. Add Product to Cart Mechanism
function addProductToCart() {
    if (!currentProduct) {
        alert('Product information is still loading. Please wait a moment.');
        return;
    }

    const qtyInput = document.querySelector('.dmt-qty-input');
    const variantSelect = document.querySelector('.dmt-js-bolt-select');
    const quantity = qtyInput ? parseInt(qtyInput.value, 10) : 1;
    const selectedVariant = variantSelect ? variantSelect.value : '';

    if (!Number.isInteger(quantity) || quantity < 1) {
        alert('Please enter a valid quantity.');
        return;
    }

    if (variantSelect && variantSelect.options.length > 1 && !selectedVariant) {
        alert('Please choose a bolt size before adding to cart.');
        return;
    }

    const cartKey = 'dochaki_cart';
    const cartItems = JSON.parse(localStorage.getItem(cartKey)) || [];
    const itemPrice = Number(currentProduct.price) || 0;

    const existingIndex = cartItems.findIndex(item => item.id === currentProduct.id && item.variant === selectedVariant);

    if (existingIndex !== -1) {
        cartItems[existingIndex].qty = (parseInt(cartItems[existingIndex].qty, 10) || 0) + quantity;
    } else {
        cartItems.push({
            id: currentProduct.id,
            name: currentProduct.name,
            price: itemPrice,
            img: currentProduct.image_url,
            qty: quantity,
            variant: selectedVariant
        });
    }

    localStorage.setItem(cartKey, JSON.stringify(cartItems));
    alert('Product added to cart successfully.');

    if (typeof window.forceSyncHomeCart === 'function') {
        window.forceSyncHomeCart();
    }
}

// 3. Tab Navigation Engine
function switchTab(event, panelId) {
    document.querySelectorAll('.dmt-tab-content-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.dmt-js-tab-btn').forEach(t => t.classList.remove('active'));

    const targetPanel = document.getElementById(panelId);
    if (targetPanel) targetPanel.classList.add('active');
    
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
}

// 4. Load Product Details & Reviews From Configured Supabase Client
async function loadProductFullData() {
    const pId = getParamId();
    if (!pId) return;

    const dbClient = getDbClient();
    if (!dbClient) {
        console.error("Supabase client database connection initialization error!");
        return;
    }

    try {
        // Step A: Fetch product master entry
        const { data: product, error: prodError } = await dbClient
            .from('products')
            .select('*')
            .eq('id', pId)
            .single();

        if (prodError) throw prodError;
        currentProduct = product;

        // Render layout properties via view engine safely
        const viewInstance = window.ProductView || (typeof ProductView !== 'undefined' ? ProductView : null);
        if (viewInstance && typeof viewInstance.renderProductDetails === 'function') {
            viewInstance.renderProductDetails(product);
        }

        // Step B: Fetch dynamic reviews matrix
        const { data: reviews, error: revError } = await dbClient
            .from('reviews')
            .select('*')
            .eq('product_id', pId)
            .order('created_at', { ascending: false });

        if (revError) throw revError;

        // Render reviews via view engine
        if (viewInstance && typeof viewInstance.renderReviews === 'function') {
            viewInstance.renderReviews(reviews);
        }

    } catch (err) {
        console.error("Data loading failed from Supabase client: ", err.message || err);
    }
}

// 5. Submit Dynamic Reviews Functionality
async function submitReview() {
    const pId = getParamId();
    const dbClient = getDbClient();
    const nameInput = document.querySelector('.dmt-js-input-name');
    const ratingSelect = document.querySelector('.dmt-js-input-rating');
    const commentTextArea = document.querySelector('.dmt-js-input-comment');

    const userName = nameInput ? nameInput.value.trim() : '';
    const rating = ratingSelect ? ratingSelect.value : '';
    const comment = commentTextArea ? commentTextArea.value.trim() : '';

    if (!pId || !dbClient) return;
    if (!userName || !rating || !comment) {
        alert("Please fill all fields and provide a rating.");
        return;
    }

    try {
        const { error } = await dbClient
            .from('reviews')
            .insert([
                {
                    product_id: parseInt(pId, 10),
                    user_name: userName,
                    rating: parseInt(rating, 10),
                    comment: comment
                }
            ]);

        if (error) throw error;

        alert("Thank you! Your review has been submitted successfully.");
        
        const viewInstance = window.ProductView || (typeof ProductView !== 'undefined' ? ProductView : null);
        if (viewInstance && typeof viewInstance.clearReviewForm === 'function') {
            viewInstance.clearReviewForm();
        }
        
        // Refresh component feed logs instantly
        loadProductFullData();

    } catch (err) {
        alert("Error submitting review: " + (err.message || err));
    }
}

// 6. Mandatory Global Window Binding for Inline HTML Onclick Frameworks
window.switchTab = switchTab;
window.submitReview = submitReview;
window.addProductToCart = addProductToCart;

// 7. Initializer Listener Hook Execution
document.addEventListener('DOMContentLoaded', () => {
    loadProductFullData();
});