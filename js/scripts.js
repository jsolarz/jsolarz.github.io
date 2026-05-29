import "./keyboard-navigation.js"

/** Initializes typing effect on elements with class .typing-effect. */
export function initializeTypingEffect() {
	const typingElements = document.querySelectorAll(".typing-effect:not([data-typing-initialized])")

	typingElements.forEach((element) => {
		const text = element.textContent
		element.setAttribute("data-original-text", text)
		element.textContent = ""
		element.setAttribute("data-typing-initialized", "true")
		let index = 0

		const typeNextChar = () => {
			if (index < text.length) {
				element.textContent += text.charAt(index)
				index++
				const delay = Math.random() * 50 + 30
				setTimeout(typeNextChar, delay)
			}
		}

		typeNextChar()
	})
}

/** Updates #footer-clock with local HH:MM:SS. */
export function initializeFooterClock() {
	const clockEl = document.getElementById("footer-clock")
	if (!clockEl) return

	const tick = () => {
		const now = new Date()
		const h = String(now.getHours()).padStart(2, "0")
		const m = String(now.getMinutes()).padStart(2, "0")
		const s = String(now.getSeconds()).padStart(2, "0")
		clockEl.textContent = `${h}:${m}:${s}`
	}

	tick()
	window.setInterval(tick, 1000)
}

/** Home prompt typing effect; respects prefers-reduced-motion. */
export function initializeHomePrompt() {
	const el = document.getElementById("home-typing-text")
	if (!el || el.dataset.promptInit) return
	el.dataset.promptInit = "true"

	if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
		el.textContent = "ls -la /projects/featured"
		return
	}

	const text = "ls -la /projects/featured"
	let i = 0

	const type = () => {
		if (i < text.length) {
			el.textContent += text.charAt(i)
			i++
			setTimeout(type, 120)
		} else {
			setTimeout(() => {
				el.textContent = ""
				i = 0
				type()
			}, 3000)
		}
	}

	type()
}

document.addEventListener("DOMContentLoaded", () => {
	document.addEventListener("templateLoaded", () => {
		initializeTypingEffect()
		initializeFooterClock()
		initializeHomePrompt()
	})
	initializeTypingEffect()
	initializeFooterClock()
	initializeHomePrompt()
})
