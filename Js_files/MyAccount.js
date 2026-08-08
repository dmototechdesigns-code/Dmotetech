const SUPABASE_URL = "https://ycipxljvymewdltlblvn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljaXB4bGp2eW1ld2RsdGxibHZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzNzA5MzksImV4cCI6MjA5Nzk0NjkzOX0.dleDKMUuavLtA_pPKicnBexgGb4SqOGM7oU7QoEBm9I";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;
let currentActiveSection = 'orders';
let localAddressesArray = []; 

// --- 1. SESSION & USER AUTH GATE CHECK ---
async function initializeAppSession() {
    try {
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        if (error) throw error;

        if (!session) {
            alert("⚠️ Session expired or invalid! Please login first.");
            window.location.href = "./login.html"; 
            return;
        }

        currentUser = session.user;
        populateProfileDOM(currentUser);

        fetchOrdersFromSupabase();
        fetchAddressesFromSupabase();

    } catch (err) {
        console.error("Initialization Failed:", err.message);
    }
}

// --- 2. PROFILE DOM WRITING LAYER ---
function populateProfileDOM(user) {
    const metaName = user.user_metadata?.full_name || user.user_metadata?.name || "Rider App User";
    const metaPhone = user.user_metadata?.phone || user.phone || "Not Updated";
    const avatarLetters = metaName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();

    document.getElementById('hero-user-name').innerText = metaName;
    document.getElementById('hero-user-avatar').innerText = avatarLetters;

    document.getElementById('view-layer-name').innerText = metaName;
    document.getElementById('view-layer-email').innerText = user.email;
    document.getElementById('view-layer-phone').innerText = metaPhone;

    document.getElementById('input-layer-name').value = metaName;
    document.getElementById('input-layer-email').value = user.email;
    document.getElementById('input-layer-phone').value = metaPhone;
}

// --- 3. FETCH ORDERS DIRECTLY FROM DB ---
async function fetchOrdersFromSupabase() {
    const container = document.getElementById('orders-container');
    try {
        const { data: orders, error } = await supabaseClient
            .from('orders')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        if (!orders || orders.length === 0) {
            container.innerHTML = '<p class="dm-acc-loading"><i class="fa-solid fa-box-open"></i> No historical purchases found.</p>';
            return;
        }

        let htmlContent = '';
        orders.forEach(order => {
            const rawDate = new Date(order.created_at);
            const formattedDate = rawDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

            let productTitle = "Motorcycle Premium Accessory";
            let productImage = "https://images.unsplash.com/photo-1609630875171-b1321377ee65?q=80&w=150";
            let productMeta = "Premium Edition Pack";

            const variantText = order.size ? `Size: ${order.size}` : '';
            if (order.cart_data && order.cart_data.length > 0) {
                const firstItem = order.cart_data[0];
                const itemOptionText = firstItem.variant_label || firstItem.variant || firstItem.option || firstItem.size || '';
                productTitle = firstItem.title || firstItem.name || productTitle;
                productImage = firstItem.img || firstItem.image || productImage;
                productMeta = [variantText || itemOptionText ? `Size: ${order.size || itemOptionText}` : '', `Qty: ${firstItem.quantity || firstItem.qty || 1}`].filter(Boolean).join(' • ');
            } else if (variantText) {
                productMeta = variantText;
            }

            // Order Status Mapping
            let statusClass = order.status === 'paid' ? 'dm-acc-status-paid' : 'dm-acc-status-pending';
            let statusText = order.status === 'paid' ? 'Paid' : (order.status === 'transit' ? 'In Transit' : order.status);

            htmlContent += `
                <div class="dm-acc-order-card" onclick="openOrderDetails(${order.id})">
                    <div class="dm-acc-order-head">
                        <div class="dm-acc-order-id">Order <span>#DMT${order.id}</span></div>
                        <div class="dm-acc-order-date">Placed: <span>${formattedDate}</span></div>
                        <div class="dm-acc-order-total">Total: <span>₹${order.amount}</span></div>
                    </div>
                    <div class="dm-acc-order-body">
                        <div class="dm-acc-order-info">
                            <img src="${productImage}" alt="Item" onerror="this.src='https://images.unsplash.com/photo-1609630875171-b1321377ee65?q=80&w=150'">
                            <div>
                                <h4>${productTitle}</h4>
                                <p>${productMeta}</p>
                            </div>
                        </div>
                        <span class="dm-acc-status-tag ${statusClass}">${statusText}</span>
                    </div>
                </div>
            `;
        });
        container.innerHTML = htmlContent;
    } catch (err) {
        console.error("Orders Synced Exception:", err.message);
        container.innerHTML = `<p class="dm-acc-loading" style="color:#ef4444;"><i class="fa-solid fa-triangle-exclamation"></i> Sync Failed: ${err.message}</p>`;
    }
}

