
// 1. Initialize Supabase Directly
const SUPABASE_URL = "https://ycipxljvymewdltlblvn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljaXB4bGp2eW1ld2RsdGxibHZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzNzA5MzksImV4cCI6MjA5Nzk0NjkzOX0.dleDKMUuavLtA_pPKicnBexgGb4SqOGM7oU7QoEBm9I";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentSession = null;
let homeCartItems = [];

// ——— Path Utility ———
function getProjectPath(relativePath) {
    const path = window.location.pathname.replace(/\\/g, "/");
    const segments = path.split("/").filter(Boolean);
    if (segments.length <= 1) return `./${relativePath}`;
    return `${"../".repeat(segments.length - 1)}${relativePath}`;
}

// ——— Mobile Nav ———
function toggleMobileNav() {
    const panel = document.getElementById("mobileNavPanel");
    const overlay = document.getElementById("mobileNavOverlay");
    if (!panel || !overlay) return;
    const opening = !panel.classList.contains("active");
    panel.classList.toggle("active", opening);
    overlay.classList.toggle("active", opening);
    document.body.style.overflow = opening ? "hidden" : "";
}

function closeMobileNav() {
    const panel = document.getElementById("mobileNavPanel");
    const overlay = document.getElementById("mobileNavOverlay");
    if (!panel || !overlay) return;
    panel.classList.remove("active");
    overlay.classList.remove("active");
    document.body.style.overflow = "";
}

// ——— Profile Dropdown ———
function toggleProfileDropdown() {
    const dropdown = document.getElementById("dmt-profile-dropdown");
    if (dropdown) dropdown.classList.toggle("active");
}

// Close dropdown if clicked outside
document.addEventListener("click", (e) => {
    const wrapper = document.getElementById("dmt-profile-wrapper");
    const dropdown = document.getElementById("dmt-profile-dropdown");
    if (wrapper && dropdown && !wrapper.contains(e.target)) {
        dropdown.classList.remove("active");
    }
});

// ——— Supabase Auth Init ———
async function initSupabaseAuth() {
    try {
        if (!supabaseClient) return;
        const { data } = await supabaseClient.auth.getSession();
        updateAuthUI(data.session);
        supabaseClient.auth.onAuthStateChange((event, session) => {
            updateAuthUI(session);
        });
    } catch (err) {
        console.error("Supabase Init Error:", err);
    }
}

function updateAuthUI(session) {
    currentSession = session;
    const desktopGroup = document.getElementById("dmt-auth-buttons-group");
    const profileWrapper = document.getElementById("dmt-profile-wrapper");
    const mobileContainer = document.getElementById("dmt-mobile-auth-container");

    const isLoggedIn = Boolean(session && session.user);
    const loginHref = getProjectPath("Auth/Login/Login.html");
    const signupHref = getProjectPath("Auth/Signup/Signup.html");

    // Desktop UI Logic
    if (desktopGroup && profileWrapper) {
        if (isLoggedIn) {
            const initial = (session.user.email || "U").charAt(0).toUpperCase();
            document.getElementById("dmt-profile-avatar").innerText = initial;
            document.getElementById("dmt-dropdown-email").innerText = session.user.email || "User";

            desktopGroup.style.display = "none"; // Hide login/signup buttons
            profileWrapper.style.display = "block"; // Show avatar
        } else {
            desktopGroup.style.display = "flex"; // Show login/signup buttons
            profileWrapper.style.display = "none"; // Hide avatar
            desktopGroup.innerHTML = `
                        <a href="${loginHref}" class="dmt-auth-btn" style="text-decoration:none;">
                            <i class="fa-solid fa-user"></i> Login
                        </a>
                        <a href="${signupHref}" class="dmt-auth-btn dmt-auth-primary" style="text-decoration:none;">
                            Signup
                        </a>
                    `;
        }
    }

    // Mobile UI Logic
    if (mobileContainer) {
        if (isLoggedIn) {
            const initial = (session.user.email || "U").charAt(0).toUpperCase();
            mobileContainer.innerHTML = `
                        <div class="dmt-mobile-auth-user">
                            <div class="dmt-mobile-auth-user-avatar">${initial}</div>
                            <div class="dmt-mobile-auth-user-info">
                                <div class="dmt-mobile-auth-user-name">${session.user.email || "User"}</div>
                                <div class="dmt-mobile-auth-user-email">Logged In</div>
                            </div>
                        </div>
                        <a href="${getProjectPath("My_Account_page/My_account.html")}" class="dmt-auth-btn" style="width:100%;justify-content:center;text-decoration:none;">
                            <i class="fa-solid fa-gear"></i> My Account
                        </a>
                        <button class="dmt-mobile-auth-logout-btn" onclick="logoutUser()">
                            <i class="fa-solid fa-right-from-bracket" style="margin-right:6px;"></i> Logout
                        </button>
                    `;
        } else {
            mobileContainer.innerHTML = `
                        <a href="${loginHref}" class="dmt-auth-btn" style="width:100%;justify-content:center;text-decoration:none;">
                            <i class="fa-solid fa-user"></i> Login
                        </a>
                        <a href="${signupHref}" class="dmt-auth-btn dmt-auth-primary" style="width:100%;justify-content:center;text-decoration:none;">
                            Sign Up
                        </a>
                    `;
        }
    }
}

