// Import Supabase Client from your centralized configuration file
import { client as dochakiClient } from '../Config/Supabse_config.js';

let currentViewState = 'brands';
let cachedCategoriesData = [];
let activeCategoryId = null;
let activeCategoryName = "";

// 1. Load main brands
async function loadDochakiBrands() {
    showLoader(true);
    currentViewState = 'brands';
    
    const titleEl = document.getElementById('main-shop-title');
    if (titleEl) titleEl.innerText = "Shop By Motor Cycle";

    try {
        const { data, error } = await dochakiClient
            .from('categories')
            .select('id, name, slug, image_url')
            .order('id', { ascending: true });

        if (error) throw error;

        cachedCategoriesData = data;
        renderTabsBar(data, 'brands');
        renderGridUI(data, 'brands');

    } catch (err) {
        console.error("Supabase Error:", err.message);
        const loadStateEl = document.getElementById('dks-shp-loading-state');
        if (loadStateEl) loadStateEl.innerText = "Failed to sync dashboard database data.";
    } finally {
        showLoader(false);
    }
}

// 2. Fetch Sub-categories
async function loadSubCategories(categoryId, categoryName) {
    showLoader(true);
    currentViewState = 'subcategories';
    activeCategoryId = categoryId;
    activeCategoryName = categoryName;
    
    const titleEl = document.getElementById('main-shop-title');
    if (titleEl) titleEl.innerText = categoryName;

    try {
        const { data, error } = await dochakiClient
            .from('sub_categories')
            .select('id, name, slug, image_url')
            .eq('category_id', categoryId)
            .order('id', { ascending: true });

        if (error) throw error;

        renderTabsBar(data, 'subcategories');
        renderGridUI(data, 'subcategories');

    } catch (err) {
        console.error("Error loading subcategories:", err.message);
    } finally {
        showLoader(false);
    }
}

// 3. Dynamic Slider Bar Tabs Generator Engine (Using unique dks-shp- styles)
function renderTabsBar(items, context) {
    const container = document.getElementById('category-tabs-container');
    if (!container) return;
    container.innerHTML = '';

    if (context === 'brands') {
        const allButton = document.createElement('button');
        allButton.className = 'dks-shp-category-tab dks-shp-active-tab';
        allButton.innerText = 'All Brands';
        allButton.onclick = function (e) { filterFrontendItems('all', e); };
        container.appendChild(allButton);

        items.forEach(item => {
            const button = document.createElement('button');
            button.className = 'dks-shp-category-tab';
            button.innerText = item.name;
            button.onclick = function (e) { filterFrontendItems(item.slug, e); };
            container.appendChild(button);
        });
    } else if (context === 'subcategories') {
        const backButton = document.createElement('button');
        backButton.className = 'dks-shp-category-tab';
        backButton.style.background = '#f1f5f9';
        backButton.innerText = '⬅️ Back to Brands';
        backButton.onclick = function () { loadDochakiBrands(); };
        container.appendChild(backButton);

        const allSubButton = document.createElement('button');
        allSubButton.className = 'dks-shp-category-tab dks-shp-active-tab';
        allSubButton.innerText = 'All Sub-Categories';
        allSubButton.onclick = function (e) { filterFrontendItems('all', e); };
        container.appendChild(allSubButton);

        items.forEach(item => {
            const button = document.createElement('button');
            button.className = 'dks-shp-category-tab';
            button.innerText = item.name;
            button.onclick = function (e) { filterFrontendItems(item.slug, e); };
            container.appendChild(button);
        });
    }
}

// 4. Matrix UI Grid Renderer Core (Updated with Premium classes mapping)
function renderGridUI(items, context) {
    const grid = document.getElementById('product-grid');
    const countEl = document.getElementById('product-count');
    if (!grid) return;
    grid.innerHTML = '';

    if (!items || items.length === 0) {
        grid.innerHTML = `<p style="grid-column: span 4; text-align: center; color: #64748b; padding: 40px; font-weight: 500;">No items found in this section yet.</p>`;
        if (countEl) countEl.innerText = `Showing 0 items`;
        return;
    }

    items.forEach(item => {
        let actionAttr = "";

        if (context === 'brands') {
            actionAttr = `window.loadSubCategories(${item.id}, '${item.name.replace(/'/g, "\\'")}')`;
        } else if (context === 'subcategories') {
            actionAttr = `window.location.href = '../Product/products.html?sub_id=${item.id}'`;
        }

        const cardHTML = `
            <div class="dks-shp-product-card" data-category="${item.slug}" onclick="${actionAttr}">
                <div class="dks-shp-img-container">
                    <img src="${item.image_url}" alt="${item.name}" onerror="this.src='https://dmototech.co.in/wp-content/uploads/2026/01/G-310-GS.webp'">
                </div>
                <div class="dks-shp-card-content">
                    <h3 class="dks-shp-prod-name">${item.name}</h3>
                    <button class="dks-shp-buy-btn" style="margin-top: auto;">Explore Details</button>
                </div>
            </div>
        `;
        grid.innerHTML += cardHTML;
    });

    if (countEl) countEl.innerText = `Showing all ${items.length} premium ${context}`;
}

// 5. Instant Filter Action for Tabs
function filterFrontendItems(slug, event) {
    const tabs = document.querySelectorAll('.dks-shp-category-tab');
    tabs.forEach(tab => tab.classList.remove('dks-shp-active-tab'));

    if (event && event.currentTarget) {
        event.currentTarget.classList.add('dks-shp-active-tab');
    }

    const cards = document.querySelectorAll('.dks-shp-product-card');
    let visibleCount = 0;

    cards.forEach(card => {
        const itemSlug = card.getAttribute('data-category');
        if (slug === 'all' || itemSlug === slug) {
            card.style.display = 'flex';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });

    const countEl = document.getElementById('product-count');
    if (countEl) countEl.innerText = `Showing ${visibleCount} matches`;
}

function showLoader(displayState) {
    const loader = document.getElementById('dks-shp-loading-state');
    if (loader) {
        loader.style.display = displayState ? 'block' : 'none';
    }
}

// Expose vital workflow methods to global window context for layout compatibility
window.loadSubCategories = loadSubCategories;
window.loadDochakiBrands = loadDochakiBrands;

// Start initialization on window load
window.addEventListener('DOMContentLoaded', loadDochakiBrands);