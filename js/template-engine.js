/**
 * Simple Template Engine for BBS-Style Website
 * Loads HTML templates and injects content
 */

class TemplateEngine {
	constructor() {
		this.templates = {} // Cache for loaded templates
		this.basePath = this._detectBasePath() // Cache base path
		this._setupEventDelegation() // Setup event delegation once
	}

	/**
	 * Detects base path for path adjustment
	 * @returns {string} Base path prefix
	 * @private
	 */
	_detectBasePath() {
		const pathSegments = window.location.pathname.split("/")
		const isInSubdirectory = pathSegments[pathSegments.length - 2] !== ""
		return isInSubdirectory ? "../" : ""
	}

	/**
	 * Sets up event delegation for menu toggle
	 * @private
	 */
	_setupEventDelegation() {
		// Use event delegation on document to avoid duplicate listeners
		document.addEventListener("click", (e) => {
			if (!e.target || !(e.target instanceof Element)) return
			const menuToggle = e.target.closest(".menu-toggle")
			if (menuToggle) {
				const navMenu = document.querySelector("nav ul")
				if (navMenu) {
					const isExpanded = navMenu.classList.contains("show")
					navMenu.classList.toggle("show")
					menuToggle.classList.toggle("active")
					menuToggle.setAttribute("aria-expanded", String(!isExpanded))
				}
			}
		})
	}

	/**
	 * Loads a template from a URL
	 * @param {string} templateId - Unique identifier for the template
	 * @param {string} url - URL to fetch the template from
	 * @returns {Promise<string>} - The template HTML
	 */
	async loadTemplate(templateId, url) {
		// Return cached template if available
		if (this.templates[templateId]) {
			return this.templates[templateId]
		}

		try {
			const adjustedUrl = this.adjustTemplatePath(url)
			const response = await fetch(adjustedUrl)
			if (!response.ok) {
				throw new Error(`Failed to load template: ${adjustedUrl}`)
			}
			const templateHtml = await response.text()

			// Cache the template
			this.templates[templateId] = templateHtml
			return templateHtml
		} catch (error) {
			console.error(`Error loading template ${templateId}:`, error)
			return `<div class="error">Failed to load template: ${error.message}</div>`
		}
	}

	/**
	 * Adjusts template path based on the current page depth
	 * @param {string} templateUrl - The template URL to adjust
	 * @returns {string} - Adjusted template URL
	 */
	adjustTemplatePath(templateUrl) {
		// Use cached base path
		return this.basePath ? `${this.basePath}${templateUrl}` : templateUrl
	}