function openOrderDetails(orderId) {
    window.location.href = `../My_Account_page/MyAccount_Section/Order_detail.html?id=${orderId}`;
}

// --- 4. PROFILE UPDATE LOGIC ---
function switchProfileToEditMode() {
    document.querySelectorAll('.dm-acc-view-data, #edit-mode-trigger').forEach(el => el.classList.add('hidden-element'));
    document.querySelectorAll('#profile-master-form input, #form-action-controls').forEach(el => el.classList.remove('hidden-element'));
    document.getElementById('input-layer-email').classList.add('hidden-element'); 
}

function switchProfileToViewMode() {
    document.querySelectorAll('.dm-acc-view-data, #edit-mode-trigger').forEach(el => el.classList.remove('hidden-element'));
    document.querySelectorAll('#profile-master-form input, #form-action-controls').forEach(el => el.classList.add('hidden-element'));
}

async function handleProfileFormSubmit(event) {
    event.preventDefault();
    const btn = document.getElementById('profile-save-btn');
    const newName = document.getElementById('input-layer-name').value;
    const newPhone = document.getElementById('input-layer-phone').value;

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Updating...';

    try {
        const { data, error } = await supabaseClient.auth.updateUser({
            data: { full_name: newName, phone: newPhone }
        });

        if (error) throw error;

        currentUser = data.user;
        populateProfileDOM(currentUser);
        switchProfileToViewMode();
        alert('🎉 Profile credentials updated successfully!');
    } catch (err) {
        alert(`Error upgrading data profile: ${err.message}`);
    } finally {
        btn.disabled = false;
        btn.innerText = 'Save Configurations';
    }
}

// --- 5. SAVED ADDRESS ENGINE ---
async function fetchAddressesFromSupabase() {
    const renderHub = document.getElementById('address-list-render-hub');
    try {
        const { data, error } = await supabaseClient
            .from('addresses')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('is_default', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) throw error;
        localAddressesArray = data || [];
        renderAddressesUI();
    } catch (err) {
        renderHub.innerHTML = `<p class="dm-acc-loading" style="color:#ef4444;"><i class="fa-solid fa-circle-exclamation"></i> Error: ${err.message}</p>`;
    }
}

