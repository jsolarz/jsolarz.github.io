document.addEventListener("DOMContentLoaded", () => {
	document.addEventListener("templateLoaded", initializeTypingEffect)
	initializeTypingEffect()
})

function initializeTypingEffect() {
	const typingElements = document.querySelectorAll(".typing-effect:not([data-typing-initialized])")

	typingElements.forEach((element) => {
		if (element.getAttribute("data-typing-initialized") === "true") return

		const text = element.textContent
		element.setAttribute("data-original-text", text)
		element.textContent = ""
		let index = 0

		const typeNextChar = () => {
			if (index < text.length) {
				element.textContent += text.charAt(index)
				index++
				const delay = Math.random() * 50 + 30
				requestAnimationFrame(() => {
					setTimeout(() => requestAnimationFrame(typeNextChar), delay)
				})
			}
		}

		typeNextChar()
		element.setAttribute("data-typing-initialized", "true")
	})
}
