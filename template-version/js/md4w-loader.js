/**
 * md4w Markdown Renderer Loader
 * Loads and initializes md4w WASM module for client-side markdown rendering
 * Compatible with GitHub Pages static hosting
 */

class MD4WLoader {
    constructor() {
        this.md4w = null;
        this.isLoading = false;
        this.loadPromise = null;
    }

    /**
     * Loads md4w WASM module from CDN
     * @returns {Promise<Object>} md4w module with mdToHtml function
     */
    async load() {
        if (this.md4w) {
            return this.md4w;
        }

        if (this.isLoading) {
            return this.loadPromise;
        }

        this.isLoading = true;
        this.loadPromise = this._loadMD4W();

        try {
            this.md4w = await this.loadPromise;
            return this.md4w;
        } finally {
            this.isLoading = false;
        }
    }

    async _loadMD4W() {
        try {
            const md4wModule = await import('https://cdn.jsdelivr.net/npm/md4w@0.2.0/+esm');

            if (md4wModule.mdToHtml) {
                return { mdToHtml: md4wModule.mdToHtml };
            }

            if (md4wModule.default && md4wModule.default.mdToHtml) {
                return { mdToHtml: md4wModule.default.mdToHtml };
            }

            return md4wModule;
        } catch (error) {
            console.error('Failed to load md4w:', error);
            return {
                mdToHtml: (markdown) => {
                    return markdown
                        .replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/\n/g, '<br>');
                }
            };
        }
    }

    /**
     * Renders markdown to HTML
     * @param {string} markdown - Markdown content
     * @returns {Promise<string>} Rendered HTML
     */
    async render(markdown) {
        const md4w = await this.load();
        if (typeof md4w.mdToHtml === 'function') {
            return md4w.mdToHtml(markdown);
        }
        throw new Error('md4w.mdToHtml is not available');
    }
}

const md4wLoader = new MD4WLoader();

