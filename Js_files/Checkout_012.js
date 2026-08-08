let selectedPaymentMethod = 'online';
let calculatedCartTotal = 0;
let totalOriginalMrp = 0;
let checkoutSupabase = null;
let currentUserId = null;
let hasSavedAddress = false;
let loadedSavedAddressObj = null;
const COD_SHIPPING_CHARGE = 83;

const CHECKOUT_URL = "https://ycipxljvymewdltlblvn.supabase.co";
const CHECKOUT_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljaXB4bGp2eW1ld2RsdGxibHZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzNzA5MzksImV4cCI6MjA5Nzk0NjkzOX0.dleDKMUuavLtA_pPKicnBexgGb4SqOGM7oU7QoEBm9I";

try {
    if (CHECKOUT_URL && CHECKOUT_URL.startsWith('http')) {
        checkoutSupabase = window.supabase.createClient(CHECKOUT_URL, CHECKOUT_KEY);
    }
} catch (e) {
    console.error("Supabase Initialization Error:", e);
}

async function initCheckoutPage() {
    renderCheckoutOverview();
    if (!checkoutSupabase) return;

    const { data: { user }, error: userError } = await checkoutSupabase.auth.getUser();
    if (!user || userError) {
        alert("🔒 Secure Checkout: Please login to complete your order transaction.");
        window.location.href = "../My_Account_page/login.html";
        return;
    }
    currentUserId = user.id;
    document.getElementById("email-address").value = user.email || '';

    await checkUserSavedAddressInDatabase();
}

async function checkUserSavedAddressInDatabase() {
    try {
        const { data, error } = await checkoutSupabase
            .from('addresses')
            .select('*')
            .eq('user_id', currentUserId)
            .eq('is_default', true)
            .maybeSingle();

        if (error) throw error;

        if (data) {
            hasSavedAddress = true;
            loadedSavedAddressObj = data;

            document.getElementById("lbl-addr-type").innerText = data.address_type || 'Home';
            document.getElementById("lbl-receiver-name").innerText = data.receiver_name;
            document.getElementById("lbl-full-address").innerText = `${data.address_line1}, ${data.address_line2 ? data.address_line2 + ',' : ''} ${data.city}, ${data.state} - ${data.pincode}`;
            document.getElementById("lbl-receiver-phone").innerText = `📞 Phone: ${data.receiver_phone}`;

            document.getElementById("saved-address-view").style.display = "block";
            document.getElementById("billing-form-fields").style.display = "none";
            document.getElementById("address-section-desc").innerText = "Shipping package will be safely delivered to your primary profile address.";
        } else {
            forceShowAddressForm();
        }
    } catch (err) {
        console.error("Failed to query user records address state:", err.message);
        forceShowAddressForm();
    }
}

function forceShowAddressForm() {
    hasSavedAddress = false;
    document.getElementById("saved-address-view").style.display = "none";
    document.getElementById("billing-form-fields").style.display = "block";
    document.getElementById("address-section-desc").innerText = "Please enter your correct address details to process shipping.";
    toggleFormInputsRequired(true);
}

function toggleFormInputsRequired(status) {
    const inputs = document.querySelectorAll("#billing-form-fields input");
    inputs.forEach(el => {
        if (el.id !== 'email-address') el.required = status;
    });
}

