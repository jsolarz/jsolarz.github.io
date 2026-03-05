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

document.addEventListener("DOMContentLoaded", () => {
	document.addEventListener("templateLoaded", initializeTypingEffect)
	initializeTypingEffect()
})
