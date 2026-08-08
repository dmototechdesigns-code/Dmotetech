document.addEventListener("DOMContentLoaded", async () => {
    // Supabase Config credentials
    const SUPABASE_URL = "https://ycipxljvymewdltlblvn.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljaXB4bGp2eW1ld2RsdGxibHZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzNzA5MzksImV4cCI6MjA5Nzk0NjkzOX0.dleDKMUuavLtA_pPKicnBexgGb4SqOGM7oU7QoEBm9I";
    
    const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // 1. URL params se order ID nikalna
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('id');

    if (!orderId) {
        alert("⚠️ Order ID missing! Returning to dashboard.");
        window.location.href = "../MyAccount.html"; 
        return;
    }

    try {
        // 2. Supabase se specific order ka data fetch karna
        const { data: order, error: orderError } = await supabaseClient
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();

        if (orderError) throw orderError;
        if (!order) throw new Error("Order not found in records.");

        // Breadcrumb mein Active Order ID set karna
        document.getElementById('breadcrumb-order-id').innerText = `#DMTS5275${order.id}`;

        // 3. Primary Address Fetching Logic
        let deliveryAddressHTML = "Address details not found.";
        let receiverName = "Rider User";
        let receiverPhone = "";

        if (order.user_id) {
            const { data: primaryAddress, error: addrError } = await supabaseClient
                .from('addresses')
                .select('*')
                .eq('user_id', order.user_id)
                .eq('is_default', true)
                .maybeSingle(); 

            if (!addrError && primaryAddress) {
                receiverName = primaryAddress.receiver_name || receiverName;
                receiverPhone = primaryAddress.receiver_phone || receiverPhone;
                
                const type = primaryAddress.address_type || 'Primary Address';
                const line1 = primaryAddress.address_line1 || '';
                const line2 = primaryAddress.address_line2 || '';
                const landmark = primaryAddress.landmark ? `, Near ${primaryAddress.landmark}` : '';
                const city = primaryAddress.city || '';
                const state = primaryAddress.state || '';
                const pincode = primaryAddress.pincode || '';

                deliveryAddressHTML = `
                    <strong>${type}</strong><br>
                    ${line1}, ${line2}${landmark}<br>
                    ${city}, ${state} - <strong>${pincode}</strong>
                `;
            } else if (order.address_data) {
                const addr = order.address_data;
                receiverName = addr.receiver_name || receiverName;
                receiverPhone = addr.receiver_phone || receiverPhone;
                deliveryAddressHTML = `
                    <strong>${addr.address_type || 'Delivery Address'}</strong><br>
                    ${addr.address_line1 || addr.flat || ''}, ${addr.address_line2 || addr.area || ''}<br>
                    ${addr.city || ''}, ${addr.state || ''} - <strong>${addr.pincode || ''}</strong>
                `;
            }
        }

        document.getElementById('user-name').innerText = receiverName;
        document.getElementById('user-phone').innerText = receiverPhone ? `| +91 ${receiverPhone}` : '';
        document.getElementById('delivery-address').innerHTML = deliveryAddressHTML;


        // 4. Cart / Product Parsing
        let title = "Motorcycle Premium Accessory";
        let image = "https://images.unsplash.com/photo-1609630875171-b1321377ee65?q=80&w=150";
        
        let variantText = '';
        if (order.cart_data && order.cart_data.length > 0) {
            const item = order.cart_data[0];
            title = item.title || item.name || title;
            image = item.img || item.image || image;
            variantText = item.variant_label || item.variant || item.option || item.size || '';
        }

        const sizeText = order.size ? `Size: ${order.size}` : '';
        document.getElementById('prod-title').innerText = title;
        const orderVariantEl = document.getElementById('order-variant');
        if (orderVariantEl) {
            if (sizeText) {
                orderVariantEl.innerText = sizeText;
            } else {
                orderVariantEl.innerText = variantText ? `Option: ${variantText}` : 'Option: Standard';
            }
        }
        const prodImg = document.getElementById('prod-img');
        prodImg.src = image;
        prodImg.style.display = "block";


        // 5. Corrected Pricing Logic (Left Side Actual Product Price)
        const dbAmount = parseFloat(order.amount); 
        const codCharges = 83; 
        let basePrice = dbAmount;
        let finalTotalAmount = dbAmount;

        const isCOD = order.payment_method?.toLowerCase().includes('cod') || order.delivery_method === 'COD' || false;

        if (isCOD) {
            basePrice = dbAmount - codCharges; 
            finalTotalAmount = dbAmount;

            document.getElementById('cod-charge-row').style.display = "flex";
            document.getElementById('payment-method-text').innerHTML = `<i class="fa-solid fa-money-bill-1-wave"></i> Cash On Delivery`;
        } else {
            basePrice = dbAmount;
            finalTotalAmount = dbAmount;

            document.getElementById('cod-charge-row').style.display = "none";
            document.getElementById('payment-method-text').innerHTML = `<i class="fa-solid fa-credit-card"></i> Prepaid / Online`;
        }

        document.getElementById('prod-price').innerText = `₹${basePrice}`;
        document.getElementById('base-price').innerText = `₹${basePrice}`;
        document.getElementById('total-amount').innerText = `₹${finalTotalAmount}`;


        // 6. Live Order Status Tracker (Dynamic Flow: Confirmed -> Dispatched -> Delivered)
        const status = order.status ? order.status.toLowerCase() : 'pending';
        const timelineContainer = document.getElementById('tracking-timeline');
        let timelineHTML = '';

        const rawDate = new Date(order.created_at);
        const formattedDate = rawDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });

        if (status === 'cancelled') {
            timelineHTML = `
                <div class="v-step done">
                    <div class="v-bullet"><i class="fa-solid fa-circle-check"></i></div>
                    <div class="v-content"><p class="status-title">Order Placed, ${formattedDate}</p></div>
                </div>
                <div class="v-line red-line"></div>
                <div class="v-step cancelled">
                    <div class="v-bullet"><i class="fa-solid fa-circle-xmark"></i></div>
                    <div class="v-content"><p class="status-title">Cancelled</p></div>
                </div>
            `;
            const cancelBox = document.getElementById('cancel-reason-text');
            cancelBox.innerText = "This order was cancelled successfully.";
            cancelBox.style.display = "block";
        } else {
            // Booleans setting up based on backend state updates
            const isDispatched = (status === 'dispatched' || status === 'transit' || status === 'delivered');
            const isDelivered = (status === 'delivered');

            timelineHTML = `
                <!-- Step 1: Confirmed (Always Active for valid orders) -->
                <div class="v-step done">
                    <div class="v-bullet"><i class="fa-solid fa-circle-check"></i></div>
                    <div class="v-content"><p class="status-title">Ordered & Confirmed, ${formattedDate}</p></div>
                </div>
                
                <!-- Line 1 to Dispatched -->
                <div class="v-line ${isDispatched ? 'green-line' : ''}"></div>
                
                <!-- Step 2: Dispatched / In Transit -->
                <div class="v-step ${isDispatched ? 'done' : ''}">
                    <div class="v-bullet"><i class="fa-solid ${isDispatched ? 'fa-circle-check' : 'fa-circle'}"></i></div>
                    <div class="v-content"><p class="status-title">Dispatched / In Transit</p></div>
                </div>
                
                <!-- Line 2 to Delivered -->
                <div class="v-line ${isDelivered ? 'green-line' : ''}"></div>
                
                <!-- Step 3: Delivered -->
                <div class="v-step ${isDelivered ? 'done' : ''}">
                    <div class="v-bullet"><i class="fa-solid ${isDelivered ? 'fa-circle-check' : 'fa-circle'}"></i></div>
                    <div class="v-content"><p class="status-title">Delivered</p></div>
                </div>
            `;
        }
        timelineContainer.innerHTML = timelineHTML;

    } catch (err) {
        console.error("Error displaying order details:", err.message);
        document.body.innerHTML = `<div style="text-align:center; margin-top:50px; color:red;"><h3>⚠️ Error loading details: ${err.message}</h3><a href="../MyAccount.html" style="color: blue; text-decoration: underline;">Back to Orders</a></div>`;
    }
});       
        async function loadHeader() {
            try {
                const response = await fetch('../../Header/header.html');
                if (!response.ok) throw new Error("Header file not found");

                const data = await response.text();
                document.getElementById('global-header').innerHTML = data;

                if (typeof initSupabase === "function") {
                    await initSupabase();
                }

                if (typeof forceSyncHomeCart === "function") {
                    forceSyncHomeCart();
                }

                let currentPage = window.location.pathname.split("/").pop().toLowerCase();
                if (currentPage === "") {
                    currentPage = "index.html";
                }

                const menuItems = document.querySelectorAll(".hm-head-moto-nav-list li");
                menuItems.forEach(li => li.classList.remove("active-li"));

                menuItems.forEach(li => {
                    const link = li.querySelector("a");
                    if (!link) return;

                    const fileName = link.getAttribute("href").split("/").pop().toLowerCase();
                    if (fileName === currentPage) {
                        li.classList.add("active-li");
                    }
                });

            } catch (err) {
                console.error("Header Load Error:", err);
            }
        }

        document.addEventListener("DOMContentLoaded", loadHeader);