function renderAddressesUI() {
    const listHub = document.getElementById('address-list-render-hub');
    if (localAddressesArray.length === 0) {
        listHub.innerHTML = '<p class="dm-acc-loading">No saved addresses found. Add a new one above!</p>';
        return;
    }

    let htmlBuffer = "";
    localAddressesArray.forEach(addr => {
        htmlBuffer += `
            <div class="dm-acc-addr-card ${addr.is_default ? 'dm-acc-addr-primary' : ''}">
                <div class="dm-acc-addr-top">
                    <span class="dm-acc-addr-tag">${addr.address_type}</span>
                    ${addr.is_default ? '<span class="dm-acc-badge-primary">Primary</span>' : '<span class="dm-acc-badge-secondary">Secondary</span>'}
                </div>
                
                <h4 class="dm-acc-addr-name">${addr.receiver_name}</h4>
                <p class="dm-acc-addr-text">
                    <span>${addr.address_line1}</span>, <span>${addr.address_line2 || ''}</span><br>
                    ${addr.landmark ? `<span>Landmark: ${addr.landmark}</span><br>` : ''}
                    <span>${addr.city}</span>, <span>${addr.state}</span> - <strong>${addr.pincode}</strong><br>
                    <span class="dm-acc-addr-phone">
                        <i class="fa-solid fa-phone"></i> Mobile: <span>${addr.receiver_phone}</span>
                    </span>
                </p>
                
                <div class="dm-acc-addr-actions">
                    <button type="button" class="dm-acc-action-link dm-acc-action-edit" onclick="openEditAddressForm(${addr.id})">
                        <i class="fa-solid fa-pen-to-square"></i> Edit
                    </button>
                    
                    ${addr.is_default ?
                        `<button type="button" class="dm-acc-action-link dm-acc-action-locked" onclick="alert('🔒 Action Blocked: Primary Address ko direct delete nahi kiya ja sakta!')">
                            <i class="fa-solid fa-lock"></i> Delete Locked
                         </button>` :
                        `<button type="button" class="dm-acc-action-link dm-acc-action-delete" onclick="deleteAddressRow(${addr.id})">
                            <i class="fa-solid fa-trash-can"></i> Delete
                         </button>
                         <button type="button" class="dm-acc-action-link dm-acc-action-set-primary" onclick="makeThisAddressPrimary(${addr.id})">
                            <i class="fa-solid fa-circle-check"></i> Set Primary
                         </button>`
                    }
                </div>
            </div>
        `;
    });
    listHub.innerHTML = htmlBuffer;
}

function openNewAddressForm() {
    document.getElementById('form-action-title').innerText = "Add New Address";
    document.getElementById('input-eco-id').value = "";
    document.getElementById('input-eco-name').value = currentUser.user_metadata?.full_name || "";
    document.getElementById('input-eco-flat').value = "";
    document.getElementById('input-eco-area').value = "";
    document.getElementById('input-eco-pincode').value = "";
    document.getElementById('input-eco-city').value = "";
    document.getElementById('input-eco-state').value = "";
    document.getElementById('input-eco-phone').value = currentUser.user_metadata?.phone || "";

    document.getElementById('eco-address-form-container').classList.remove('hidden-element');
    document.getElementById('btn-show-add-form').classList.add('hidden-element');
}

function openEditAddressForm(dbId) {
    const target = localAddressesArray.find(a => a.id === dbId);
    if (!target) return;

    document.getElementById('form-action-title').innerText = "Edit Address Panel";
    document.getElementById('input-eco-id').value = target.id;
    document.getElementById('input-eco-tag').value = target.address_type;
    document.getElementById('input-eco-name').value = target.receiver_name;
    document.getElementById('input-eco-flat').value = target.address_line1;
    document.getElementById('input-eco-area').value = target.address_line2 || "";
    document.getElementById('input-eco-pincode').value = target.pincode;
    document.getElementById('input-eco-city').value = target.city;
    document.getElementById('input-eco-state').value = target.state;
    document.getElementById('input-eco-phone').value = target.receiver_phone;

    document.getElementById('eco-address-form-container').classList.remove('hidden-element');
    document.getElementById('btn-show-add-form').classList.add('hidden-element');
    window.scrollTo({ top: document.getElementById('eco-address-form-container').offsetTop - 100, behavior: 'smooth' });
}

function closeAddressForm() {
    document.getElementById('eco-address-form-container').classList.add('hidden-element');
    document.getElementById('btn-show-add-form').classList.remove('hidden-element');
}

