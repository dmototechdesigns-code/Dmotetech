let currentProduct = null;

const ProductView = {
    renderProductDetails(product) {
        if (!product) return;
        currentProduct = product;
        const img = document.querySelector('.dmt-js-img');
        const title = document.querySelector('.dmt-js-title');
        const price = document.querySelector('.dmt-js-price');
        const shortDesc = document.querySelector('.dmt-js-short-desc');
        const heroFeatures = document.querySelector('.dmt-js-hero-features');
        const boltSelect = document.querySelector('.dmt-js-bolt-select');
        const longDesc = document.querySelector('.dmt-js-long-desc');
        const featuresList = document.querySelector('.dmt-js-features-list');

        if (img) { img.src = product.image_url || ''; img.style.display = product.image_url ? 'block' : 'none'; }
        if (title) title.innerText = product.name || 'Product';
        if (price) price.innerText = product.price ? `₹${Number(product.price).toLocaleString('en-IN')}` : '₹0';
        if (shortDesc) shortDesc.innerHTML = product.description_1 || '';
        if (longDesc) longDesc.innerHTML = product.description_2 || '';

        function normalizeFeatureItems(value) {
            if (!value) return [];
            if (Array.isArray(value)) return value;
            if (typeof value === 'string') {
                const cleaned = value.trim();
                if (!cleaned) return [];
                const separators = /[\r\n]+|•|\*/;
                return cleaned
                    .split(separators)
                    .map(item => item.trim())
                    .filter(Boolean);
            }
            if (typeof value === 'object') {
                return Object.values(value).map(val => String(val).trim()).filter(Boolean);
            }
            return [String(value).trim()];
        }

        if (heroFeatures) {
            heroFeatures.innerHTML = '';
            const arr = normalizeFeatureItems(product.keyfeatures_1 || product.keyfeatures || []);
            arr.forEach(f => {
                const li = document.createElement('li');
                li.innerHTML = f;
                heroFeatures.appendChild(li);
            });
        }

        if (featuresList) {
            featuresList.innerHTML = '';
            const arr2 = normalizeFeatureItems(product.keyfeatures_2 || []);
            arr2.forEach(f => {
                const li = document.createElement('li');
                li.innerHTML = f;
                featuresList.appendChild(li);
            });
        }

        if (boltSelect) {
            boltSelect.innerHTML = '<option value="">Choose an option</option>';
            const sizes = product.bolt_sizes || product.sizes || [];
            if (Array.isArray(sizes) && sizes.length > 0) {
                sizes.forEach(s => {
                    const opt = document.createElement('option');
                    opt.value = s;
                    opt.innerText = s;
                    boltSelect.appendChild(opt);
                });
                document.querySelector('.dmt-js-bolt-row')?.classList.remove('hidden');
            } else {
                document.querySelector('.dmt-js-bolt-row')?.classList.add('hidden');
            }
        }
    },
    renderReviews(reviews) {
        const container = document.querySelector('.dmt-js-reviews-container');
        const header = document.querySelector('.dmt-js-review-header');
        if (!container) return;
        container.innerHTML = '';
        if (!reviews || reviews.length === 0) {
            if (header) header.innerText = 'There are no reviews yet.';
            return;
        }
        if (header) header.innerText = `Reviews (${reviews.length})`;
        reviews.forEach(r => {
            const card = document.createElement('div');
            card.className = 'dmt-review-item';
            card.innerHTML = `<strong>${r.user_name || 'Guest'}</strong> - <span>${r.rating || 0}/5</span><p>${r.comment || ''}</p>`;
            container.appendChild(card);
        });
    },
    clearReviewForm() {
        const nameInput = document.querySelector('.dmt-js-input-name');
        const ratingSelect = document.querySelector('.dmt-js-input-rating');
        const commentTextArea = document.querySelector('.dmt-js-input-comment');
        if (nameInput) nameInput.value = '';
        if (ratingSelect) ratingSelect.value = '';
        if (commentTextArea) commentTextArea.value = '';
    }
};

window.ProductView = ProductView;