/**
 * BBS-Style Website - Minimal JavaScript functionality
 */

// Apply saved theme IMMEDIATELY to prevent flash of incorrect theme
(function() {
	const savedTheme = localStorage.getItem("theme");
	if (savedTheme === "light") {
		document.documentElement.classList.add("light-mode");
		// Also add to body if it exists
		if (document.body) {
			document.body.classList.add("light-mode");
		}
	}
})();

document.addEventListener("DOMContentLoaded", function () {
	// Highlight active navigation link
	const currentPath = window.location.pathname;
	const navLinks = document.querySelectorAll("nav a");

	navLinks.forEach((link) => {
		// Get the path from the href
		const linkPath = new URL(link.href).pathname;

		// Check if this link corresponds to the current page
		if (
			currentPath === linkPath ||
			(currentPath.endsWith("/") && currentPath.slice(0, -1) === linkPath) ||
			(linkPath.endsWith("/") && linkPath.slice(0, -1) === currentPath) ||
			(currentPath === "/" && linkPath.endsWith("index.html"))
		) {
			link.classList.add("active");
		}
	});

	// SVG error handling code removed

	// Add a simple terminal-like typing effect to selected elements
	const typingElements = document.querySelectorAll(".typing-effect");

	typingElements.forEach((element) => {
		const text = element.textContent;
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
	});

	// Toggle mobile navigation (if needed for smaller screens)
	const menuToggle = document.querySelector(".menu-toggle");
	const navMenu = document.querySelector("nav ul");

	if (menuToggle && navMenu) {
		menuToggle.addEventListener("click", function () {
			const isExpanded = navMenu.classList.contains("show");
			navMenu.classList.toggle("show");
			menuToggle.classList.toggle("active");

			// Update aria-expanded attribute for accessibility
			menuToggle.setAttribute("aria-expanded", !isExpanded);
		});

		// Close menu when clicking outside
		document.addEventListener("click", function (event) {
			if (!menuToggle.contains(event.target) && !navMenu.contains(event.target) && navMenu.classList.contains("show")) {
				navMenu.classList.remove("show");
				menuToggle.classList.remove("active");
				menuToggle.setAttribute("aria-expanded", "false");
			}
		});

		// Close menu when clicking on navigation links
		const navLinks = document.querySelectorAll("nav a");
		navLinks.forEach((link) => {
			link.addEventListener("click", function () {
				if (window.innerWidth < 768) {
					navMenu.classList.remove("show");
					menuToggle.classList.remove("active");
					menuToggle.setAttribute("aria-expanded", "false");
				}
			});
		});
	}
});

// Simple function to add the current year to any elements with class "current-year"
function updateYear() {
	const yearElements = document.querySelectorAll(".current-year");
	const currentYear = new Date().getFullYear();

	yearElements.forEach((element) => {
		element.textContent = currentYear;
	});
}

// Run the year update when the page loads
document.addEventListener("DOMContentLoaded", updateYear);

// Theme toggle functionality
function setupThemeToggle() {
	// Get current theme from localStorage or default to dark
	const currentTheme = localStorage.getItem("theme") || "dark";

	// Create theme toggle button if it doesn't exist
	if (!document.querySelector(".theme-toggle")) {
		const themeToggle = document.createElement("button");
		themeToggle.className = "theme-toggle";
		themeToggle.setAttribute("aria-label", "Toggle light/dark mode");
		themeToggle.setAttribute("title", "Toggle light/dark mode");

		const themeIcon = document.createElement("span");
		themeIcon.className = "theme-toggle-icon";

		const themeText = document.createElement("span");
		themeText.textContent = currentTheme === "light" ? "Dark Mode" : "Light Mode";

		themeToggle.appendChild(themeIcon);
		themeToggle.appendChild(themeText);

		document.body.appendChild(themeToggle);

		// Add click event to toggle theme
		themeToggle.addEventListener("click", function () {
			// Toggle classes on both html and body
			document.documentElement.classList.toggle("light-mode");
			document.body.classList.toggle("light-mode");

			// Determine new theme and save to localStorage
			const newTheme = document.body.classList.contains("light-mode") ? "light" : "dark";
			localStorage.setItem("theme", newTheme);

			// Update button text
			themeText.textContent = newTheme === "light" ? "Dark Mode" : "Light Mode";

			// Debug log
			console.log("Theme toggled to:", newTheme);
		});
	}
}

// Run theme toggle setup when DOM is loaded
document.addEventListener("DOMContentLoaded", setupThemeToggle);