async function handleAddressFormSubmit(event) {
    event.preventDefault();
    const btn = document.getElementById('address-save-btn');
    const dbId = document.getElementById('input-eco-id').value;

    const payload = {
        user_id: currentUser.id,
        address_type: document.getElementById('input-eco-tag').value,
        receiver_name: document.getElementById('input-eco-name').value,
        address_line1: document.getElementById('input-eco-flat').value,
        address_line2: document.getElementById('input-eco-area').value,
        pincode: document.getElementById('input-eco-pincode').value,
        city: document.getElementById('input-eco-city').value,
        state: document.getElementById('input-eco-state').value,
        receiver_phone: document.getElementById('input-eco-phone').value,
    };

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Syncing...';

    try {
        if (dbId) {
            const { error } = await supabaseClient.from('addresses').update(payload).eq('id', dbId);
            if (error) throw error;
        } else {
            payload.is_default = (localAddressesArray.length === 0);
            const { error } = await supabaseClient.from('addresses').insert([payload]);
            if (error) throw error;
        }

        closeAddressForm();
        await fetchAddressesFromSupabase(); 
    } catch (err) {
        alert(`Database transaction rejected: ${err.message}`);
    } finally {
        btn.disabled = false;
        btn.innerText = 'Save Address';
    }
}

async function makeThisAddressPrimary(dbId) {
    try {
        await supabaseClient.from('addresses').update({ is_default: false }).eq('user_id', currentUser.id);
        const { error } = await supabaseClient.from('addresses').update({ is_default: true }).eq('id', dbId);
        if (error) throw error;

        await fetchAddressesFromSupabase();
        alert("🎯 Default Primary Delivery Address successfully updated!");
    } catch (err) {
        alert(`Security error changing default status: ${err.message}`);
    }
}

async function deleteAddressRow(dbId) {
    if (confirm("Kya aap such mein yeh address records se permanently hatana chahte hain?")) {
        try {
            const { error } = await supabaseClient.from('addresses').delete().eq('id', dbId);
            if (error) throw error;
            await fetchAddressesFromSupabase();
        } catch (err) {
            alert(`Deletion operation failed: ${err.message}`);
        }
    }
}

document.getElementById('input-eco-pincode').addEventListener('input', function () {
    this.value = this.value.replace(/[^0-9]/g, '');
});

document.addEventListener("DOMContentLoaded", initializeAppSession);

// --- 6. STANDARD VIEW NAV ROUTING HUB ---
function routeToAccountSection(sectionId, clickedButton) {
    currentActiveSection = sectionId;
    const isMobile = window.innerWidth < 900;
    
    document.querySelectorAll('.dm-acc-panel').forEach(box => {
        box.classList.remove('desktop-active', 'mobile-active');
        box.style.display = 'none';
    });
    
    document.querySelectorAll('.dm-acc-nav-item').forEach(btn => btn.classList.remove('desktop-active'));

    const targetPanel = document.getElementById(`sect-${sectionId}`);

    if (isMobile) {
        document.getElementById('sidebar-navigation-hub').style.display = 'none';
        document.getElementById('mobileBackBtn').style.display = 'flex';
        targetPanel.classList.add('mobile-active');
    } else {
        clickedButton.classList.add('desktop-active');
        targetPanel.classList.add('desktop-active');
    }
    
    targetPanel.style.display = 'block';
}

function returnBackToMenuList() {
    document.getElementById('sidebar-navigation-hub').style.display = 'flex';
    document.getElementById('mobileBackBtn').style.display = 'none';
    const activePanel = document.getElementById(`sect-${currentActiveSection}`);
    activePanel.classList.remove('mobile-active');
    activePanel.style.display = 'none';
}

window.addEventListener('resize', () => {
    if (window.innerWidth >= 900) {
        document.getElementById('sidebar-navigation-hub').style.display = 'flex';
        document.getElementById('mobileBackBtn').style.display = 'none';
        document.querySelectorAll('.dm-acc-panel').forEach(box => {
            box.classList.remove('mobile-active');
            if (box.id === `sect-${currentActiveSection}`) {
                box.classList.add('desktop-active');
                box.style.display = 'block';
            } else {
                box.style.display = 'none';
            }
        });
    }
});

async function handleLogoutSystem() {
    if (confirm("Confirm safe exit out of system session?")) {
        await supabaseClient.auth.signOut();
        window.location.href = "../index.html";
    }
}