	/**
	 * Renders a template with data
	 * @param {string} templateHtml - The template HTML
	 * @param {Object} data - Data to inject into the template
	 * @returns {string} - Rendered HTML
	 */
	renderTemplate(templateHtml, data = {}) {
		// Simple template replacement using {{variable}} syntax
		return templateHtml.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
			// Trim whitespace from variable name
			const trimmedVar = variable.trim()

			// Check if variable exists in data
			return data.hasOwnProperty(trimmedVar) ? data[trimmedVar] : ""
		})
	}

	/**
	 * Loads and renders a template into a target element
	 * @param {string|HTMLElement} targetSelector - CSS selector or HTMLElement for target
	 * @param {string} templateId - Unique identifier for the template
	 * @param {string} templateUrl - URL to fetch the template from
	 * @param {Object} data - Data to inject into the template
	 */
	async includeTemplate(targetSelector, templateId, templateUrl, data = {}) {
		const targetElement = typeof targetSelector === "string" ? document.querySelector(targetSelector) : targetSelector

		if (!targetElement || !(targetElement instanceof HTMLElement)) {
			console.error(`Target element not found: ${targetSelector}`)
			return
		}

		try {
			// Load template
			const templateHtml = await this.loadTemplate(templateId, templateUrl)

			// Render template with data
			const renderedHtml = this.renderTemplate(templateHtml, data)

			// Insert into target element
			targetElement.innerHTML = renderedHtml

			// Initialize components in the new content
			this.initComponents(targetElement)

			// Dispatch custom event for template loading completion
			this.dispatchTemplateLoadedEvent(targetElement)
		} catch (error) {
			console.error(`Error including template ${templateId}:`, error)
			if (targetElement instanceof HTMLElement) {
				targetElement.innerHTML = `<div class="error">Failed to load template: ${error.message}</div>`
			}
		}
	}

	/**
	 * Initializes components in the rendered template
	 * @param {HTMLElement} parentElement - Parent element containing components
	 */
	initComponents(parentElement) {
		// Menu toggle is now handled by event delegation in constructor
		// No need to add listeners here

		// Highlight current page in navigation
		this.highlightCurrentPage(parentElement)
	}

	/**
	 * Highlights the current page in navigation
	 * @param {HTMLElement} parentElement - Parent element containing navigation
	 */
	highlightCurrentPage(parentElement) {
		const currentPath = window.location.pathname
		const navLinks = parentElement.querySelectorAll("nav a")

		navLinks.forEach((link) => {
			if (!(link instanceof HTMLAnchorElement)) return
			// Get the path from the href
			const linkPath = new URL(link.href, window.location.origin).pathname

			// Check if this link corresponds to the current page
			if (
				currentPath === linkPath ||
				(currentPath.endsWith("/") && currentPath.slice(0, -1) === linkPath) ||
				(linkPath.endsWith("/") && linkPath.slice(0, -1) === currentPath) ||
				(currentPath === "/" && linkPath.endsWith("index.html"))
			) {
				link.classList.add("active")
			} else {
				link.classList.remove("active")
			}
		})
	}

	/**
	 * Loads all template sections in the page
	 */
	async loadAllTemplateSections() {
		const templateSections = document.querySelectorAll("[data-template]")

		// Load all templates in parallel for better performance
		const loadPromises = Array.from(templateSections).map((section) => {
			const templateId = section.getAttribute("data-template")
			const templateUrl = `templates/${templateId}.html`
			const dataAttr = section.getAttribute("data-template-data")
			let templateData = {}

			if (dataAttr) {
				try {
					templateData = JSON.parse(dataAttr)
				} catch (error) {
					console.error(`Invalid JSON in data-template-data:`, error)
				}
			}

			const templateIdAttr = section.getAttribute("data-template")
			if (!templateIdAttr) return Promise.resolve()
			return this.includeTemplate(`[data-template="${templateIdAttr}"]`, templateIdAttr, templateUrl, templateData)
		})

		// Wait for all templates to load in parallel
		try {
			await Promise.all(loadPromises)
		} catch (error) {
			console.error("Error loading templates:", error)
		}

		// Initialize theme toggle after all templates are loaded
		this.initThemeToggle()

		// Dispatch event to notify that templates are loaded
		this.dispatchTemplateLoadedEvent(document)

		// Update current year in footer
		updateCurrentYear()
	}

	/**
	 * Initializes theme toggling functionality
	 */
	initThemeToggle() {
		// Add theme toggle button if not already present
		if (!document.querySelector(".theme-toggle")) {
			const themeToggle = document.createElement("button")
			themeToggle.className = "theme-toggle"
			themeToggle.setAttribute("aria-label", "Toggle light/dark theme")

			themeToggle.innerHTML = `
                <span>Theme</span>
                <div class="theme-toggle-icon"></div>
            `

			document.body.appendChild(themeToggle)

			// Set initial theme based on localStorage or system preference
			const prefersDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches
			const storedTheme = localStorage.getItem("theme")
			const isDarkMode = storedTheme === "dark" || (!storedTheme && prefersDarkMode)

			if (!isDarkMode) {
				document.body.classList.add("light-mode")
			}

			// Add event listener for theme toggle
			themeToggle.addEventListener("click", () => {
				document.body.classList.toggle("light-mode")
				const isLightMode = document.body.classList.contains("light-mode")
				localStorage.setItem("theme", isLightMode ? "light" : "dark")
			})
		}
	}

	/**
	 * Dispatches a custom event when templates are loaded
	 * @param {EventTarget} element - Element to dispatch the event on (defaults to document)
	 */
	dispatchTemplateLoadedEvent(element) {
		// Create and dispatch a custom event that other scripts can listen for
		const target = element || document
		const event = new CustomEvent("templateLoaded", {
			bubbles: true,
			detail: { timestamp: new Date() },
		})
		if (target instanceof EventTarget) {
			target.dispatchEvent(event)
		}
	}

	/**
	 * Enables debug mode for the template engine
	 * @param {boolean} enabled - Whether debug mode is enabled
	 */
	setDebugMode(enabled = true) {
		this.debugMode = enabled

		if (enabled) {
			console.info("Template engine debug mode enabled")

			// Add debug visualization
			document.querySelectorAll("[data-template]").forEach((el) => {
				if (!(el instanceof HTMLElement)) return
				const templateId = el.getAttribute("data-template")
				if (!templateId) return
				const debugElement = document.createElement("div")
				debugElement.className = "template-debug-info"
				debugElement.innerHTML = `Template: ${templateId}`
				debugElement.style.cssText = `
                    position: absolute;
                    top: 0;
                    left: 0;
                    background-color: rgba(143, 188, 187, 0.8);
                    color: rgb(46, 52, 64);
                    font-size: 11px;
                    padding: 2px 5px;
                    border-radius: 0 0 4px 0;
                    z-index: 9999;
                    pointer-events: none;
                `

				// Set element to relative positioning if not already positioned
				const elPosition = window.getComputedStyle(el).position
				if (elPosition === "static") {
					el.style.position = "relative"
				}

				el.appendChild(debugElement)
			})
		} else {
			console.info("Template engine debug mode disabled")
			document.querySelectorAll(".template-debug-info").forEach((el) => el.remove())
		}

		return this
	}
}

// Create global template engine instance
const templateEngine = new TemplateEngine()

// Expose templateEngine to window for debugging
if (typeof window !== "undefined") {
	/** @type {any} */
	const win = window
	win.templateEngine = templateEngine
}

// Load all template sections when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
	templateEngine.loadAllTemplateSections()

	// Initialize year in footer
	updateCurrentYear()
})

// Update current year in footer
function updateCurrentYear() {
	const yearElements = document.querySelectorAll(".current-year")
	const currentYear = new Date().getFullYear()

	yearElements.forEach((element) => {
		element.textContent = String(currentYear)
	})
}
