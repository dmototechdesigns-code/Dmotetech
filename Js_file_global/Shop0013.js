

        async function loadHeader() {
            try {
                // Header Load
                const response = await fetch("../Header/Header.html");
                const data = await response.text();
                document.getElementById("global-header").innerHTML = data;

                // Allow layout parsing
                await new Promise(resolve => setTimeout(resolve, 100));

                // Supabase Auth Initialize
                if (typeof initSupabase === "function") {
                    await initSupabase();
                }

                // Cart Sync
                if (typeof forceSyncHomeCart === "function") {
                    forceSyncHomeCart();
                }

                // ==========================================
                // DYNAMIC ACTIVE NAVBAR HIGH LIGHT SCHEME
                // ==========================================
                let currentPage = window.location.pathname
                    .split("/")
                    .pop()
                    .toLowerCase();

                if (currentPage === "") {
                    currentPage = "index.html";
                }

                const menuItems = document.querySelectorAll(".hm-head-moto-nav-list li");
                menuItems.forEach(li => li.classList.remove("active-li"));

                menuItems.forEach(li => {
                    const link = li.querySelector("a");
                    if (!link) return;

                    const fileName = link
                        .getAttribute("href")
                        .split("/")
                        .pop()
                        .toLowerCase();

                    if (fileName === currentPage) {
                        li.classList.add("active-li");
                    }
                });
            }
            catch (err) {
                console.error("Header Load Error:", err);
            }
        }

        async function loadFooter() {
            try {
                const response = await fetch("../footer/footer.html");
                const data = await response.text();
                document.getElementById("global-footer").innerHTML = data;
            }
            catch (err) {
                console.error("Footer Load Error:", err);
            }
        }

        document.addEventListener("DOMContentLoaded", async () => {
            await loadHeader();
            await loadFooter();
        });
  