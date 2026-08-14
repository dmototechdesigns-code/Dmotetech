/**
 * DMotoTech Global Script
 * GitHub Pages compatible
 */

(function () {

    // GitHub Pages repository base path
    const REPO_NAME = "Dmotetech";

    /**
     * Returns the correct website root.
     *
     * GitHub Pages:
     * https://dmototechdesigns-code.github.io/Dmotetech/
     *
     * Result:
     * /Dmotetech/
     */
    function getSiteRoot() {

        if (
            location.hostname === "dmototechdesigns-code.github.io"
        ) {
            return `/${REPO_NAME}/`;
        }

        // Custom domain / local
        return "/";
    }


    /**
     * Convert a website path into
     * the correct absolute path.
     *
     * Example:
     *
     * "/Shop/Shop.html"
     *
     * becomes:
     *
     * "/Dmotetech/Shop/Shop.html"
     */
    window.sitePath = function (path) {

        const root = getSiteRoot();

        path = path.replace(/^\/+/, "");

        return root + path;
    };


    /**
     * Fix all internal links automatically.
     *
     * ../Shop/Shop.html
     * ../../Shop/Shop.html
     * ./Shop/Shop.html
     *
     * all become:
     *
     * /Dmotetech/Shop/Shop.html
     */
    function normalizeLinks() {

        document.querySelectorAll("a[href]").forEach(link => {

            let href = link.getAttribute("href");

            if (!href) return;

            // Don't touch external/special links
            if (
                href.startsWith("#") ||
                href.startsWith("http://") ||
                href.startsWith("https://") ||
                href.startsWith("mailto:") ||
                href.startsWith("tel:") ||
                href.startsWith("javascript:") ||
                href.startsWith("data:")
            ) {
                return;
            }

            // Remove all ./ ../ prefixes
            if (
                href.startsWith("./") ||
                href.startsWith("../")
            ) {

                const cleanPath = href
                    .replace(/^(\.\.\/)+/, "")
                    .replace(/^\.\//, "");

                link.href = sitePath(cleanPath);

                return;
            }

            // Root-relative links
            if (href.startsWith("/")) {

                // Already contains repository name
                if (
                    href.startsWith(
                        `/${REPO_NAME}/`
                    )
                ) {
                    return;
                }

                const cleanPath = href.replace(/^\/+/, "");

                link.href = sitePath(cleanPath);

                return;
            }

        });

    }


    /**
     * Load global Header
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
                    "Header.html not found"
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

            normalizeLinks();


            // Initialize Supabase Auth
            if (
                typeof initSupabaseAuth ===
                "function"
            ) {
                initSupabaseAuth();
            }

        } catch (error) {

            console.error(
                "Header loading failed:",
                error
            );

        }

    }


    /**
     * Load global Footer
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
                    "Footer.html not found"
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

            normalizeLinks();

        } catch (error) {

            console.error(
                "Footer loading failed:",
                error
            );

        }

    }


    /**
     * Initialize everything
     */
    async function initGlobal() {

        // Existing page links
        normalizeLinks();

        // Header
        await loadHeader();

        // Footer
        await loadFooter();

        // Header/Footer ke links
        normalizeLinks();

        console.log(
            "DMotoTech Global System Loaded:",
            sitePath("")
        );

    }


    // Start
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