async function logoutUser() {
    try {
        if (supabaseClient) {
            const { error } = await supabaseClient.auth.signOut();
            if (error) throw error;
        }
        window.location.href = getProjectPath("index.html");
    } catch (err) {
        console.error("Logout Failed:", err);
        showToast("Logout failed. Try again.");
    }
}

// ——— Cart System ———
function toggleCartDrawer() {
    const drawer = document.getElementById("cartDrawer");
    const overlay = document.getElementById("cartOverlay");
    if (!drawer || !overlay) return;
    forceSyncHomeCart();
    const opening = !drawer.classList.contains("active");
    drawer.classList.toggle("active", opening);
    overlay.classList.toggle("active", opening);
    document.body.style.overflow = opening ? "hidden" : "";
}

function forceSyncHomeCart() {
    homeCartItems = JSON.parse(localStorage.getItem("dochaki_cart")) || [];
    const container = document.getElementById("cartDrawerContainer");
    const subCount = document.getElementById("dmt-cart-drawer-subcount");
    const footerTotal = document.getElementById("dmt-cart-drawer-total");
    const footer = document.getElementById("cartDrawerFooter");
    const badge = document.getElementById("dmt-header-cart-count");

    let totalCount = 0;
    let totalPriceSum = 0;

    if (homeCartItems.length === 0) {
        if (container) {
            container.innerHTML = `
                    <div class="dmt-cart-empty-state">
                        <div class="dmt-cart-empty-icon"><i class="fa-solid fa-cart-shopping"></i></div>
                        <div class="dmt-cart-empty-title">Your cart is empty</div>
                        <div class="dmt-cart-empty-desc">Browse products and add something you love.</div>
                        <a href="${getProjectPath("Shop/Shop.html")}" class="dmt-cart-empty-shop-btn">
                            <i class="fa-solid fa-arrow-right"></i> Start Shopping
                        </a>
                    </div>`;
        }
        if (subCount) subCount.textContent = "0 Items";
        if (footerTotal) footerTotal.textContent = "₹0";
        if (badge) { badge.style.display = "none"; badge.textContent = "0"; }
        if (footer) footer.style.display = "none";
        return;
    }

    if (container) container.innerHTML = ""; // Clear before rendering
    if (footer) footer.style.display = "block";

    homeCartItems.forEach((item, index) => {
        const itemPrice = Number(String(item.price).replace(/[^0-9.-]+/g, "")) || 0;
        const itemQty = parseInt(item.qty, 10) || 0;
        totalCount += itemQty;
        totalPriceSum += itemPrice * itemQty;

        if (container) {
            container.innerHTML += `
                    <div class="dmt-cart-item-card" style="animation-delay:${index * 0.05}s">
                        <button class="dmt-cart-item-remove" onclick="removeHomeCartItem(${item.id})" title="Remove">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                        <img src="${item.img || "https://picsum.photos/seed/moto" + index + "/160/160.jpg"}" class="dmt-cart-item-img" alt="${item.name}">
                        <div class="dmt-cart-item-details">
                            <div>
                                <div class="dmt-cart-item-name">${item.name}</div>
                                <div class="dmt-cart-item-variant">${[
                                    item.variant_label || item.variant || item.option || item.size ? `Option: ${item.variant_label || item.variant || item.option || item.size}` : '',
                                    `Qty: ${itemQty}`
                                ].filter(Boolean).join(" • ")}</div>
                            </div>
                            <div class="dmt-cart-item-bottom">
                                <span class="dmt-cart-item-price">₹${(itemPrice * itemQty).toLocaleString("en-IN")}</span>
                                <div class="dmt-cart-item-qty-controls">
                                    <button class="dmt-cart-qty-btn" onclick="changeHomeCartQty(${item.id}, -1)">
                                        <i class="fa-solid fa-minus" style="font-size:10px;"></i>
                                    </button>
                                    <span class="dmt-cart-qty-value">${itemQty}</span>
                                    <button class="dmt-cart-qty-btn" onclick="changeHomeCartQty(${item.id}, 1)">
                                        <i class="fa-solid fa-plus" style="font-size:10px;"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>`;
        }
    });

    if (subCount) subCount.textContent = `${totalCount} Item${totalCount !== 1 ? "s" : ""}`;
    if (footerTotal) footerTotal.textContent = `₹${totalPriceSum.toLocaleString("en-IN")}`;
    if (badge) {
        badge.textContent = String(totalCount);
        badge.style.display = totalCount > 0 ? "inline-block" : "none";
    }
}

