/**
 * Keyboard navigation: menu (M/Escape), post prev/next (Ctrl+Arrow), home (H), blog (B). Respects base path for subpath hosting.
 */

const BASE_PATH_EXCLUDE_SEGMENTS = ["blog", "pages", "templates", "js", "css", "_posts", "files", "img", "docs"]

function getBasePath() {
	const match = window.location.pathname.match(/^\/([^/]+)\//)
	return match && !BASE_PATH_EXCLUDE_SEGMENTS.includes(match[1]) ? `/${match[1]}` : ""
}

class KeyboardNavigation {
	#basePath = ""

	constructor() {
		this.#basePath = getBasePath()
		this.menuOpen = false
		this.currentPostIndex = -1
		this.posts = []
		this.init()
	}

	init() {
		document.addEventListener("keydown", (e) => this.handleKeyPress(e))
		this.setupMenuNavigation()
		this.setupPostNavigation()
	}

	handleKeyPress(e) {
		// Don't interfere with input fields
		if (
			e.target.tagName === "INPUT" ||
			e.target.tagName === "TEXTAREA" ||
			e.target.isContentEditable
		) {
			return
		}

		// Menu toggle: M or Escape
		if (e.key === "m" || e.key === "M") {
			if (!e.ctrlKey && !e.metaKey && !e.altKey) {
				e.preventDefault()
				this.toggleMenu()
			}
		}

		// Close menu: Escape
		if (e.key === "Escape") {
			if (this.menuOpen) {
				e.preventDefault()
				this.closeMenu()
			}
		}

		// Navigation: Arrow keys
		if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
			if (e.ctrlKey || e.metaKey) {
				e.preventDefault()
				this.navigatePosts(e.key === "ArrowRight" ? "next" : "prev")
			}
		}

		// Home: H or Home key
		if ((e.key === "h" || e.key === "H" || e.key === "Home") && !e.ctrlKey && !e.metaKey) {
			if (e.key !== "Home" || !e.shiftKey) {
				e.preventDefault()
				window.location.href = `${this.#basePath}/index.html`
			}
		}

		// Blog: B
		if (e.key === "b" || e.key === "B") {
			if (!e.ctrlKey && !e.metaKey && !e.altKey) {
				e.preventDefault()
				window.location.href = `${this.#basePath}/blog.html`
			}
		}
	}

	setupMenuNavigation() {
		const navDetails = document.querySelector(".nav-mobile")

		if (navDetails) {
			// Track menu state
			const observer = new MutationObserver(() => {
				this.menuOpen = navDetails.hasAttribute("open")
			})

			observer.observe(navDetails, { attributes: true, attributeFilter: ["open"] })
			this.menuOpen = navDetails.hasAttribute("open")
		}

		// Add keyboard navigation to menu items
		document.addEventListener("DOMContentLoaded", () => {
			this.setupMenuItemsNavigation()
		})
		document.addEventListener("templateLoaded", () => {
			this.setupMenuItemsNavigation()
		})
	}

	setupMenuItemsNavigation() {
		const menuItems = document.querySelectorAll(".nav-list a")
		menuItems.forEach((item, index) => {
			item.addEventListener("keydown", (e) => {
				if (e.key === "ArrowRight") {
					e.preventDefault()
					const next = menuItems[index + 1] || menuItems[0]
					next.focus()
				} else if (e.key === "ArrowLeft") {
					e.preventDefault()
					const prev = menuItems[index - 1] || menuItems[menuItems.length - 1]
					prev.focus()
				} else if (e.key === "Enter" || e.key === " ") {
					e.preventDefault()
					item.click()
				}
			})
		})
	}

	setupPostNavigation() {
		// Load posts for navigation
		document.addEventListener("DOMContentLoaded", async () => {
			try {
				const { blogEngine } = await import("./blog-engine.js")
				const posts = await blogEngine.loadPostsIndex({ publishedOnly: true })
				if (posts && posts.length > 0) {
					this.posts = posts
					const currentSlug = this.getCurrentPostSlug()
					if (currentSlug) {
						this.currentPostIndex = posts.findIndex((p) => p.slug === currentSlug)
					}
				}
			} catch (error) {
				console.warn("Could not load posts for navigation:", error)
			}
		})
	}

	/** @returns {string|null} Slug from ?slug= query param. */
	getCurrentPostSlug() {
		const params = new URLSearchParams(window.location.search)
		return params.get("slug")
	}

	/** Navigates to previous/next post by index. direction is "prev" or "next". */
	navigatePosts(direction) {
		if (this.posts.length === 0) return

		if (this.currentPostIndex === -1) {
			// Not on a post page, go to first/last
			const targetIndex = direction === "next" ? 0 : this.posts.length - 1
			const post = this.posts[targetIndex]
			window.location.href = `${this.#basePath}/blog/post.html?slug=${encodeURIComponent(post.slug)}`
			return
		}

		let newIndex
		if (direction === "next") {
			newIndex = this.currentPostIndex + 1
			if (newIndex >= this.posts.length) newIndex = 0
		} else {
			newIndex = this.currentPostIndex - 1
			if (newIndex < 0) newIndex = this.posts.length - 1
		}

		const post = this.posts[newIndex]
		window.location.href = `${this.#basePath}/blog/post.html?slug=${encodeURIComponent(post.slug)}`
	}

	toggleMenu() {
		const navDetails = document.querySelector(".nav-mobile")
		if (navDetails) {
			navDetails.open = !navDetails.open
		}
	}

	closeMenu() {
		const navDetails = document.querySelector(".nav-mobile")
		if (navDetails && navDetails.open) {
			navDetails.open = false
		}
	}
}

export const keyboardNavigation = new KeyboardNavigation()