function renderCheckoutOverview() {
    const activeCartItems = JSON.parse(localStorage.getItem('dochaki_cart')) || [];
    const listContainer = document.getElementById('checkoutItemsTarget');

    if (activeCartItems.length === 0) {
        alert("Your cart is empty!");
        window.location.href = "../index.html";
        return;
    }

    listContainer.innerHTML = '';
    calculatedCartTotal = 0;
    totalOriginalMrp = 0;

    activeCartItems.forEach(item => {
        const itemSalePrice = Number(item.price) || 0;
        const itemOriginalPrice = Number(item.old_price || item.original_price) || itemSalePrice;

        calculatedCartTotal += (itemSalePrice * item.qty);
        totalOriginalMrp += ((itemOriginalPrice > itemSalePrice ? itemOriginalPrice : itemSalePrice) * item.qty);

        const defaultFallback = 'https://dmototech.co.in/wp-content/uploads/2026/01/G-310-GS.webp';
        const imageSrc = item.img ? item.img : defaultFallback;

        const variantText = item.variant_label || item.variant || item.option || item.size || '';
        const itemMarkup = `
            <div class="dm-chk-summary-product-item">
                <img src="${imageSrc}" alt="${item.name}">
                <div class="dm-chk-p-info">
                    <h5>${item.name}</h5>
                    <p>${variantText ? `Option: ${variantText}` : 'Option: Standard'}</p>
                    <p>Qty: ${item.qty}</p>
                </div>
                <div class="dm-chk-p-item-price">₹${(itemSalePrice * item.qty).toLocaleString('en-IN')}</div>
            </div>
        `;
        listContainer.innerHTML += itemMarkup;
    });

    if (totalOriginalMrp > calculatedCartTotal) {
        const discountAmt = totalOriginalMrp - calculatedCartTotal;
        document.getElementById('cutMrpCost').innerText = '₹' + totalOriginalMrp.toLocaleString('en-IN');
        document.getElementById('cutMrpCost').style.display = 'inline-block';

        document.getElementById('discountCost').innerText = '-₹' + discountAmt.toLocaleString('en-IN');
        document.getElementById('discountRow').style.display = 'flex';
    } else {
        document.getElementById('cutMrpCost').style.display = 'none';
        document.getElementById('discountRow').style.display = 'none';
    }

    document.getElementById('subtotalCost').innerText = '₹' + calculatedCartTotal.toLocaleString('en-IN');
    updateTotalUI();
}

function updateTotalUI() {
    let finalBill = calculatedCartTotal;
    const shippingElement = document.getElementById('shippingHandlingCost');

    if (selectedPaymentMethod === 'cod') {
        finalBill += COD_SHIPPING_CHARGE;
        shippingElement.innerText = `₹${COD_SHIPPING_CHARGE}`;
        shippingElement.style.color = "#0f172a";
    } else {
        shippingElement.innerText = "FREE";
        shippingElement.style.color = "#10b981"; /* using direct hex for success */
    }

    document.getElementById('finalTotalCost').innerText = '₹' + finalBill.toLocaleString('en-IN');
}

function selectPaymentRoute(method) {
    selectedPaymentMethod = method;
    document.getElementById('opt-online').classList.remove('dm-chk-selected');
    document.getElementById('opt-cod').classList.remove('dm-chk-selected');

    if (method === 'online') {
        document.getElementById('opt-online').classList.add('dm-chk-selected');
    } else {
        document.getElementById('opt-cod').classList.add('dm-chk-selected');
    }
    updateTotalUI();
}

