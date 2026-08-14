/**
 * DMotoTech Global Script
 * GitHub Pages / Custom Domain compatible
 */

(function () {

    /**
     * Get website root
     *
     * Current GitHub Pages:
     * https://dmototechdesigns-code.github.io/
     *
     * Result:
     * /
     *
     * Custom domain:
     * https://dmototechdesigns.online/
     *
     * Result:
     * /
     */
    function getSiteRoot() {
        return "/Dmotetech/";
    }


    /**
     * Convert path to website-root path
     *
     * Example:
     *
     * Shop/Shop.html
     *     ↓
     * /Shop/Shop.html
     */
    window.sitePath = function (path) {

        const root = getSiteRoot();

        path = String(path || "")
            .replace(/^\/+/, "");

        return root + path;
    };


    /**
     * Normalize internal links
     *
     * Converts:
     *
     * ../Shop/Shop.html
     * ../../Shop/Shop.html
     * ./Shop/Shop.html
     *
     * into:
     *
     * /Shop/Shop.html
     */
    function normalizeLinks() {

        document.querySelectorAll("a[href]").forEach(link => {

            let href = link.getAttribute("href");

            if (!href) return;


            /**
             * Don't modify external/special links
             */
            if (
                href.startsWith("#") ||
                href.startsWith("http://") ||
                href.startsWith("https://") ||
                href.startsWith("//") ||
                href.startsWith("mailto:") ||
                href.startsWith("tel:") ||
                href.startsWith("javascript:") ||
                href.startsWith("data:")
            ) {
                return;
            }


            /**
             * Relative paths
             *
             * ../
             * ../../
             * ./
             */
            if (
                href.startsWith("../") ||
                href.startsWith("./")
            ) {

                const cleanPath = href
                    .replace(/^(\.\.\/)+/, "")
                    .replace(/^\.\//, "");

                link.setAttribute(
                    "href",
                    sitePath(cleanPath)
                );

                return;
            }


            /**
             * Root-relative path
             *
             * /Shop/Shop.html
             */
            if (href.startsWith("/")) {
                return;
            }

        });

    }


    /**
     * Load Global Header
     */
    async function loadHeader() {

        const container =
            document.getElementById("global-header");

        if (!container) return;

        try {

            const response = await fetch(
                sitePath("Header/Header.html")
            );

            if (!response.ok) {
                throw new Error(
                    `Header.html not found (${response.status})`
                );
            }

            const html = await response.text();

            const parser = new DOMParser();

            const doc =
                parser.parseFromString(
                    html,
                    "text/html"
                );

            container.innerHTML =
                doc.body
                    ? doc.body.innerHTML
                    : html;


            /**
             * Fix Header links
             */
            normalizeLinks();


            /**
             * Initialize Supabase Auth
             */
            if (
                typeof initSupabaseAuth === "function"
            ) {

                try {

                    initSupabaseAuth();

                } catch (error) {

                    console.error(
                        "Supabase Auth initialization failed:",
                        error
                    );

                }

            }

        } catch (error) {

            console.error(
                "Header loading failed:",
                error
            );

        }

    }


    /**
     * Load Global Footer
     */
    async function loadFooter() {

        const container =
            document.getElementById("global-footer");

        if (!container) return;

        try {

            const response = await fetch(
                sitePath("Footer/Footer.html")
            );

            if (!response.ok) {
                throw new Error(
                    `Footer.html not found (${response.status})`
                );
            }

            const html =
                await response.text();

            const parser =
                new DOMParser();

            const doc =
                parser.parseFromString(
                    html,
                    "text/html"
                );

            container.innerHTML =
                doc.body
                    ? doc.body.innerHTML
                    : html;


            /**
             * Fix Footer links
             */
            normalizeLinks();

        } catch (error) {

            console.error(
                "Footer loading failed:",
                error
            );

        }

    }


    /**
     * Initialize Global System
     */
    async function initGlobal() {

        console.log(
            "DMotoTech Global Script Started"
        );


        /**
         * Fix links already present
         * on current page
         */
        normalizeLinks();


        /**
         * Load Header
         */
        await loadHeader();


        /**
         * Load Footer
         */
        await loadFooter();


        /**
         * Fix Header + Footer links
         */
        normalizeLinks();


        console.log(
            "DMotoTech Global System Loaded"
        );

        console.log(
            "Site Root:",
            getSiteRoot()
        );

    }


    /**
     * Start after DOM is ready
     */
    if (
        document.readyState === "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initGlobal
        );

    } else {

        initGlobal();

    }

})();