class MarkdownLoader {
	#marked = null
	#isLoading = false
	#loadPromise = null

	async load() {
		if (this.#marked) return this.#marked
		if (this.#isLoading && this.#loadPromise) return this.#loadPromise

		this.#isLoading = true
		this.#loadPromise = this.#loadMarked()
			.then((result) => {
				this.#marked = result
				return result
			})
			.catch((error) => {
				console.error("Failed to load marked:", error)
				const fallback = {
					parse: (markdown) => markdown.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>"),
				}
				this.#marked = fallback
				return fallback
			})
			.finally(() => {
				this.#isLoading = false
			})

		return this.#loadPromise
	}

	async #loadMarked() {
		try {
			// @ts-ignore - Dynamic import from CDN
			const markedModule = await import("https://cdn.jsdelivr.net/npm/marked@15.0.12/+esm")

			const marked = markedModule.default || markedModule.marked || markedModule

			if (!marked || typeof marked.parse !== "function" && typeof marked !== "function") {
				throw new Error("marked module loaded but parse function is not available")
			}

			const parseFn = typeof marked === "function" ? marked : marked.parse

			if (marked.setOptions) {
				marked.setOptions({
					gfm: true,
					breaks: false,
					pedantic: false,
				})
			}

			return {
				parse: (markdown) => {
					return parseFn(markdown)
				},
			}
		} catch (error) {
			console.error("Failed to load marked:", error)
			return {
				parse: (markdown) => markdown.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>"),
			}
		}
	}

	async render(markdown) {
		if (!markdown || typeof markdown !== "string") {
			throw new Error("Invalid markdown input")
		}

		const marked = await this.load()
		if (!marked || typeof marked.parse !== "function") {
			throw new Error("marked module failed to load")
		}

		return marked.parse(markdown)
	}
}

const markdownLoader = new MarkdownLoader()

if (typeof window !== "undefined") {
	/** @type {any} */
	const win = window
	win.markdownLoader = markdownLoader

	if (window.location.pathname.includes("/blog") || document.querySelector(".post-list")) {
		markdownLoader.load().catch(() => {})
	}
}

