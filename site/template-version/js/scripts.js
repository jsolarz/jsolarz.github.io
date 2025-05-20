/**
 * BBS-Style Website - Core JavaScript functionality
 */

document.addEventListener("DOMContentLoaded", function () {
    // Add typing effect to elements after templates are loaded
    document.addEventListener("templateLoaded", initializeTypingEffect);

    // Initialize typing effect immediately for elements already in the DOM
    initializeTypingEffect();
});

/**
 * Initializes the terminal-like typing effect on elements
 */
function initializeTypingEffect() {
    // Add a simple terminal-like typing effect to selected elements
    const typingElements = document.querySelectorAll(
        ".typing-effect:not([data-typing-initialized])"
    );

    typingElements.forEach((element) => {
        // Skip if already initialized
        if (element.getAttribute("data-typing-initialized") === "true") {
            return;
        }

        // Store original text and clear element
        const text = element.textContent;
        element.setAttribute("data-original-text", text);
        element.textContent = "";
        let index = 0;

        function typeNextChar() {
            if (index < text.length) {
                element.textContent += text.charAt(index);
                index++;
                setTimeout(typeNextChar, Math.random() * 50 + 30); // Random delay between 30-80ms
            }
        }

        // Start the typing effect
        typeNextChar();

        // Mark as initialized
        element.setAttribute("data-typing-initialized", "true");
    });
}