async function executeSelectedOrderPayment() {
    if (!checkoutSupabase || !currentUserId) {
        alert("⚠️ Supabase security context initialization failed.");
        return;
    }

    let finalName = "", finalPhone = "", finalEmail = "", fullShippingText = "";

    if (hasSavedAddress && loadedSavedAddressObj) {
        finalName = loadedSavedAddressObj.receiver_name;
        finalPhone = loadedSavedAddressObj.receiver_phone;
        finalEmail = document.getElementById("email-address").value.trim() || 'saved-profile-user@dmoto.com';
        fullShippingText = `${loadedSavedAddressObj.address_line1}, ${loadedSavedAddressObj.address_line2 ? loadedSavedAddressObj.address_line2 + ',' : ''} ${loadedSavedAddressObj.city}, ${loadedSavedAddressObj.state} - ${loadedSavedAddressObj.pincode}`;
    } else {
        toggleFormInputsRequired(true);
        finalName = document.getElementById("full-name").value.trim();
        finalPhone = document.getElementById("phone-number").value.trim();
        finalEmail = document.getElementById("email-address").value.trim();
        const l1 = document.getElementById("address-line1").value.trim();
        const l2 = document.getElementById("address-line2").value.trim();
        const city = document.getElementById("city-name").value.trim();
        const state = document.getElementById("state-name").value.trim();
        const pin = document.getElementById("pincode").value.trim();

        if (!finalName || !finalPhone || !finalEmail || !l1 || !city || !state || !pin) {
            alert("Please fill in all the required delivery form fields correctly.");
            return;
        }
        fullShippingText = `${l1}, ${l2 ? l2 + ',' : ''} ${city}, ${state} - ${pin}`;
    }

    const activeCartItems = JSON.parse(localStorage.getItem('dochaki_cart')) || [];
    const generatedOrderId = "DCK-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
    const cartSizeRaw = activeCartItems[0]?.variant || activeCartItems[0]?.variant_label || activeCartItems[0]?.option || activeCartItems[0]?.size || '';
    const cartSize = cartSizeRaw ? parseInt(String(cartSizeRaw).replace(/[^0-9]/g, ''), 10) || null : null;
    let absoluteFinalBill = calculatedCartTotal + (selectedPaymentMethod === 'cod' ? COD_SHIPPING_CHARGE : 0);

    async function commitTransactionPayload(paymentId = null) {
        if (!hasSavedAddress) {
            try {
                await checkoutSupabase.from('addresses').insert([
                    {
                        user_id: currentUserId,
                        address_type: 'Home',
                        receiver_name: finalName,
                        receiver_phone: finalPhone,
                        address_line1: document.getElementById("address-line1").value.trim(),
                        address_line2: document.getElementById("address-line2").value.trim() || null,
                        city: document.getElementById("city-name").value.trim(),
                        state: document.getElementById("state-name").value.trim(),
                        pincode: document.getElementById("pincode").value.trim(),
                        is_default: true
                    }
                ]);
            } catch (errAddr) { console.error("Auto address background save failed:", errAddr); }
        }

        const { error: orderError } = await checkoutSupabase.from('orders').insert([
            {
                order_id: generatedOrderId,
                user_id: currentUserId,
                customer_name: finalName,
                phone_number: finalPhone,
                email_address: finalEmail,
                shipping_address: fullShippingText,
                cart_data: activeCartItems,
                size: cartSize,
                amount: absoluteFinalBill,
                payment_method: selectedPaymentMethod === 'online' ? 'Online / Instamojo' : 'COD',
                delivery_method: selectedPaymentMethod === 'online' ? 'PREPAID' : 'COD',
                status: selectedPaymentMethod === 'online' ? 'paid' : 'pending',
                payment_id: paymentId
            }
        ]);

        if (orderError) {
            alert("Database transaction failed: " + orderError.message);
        } else {
            localStorage.removeItem('dochaki_cart');
            window.location.href = `../ThankyouPage/Thankyou_page.html?order_id=${generatedOrderId}&status=success`;
        }
    }

    if (selectedPaymentMethod === 'online') {
        const instamojoGatewaySandboxURL = "https://test.instamojo.com/@dochakiparts";
        const targetPaymentUrl = `${instamojoGatewaySandboxURL}?amount=${absoluteFinalBill}&name=${encodeURIComponent(finalName)}&email=${encodeURIComponent(finalEmail)}&phone=${finalPhone}&intent=order_${generatedOrderId}`;

        Instamojo.configure({
            handlers: {
                onOpen: function () { console.log('Instamojo light-box frame loaded.'); },
                onClose: function () { console.log('Payment window closed.'); },
                onSuccess: async function (response) {
                    await commitTransactionPayload(response.payment_id);
                },
                onFailure: function (response) {
                    alert("Payment transaction declined. Please try again or select COD.");
                }
            }
        });
        Instamojo.open(targetPaymentUrl);
    } else {
        await commitTransactionPayload();
    }
}

window.addEventListener('DOMContentLoaded', initCheckoutPage);


// ======================
// Header Load Logic
// ======================
(function loadHeaderFooter() {
    fetch('../Header/header.html')
        .then(response => {
            if (!response.ok) throw new Error("Header file not found");
            return response.text();
        })
        .then(async (data) => {
            document.getElementById("global-header").innerHTML = data;

            if (window.initSupabase) {
                await window.initSupabase();
            }

            if (window.forceSyncHomeCart) {
                window.forceSyncHomeCart();
            }

            const hideCart = () => {
                const cartIcon = document.getElementById("headerCartIcon");
                if (cartIcon) cartIcon.style.display = "none";

                const drawer = document.getElementById("cartDrawer");
                if (drawer) drawer.style.display = "none";

                const overlay = document.getElementById("cartOverlay");
                if (overlay) overlay.style.display = "none";
            };

            hideCart();
            setTimeout(hideCart, 100);
            setTimeout(hideCart, 300);
            setTimeout(hideCart, 600);
        })
        .catch(err => console.error("Header Load Error:", err));

    // ======================
    // Footer Load
    // ======================
    fetch('../Footer/footer.html')
        .then(response => {
            if (!response.ok) throw new Error("Footer file not found");
            return response.text();
        })
        .then(data => {
            document.getElementById("global-footer").innerHTML = data;
        })
        .catch(err => console.error("Footer Load Error:", err));
})();