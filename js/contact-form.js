/**
 * Contact form for static hosting (GitHub Pages).
 * Set data-form-endpoint on #contact-form to a Formspree URL for inbox delivery.
 * If empty, submit opens the visitor's mail client (mailto fallback).
 */

const DEFAULT_MAILTO = "hello@solarz.me"

/**
 * @param {HTMLFormElement} form
 */
function initContactForm(form) {
	const formResponse = document.getElementById("form-response")
	const responseText = document.getElementById("response-text")
	const submitBtn = form.querySelector('button[type="submit"]')
	if (!formResponse || !responseText) return

	const endpoint = (form.dataset.formEndpoint || "").trim()
	const mailto = (form.dataset.mailto || DEFAULT_MAILTO).trim()

	const showStatus = (html, isError = false) => {
		form.hidden = true
		formResponse.hidden = false
		formResponse.classList.toggle("form-response--error", isError)
		responseText.innerHTML = html
	}

	form.addEventListener("submit", async (e) => {
		e.preventDefault()

		const gotcha = /** @type {HTMLInputElement | null} */ (form.querySelector('[name="_gotcha"]'))
		if (gotcha?.value) return

		const name = /** @type {HTMLInputElement} */ (form.elements.namedItem("name")).value.trim()
		const email = /** @type {HTMLInputElement} */ (form.elements.namedItem("email")).value.trim()
		const subject = /** @type {HTMLInputElement} */ (form.elements.namedItem("subject")).value.trim()
		const message = /** @type {HTMLTextAreaElement} */ (form.elements.namedItem("message")).value.trim()

		if (submitBtn) {
			submitBtn.disabled = true
			submitBtn.textContent = "[ SENDING... ]"
		}

		try {
			if (endpoint) {
				const response = await fetch(endpoint, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Accept: "application/json",
					},
					body: JSON.stringify({
						name,
						email,
						subject,
						message,
						_replyto: email,
					}),
				})

				if (!response.ok) {
					const data = await response.json().catch(() => ({}))
					throw new Error(data.error || `Delivery failed (${response.status})`)
				}

				showStatus(`
					<div class="terminal">
						<div class="output">
							<span class="highlight-2">Message sent.</span><br>
							Thanks — I will reply to <strong>${escapeHtml(email)}</strong> when I can.
						</div>
					</div>
				`)
			} else {
				const mailSubject = encodeURIComponent(subject)
				const mailBody = encodeURIComponent(
					`From: ${name} <${email}>\n\n${message}\n`
				)
				window.location.href = `mailto:${mailto}?subject=${mailSubject}&body=${mailBody}`
				showStatus(`
					<div class="terminal">
						<div class="output">
							<span class="highlight-2">Opening your mail app.</span><br>
							Send the draft to <strong>${escapeHtml(mailto)}</strong>, or email directly if nothing opened.
						</div>
					</div>
				`)
			}
		} catch (err) {
			if (submitBtn) {
				submitBtn.disabled = false
				submitBtn.textContent = "[ SEND_MESSAGE ]"
			}
			form.hidden = false
			formResponse.hidden = false
			formResponse.classList.add("form-response--error")
			responseText.innerHTML = `
				<div class="terminal">
					<div class="output">
						<span class="highlight-2">Send failed.</span><br>
						${escapeHtml(err instanceof Error ? err.message : "Unknown error")}<br>
						<a href="mailto:${escapeHtml(mailto)}">${escapeHtml(mailto)}</a>
					</div>
				</div>
			`
		}
	})
}

/** @param {string} text */
function escapeHtml(text) {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
}

function bindContactForm() {
	const form = document.getElementById("contact-form")
	if (form instanceof HTMLFormElement) initContactForm(form)
}

document.addEventListener("DOMContentLoaded", bindContactForm)
document.addEventListener("templateLoaded", bindContactForm)