function changeHomeCartQty(productId, delta) {
    const item = homeCartItems.find(i => i.id === productId);
    if (!item) return;
    item.qty = (parseInt(item.qty, 10) || 0) + delta;
    if (item.qty <= 0) {
        homeCartItems = homeCartItems.filter(i => i.id !== productId);
    }
    localStorage.setItem("dochaki_cart", JSON.stringify(homeCartItems));
    forceSyncHomeCart();
    window.dispatchEvent(new Event("storage"));
}

function removeHomeCartItem(productId) {
    homeCartItems = homeCartItems.filter(item => item.id !== productId);
    localStorage.setItem("dochaki_cart", JSON.stringify(homeCartItems));
    forceSyncHomeCart();
    window.dispatchEvent(new Event("storage"));
}

// ——— PAYMENT / CHECKOUT LOGIC ———
async function triggerRazorpayCheckout() {
    if (homeCartItems.length === 0) {
        showToast("Your cart is empty!");
        return;
    }

    // REAL LOGIN CHECK BEFORE PAYMENT
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        showToast("Please login to proceed to checkout!");
        setTimeout(() => {
            window.location.href = getProjectPath("../Auth/Login/Login.html");
        }, 1500);
        return;
    }

    // If logged in, proceed to checkout
    window.location.href = getProjectPath("../CheckOut_Page/checkout.html");
}

// ——— Toast Notification ———
function showToast(message) {
    const existing = document.querySelector(".dmt-toast");
    if (existing) existing.remove();
    const toast = document.createElement("div");
    toast.className = "dmt-toast";
    toast.innerHTML = `<i class="fa-solid fa-circle-check" style="color:#16a34a;font-size:16px;"></i>${message}`;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("show"));
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 350);
    }, 2500);
}

// ——— Active Nav Highlight ———
function setActiveNav() {
    const currentPath = window.location.pathname;
    document.querySelectorAll(".dmt-web-link, .dmt-mobile-nav-links a").forEach(link => {
        const href = link.getAttribute("href");
        if (!href || href === "#") return;
        link.classList.remove("active");
        const cleaned = href.replace("../", "").replace("./", "");
        if (currentPath.endsWith(cleaned) || currentPath.includes(cleaned)) {
            link.classList.add("active");
        }
    });
}

// ——— Keyboard Events ———
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        closeMobileNav();
        const drawer = document.getElementById("cartDrawer");
        if (drawer && drawer.classList.contains("active")) toggleCartDrawer();

        const dropdown = document.getElementById("dmt-profile-dropdown");
        if (dropdown) dropdown.classList.remove("active");
    }
});

// ——— Initial Load ———
forceSyncHomeCart();
document.addEventListener("DOMContentLoaded", () => {
    forceSyncHomeCart();
    initSupabaseAuth();
    setActiveNav();
});

// Sync cart if changed in another tab
window.addEventListener("storage", (e) => {
    if (!e.key || e.key === "dochaki_cart") {
        forceSyncHomeCart();
    }
});
