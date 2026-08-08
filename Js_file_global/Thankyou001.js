async function loadHeader() {
    try {
        // 1. .js ki jagah vapas .html file fetch karo takki structure mile
        const response = await fetch("../Header/Header.html");
        const data = await response.text();
        document.getElementById("global-header").innerHTML = data;

        // Header ko DOM me inject hone ke liye thoda time do
        await new Promise(resolve => setTimeout(resolve, 100));

        // 2. Agar header.js me Supabase ya baaki functions hain, toh use yahan load karo dynamically
        if (!document.querySelector('script[src="../Header/header.js"]')) {
            const script = document.createElement("script");
            script.src = "../Header/header.js";
            script.async = true;
            document.body.appendChild(script);
            
            // Script ke load hone ka wait karo taaki initSupabase mil sake
            await new Promise((resolve) => {
                script.onload = resolve;
            });
        }

        // Supabase Auth Initialize
        if (typeof initSupabase === "function") {
            await initSupabase();
        }

        // Cart Sync
        if (typeof forceSyncHomeCart === "function") {
            forceSyncHomeCart();
        }

        // Active Menu Logic
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

        async function loadFooter() {
            try {
                const response = await fetch("../Footer/footer.html");
                const data = await response.text();
                document.getElementById("global-footer").innerHTML = data;
            } catch (err) {
                console.error("Footer Load Error:", err);
            }
        }

// Dono ko ek sath parallel load karne ke liye update
document.addEventListener("DOMContentLoaded", () => {
    // Promise.all se dono bina ek doosre ka wait kiye ek sath request bhejenge
    Promise.all([
        loadHeader(),
        loadFooter()
    ]).then(() => {
        console.log("Header and Footer successfully loaded!");
    }).catch(err => {
        console.error("Error loading layout components:", err);
    });
});
