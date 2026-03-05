/**
 * Template engine: loads HTML templates, renders with {{variable}} and {{#if var}}...{{/if}}, injects into [data-template] sections.
 */
class TemplateEngine {
	#templates = new Map()
	#basePath = ""

	constructor() {
		this.#basePath = this.#detectBasePath()
		this.#setupEventDelegation()
	}

	#detectBasePath() {
		const pathSegments = window.location.pathname.split("/")
		return pathSegments[pathSegments.length - 2] !== "" ? "../" : ""
	}

	#setupEventDelegation() {
		// Navigation handled by native details/summary element - no JS needed
	}

	/** Loads and caches a template by id from the given URL. Returns cached HTML on repeat calls. */
	async loadTemplate(templateId, url) {
		if (this.#templates.has(templateId)) return this.#templates.get(templateId)

		try {
			const adjustedUrl = this.adjustTemplatePath(url)
			const response = await fetch(adjustedUrl)
			if (!response.ok) throw new Error(`Failed to load template: ${adjustedUrl}`)

			const templateHtml = await response.text()
			this.#templates.set(templateId, templateHtml)
			return templateHtml
		} catch (error) {
			console.error(`Error loading template ${templateId}:`, error)
			return `<div class="error">Failed to load template: ${error.message}</div>`
		}
	}

	adjustTemplatePath(templateUrl) {
		return this.#basePath ? `${this.#basePath}${templateUrl}` : templateUrl
	}

	/** Replaces {{var}} and {{#if var}}...{{/if}} in templateHtml with values from data. */
	renderTemplate(templateHtml, data = {}) {
		// Handle simple conditionals {{#if variable}}...{{/if}}
		let html = templateHtml
		html = html.replace(/\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, variable, content) => {
			const trimmedVar = variable.trim()
			const value = data[trimmedVar]
			// Show content if value is truthy and not empty string
			if (value && value !== "") {
				return content
			}
			return ""
		})

		// Handle variable replacement
		html = html.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
			const trimmedVar = variable.trim()
			return Object.hasOwn(data, trimmedVar) ? data[trimmedVar] : ""
		})

		return html
	}

	/** Loads template, renders with data, and injects into the target element (selector or Element). */
	async includeTemplate(targetSelector, templateId, templateUrl, data = {}) {
		const targetElement = typeof targetSelector === "string" ? document.querySelector(targetSelector) : targetSelector
		if (!targetElement || !(targetElement instanceof HTMLElement)) {
			console.error(`Target element not found: ${targetSelector}`)
			return
		}

		try {
			const templateHtml = await this.loadTemplate(templateId, templateUrl)
			const renderedHtml = this.renderTemplate(templateHtml, data)
			targetElement.innerHTML = renderedHtml
			this.#initComponents(targetElement)
			this.#dispatchTemplateLoadedEvent(targetElement)
		} catch (error) {
			console.error(`Error including template ${templateId}:`, error)
			if (targetElement instanceof HTMLElement) {
				targetElement.innerHTML = `<div class="error">Failed to load template: ${error.message}</div>`
			}
		}
	}

	#initComponents(parentElement) {
		this.#highlightCurrentPage(parentElement)
	}

	#highlightCurrentPage(parentElement) {
		const currentPath = window.location.pathname
		const navLinks = parentElement.querySelectorAll("nav a")

		navLinks.forEach((link) => {
			if (!(link instanceof HTMLAnchorElement)) return
			const linkPath = new URL(link.href, window.location.origin).pathname

			const isActive =
				currentPath === linkPath ||
				(currentPath.endsWith("/") && currentPath.slice(0, -1) === linkPath) ||
				(linkPath.endsWith("/") && linkPath.slice(0, -1) === currentPath) ||
				(currentPath === "/" && linkPath.endsWith("index.html"))

			link.classList.toggle("active", isActive)
			if (isActive) {
				link.setAttribute("aria-current", "page")
			} else {
				link.removeAttribute("aria-current")
			}
		})
	}

	/** Finds all [data-template] elements, loads each template, and injects rendered HTML; runs theme toggle and updateCurrentYear once. */
	async loadAllTemplateSections() {
		const templateSections = document.querySelectorAll("[data-template]")
		const loadPromises = Array.from(templateSections).map((section) => {
			const templateId = section.getAttribute("data-template")
			if (!templateId) return Promise.resolve()

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

			return this.includeTemplate(section, templateId, templateUrl, templateData)
		})

		try {
			await Promise.all(loadPromises)
		} catch (error) {
			console.error("Error loading templates:", error)
		}

		this.#initThemeToggle()
		this.#dispatchTemplateLoadedEvent(document)
		updateCurrentYear()
	}

	#initThemeToggle() {
		if (document.querySelector(".theme-toggle")) return

		const themeToggle = document.createElement("button")
		themeToggle.className = "theme-toggle"
		themeToggle.setAttribute("aria-label", "Toggle light/dark theme")
		themeToggle.innerHTML = `<span>Theme</span><div class="theme-toggle-icon"></div>`
		document.body.appendChild(themeToggle)

		const prefersDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches
		const storedTheme = localStorage.getItem("theme")
		const isDarkMode = storedTheme === "dark" || (!storedTheme && prefersDarkMode)

		if (!isDarkMode) document.body.classList.add("light-mode")

		themeToggle.addEventListener("click", () => {
			document.body.classList.toggle("light-mode")
			const isLightMode = document.body.classList.contains("light-mode")
			localStorage.setItem("theme", isLightMode ? "light" : "dark")
		})
	}

	#dispatchTemplateLoadedEvent(element) {
		const event = new CustomEvent("templateLoaded", {
			bubbles: true,
			detail: { timestamp: new Date() },
		})
		element.dispatchEvent(event)
	}
}

export const templateEngine = new TemplateEngine()

/** Sets .current-year elements to the current year. Called once after loadAllTemplateSections. */
export function updateCurrentYear() {
	const yearElements = document.querySelectorAll(".current-year")
	const currentYear = String(new Date().getFullYear())
	yearElements.forEach((element) => {
		element.textContent = currentYear
	})
}

document.addEventListener("DOMContentLoaded", () => {
	templateEngine.loadAllTemplateSections()
})
