/**
 * 📄 CV Markdown Loader
 * Loads and parses CV from markdown file with BBS styling
 */

class CVLoader {
	constructor() {
		this.cvPath = "/files/cv.md";
	}

	/**
	 * 🚀 Load and render CV
	 */
	async loadCV() {
		try {
			const response = await fetch(this.cvPath);
			if (!response.ok) {
				throw new Error(`Failed to load CV: ${response.status}`);
			}

			const markdown = await response.text();
			const html = this.parseMarkdown(markdown);

			const cvContainer = document.getElementById("cv-content");
			if (cvContainer) {
				cvContainer.innerHTML = html;
				console.log("📄 CV loaded successfully");
			} else {
				console.error("CV container not found");
			}
		} catch (error) {
			console.error("Failed to load CV:", error);
			this.showError();
		}
	}
	/**
	 * 📝 Parse markdown to HTML with BBS styling
	 */
	parseMarkdown(markdown) {
		let html = markdown;

		// Parse header section (first h1 with contact info)
		html = html.replace(/^# (.+)\n([\s\S]*?)---+\s*---+/m, (match, name, contactInfo) => {
			const cleanContact = contactInfo.trim().replace(/\n/g, "<br>");
			return `
                <div class="cv-header bbs-box">
                    <h1 class="cv-name">${name}</h1>
                    <div class="cv-contact">${cleanContact}</div>
                </div>`;
		});

		// Parse main sections (## headers)
		html = html.replace(/^## (.+)$/gm, '<h2 class="cv-section-title">$1</h2>');

		// Parse job titles with company (### Company - Role)
		html = html.replace(
			/^### (.+?) - (.+?)$/gm,
			'<div class="cv-job-header"><h4 class="cv-company">$1</h4><h3 class="cv-job-title">$2</h3></div>'
		);

		// Parse simple job entries (### without company separator)
		html = html.replace(/^### ([^-\n]+)$/gm, '<div class="cv-job-header"><h3 class="cv-job-title">$1</h3></div>');

		// Parse date ranges (**date range**)
		html = html.replace(/\*\*([^*]+)\*\*/g, '<span class="cv-date">$1</span>');

		// Parse bullet points
		html = html.replace(/^- (.+)$/gm, '<li class="cv-bullet">$1</li>');

		// Wrap consecutive bullet points in ul tags
		html = html.replace(/((?:<li class="cv-bullet">.*?<\/li>\s*)+)/gs, '<ul class="cv-list">$1</ul>');

		// Parse horizontal rules
		html = html.replace(/^---+$/gm, '<hr class="cv-divider">');

		// Process sections
		const sections = html.split('<h2 class="cv-section-title">');
		let processedHtml = sections[0]; // Header part

		for (let i = 1; i < sections.length; i++) {
			const sectionContent = sections[i];
			const lines = sectionContent.split("\n");
			const title = lines[0];
			const content = lines.slice(1).join("\n");

			processedHtml += `
            <div class="cv-section bbs-box">
                <div class="bbs-header">${title}</div>
                <div class="cv-section-content">${content}</div>
            </div>`;
		}

		// Clean up extra line breaks and normalize
		processedHtml = processedHtml.replace(/\n\s*\n/g, "\n");

		return processedHtml;
	}

	/**
	 * ⚠️ Show error message
	 */
	showError() {
		const cvContainer = document.getElementById("cv-content");
		if (cvContainer) {
			cvContainer.innerHTML = `
            <div class="bbs-box error">
                <div class="bbs-header">Error Loading CV</div>
                <p>Sorry, there was an error loading the CV content. Please try refreshing the page.</p>
                <div class="terminal">
                    <span class="prompt">$ </span>
                    <span class="command">cat cv.md</span>
                    <div class="output">cat: cv.md: File not found or network error</div>
                </div>
            </div>`;
		}
	}
}

// 🚀 Initialize CV loader when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
	const cvLoader = new CVLoader();
	cvLoader.loadCV();
});
