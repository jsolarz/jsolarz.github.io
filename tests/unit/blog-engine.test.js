/**
 * Unit tests for blog-engine.js
 * Run in browser: open tests/unit/blog-engine.test.html
 */

import { blogEngine } from "../../js/blog-engine.js"

class BlogEngineTests {
	constructor() {
		this.tests = []
		this.passed = 0
		this.failed = 0
	}

	async runAll() {
		console.log("Running Blog Engine Tests...\n")

		await this.testRemoveDuplicateTitle()
		await this.testGenerateTOC()
		await this.testEscapeHtml()

		this.printResults()
	}

	testRemoveDuplicateTitle() {
		console.log("Test: removeDuplicateTitle")
		const html = '<h1>Test Title</h1><p>Content</p>'
		const title = "Test Title"
		const result = blogEngine._removeDuplicateTitle(html, title)

		if (result.includes("<h1>Test Title</h1>")) {
			this.fail("removeDuplicateTitle", "Title not removed")
		} else if (result.includes("<p>Content</p>")) {
			this.pass("removeDuplicateTitle")
		} else {
			this.fail("removeDuplicateTitle", "Content lost")
		}
	}

	testGenerateTOC() {
		console.log("Test: generateTOC")
		const html = '<h2 id="section-1">Section 1</h2><h3 id="subsection">Subsection</h3><p>Content</p>'
		const result = blogEngine._generateTOC(html)

		if (result.includes("Section 1") && result.includes("Subsection") && result.includes("#section-1")) {
			this.pass("generateTOC")
		} else {
			this.fail("generateTOC", "TOC not generated correctly")
		}
	}

	testEscapeHtml() {
		console.log("Test: escapeHtml")
		const input = '<script>alert("xss")</script>'
		const result = blogEngine._escapeHtml(input)

		if (result.includes("&lt;") && !result.includes("<script>")) {
			this.pass("escapeHtml")
		} else {
			this.fail("escapeHtml", "HTML not escaped")
		}
	}

	pass(testName) {
		this.tests.push({ name: testName, passed: true })
		this.passed++
		console.log(`  ✓ PASS: ${testName}`)
	}

	fail(testName, reason) {
		this.tests.push({ name: testName, passed: false, reason })
		this.failed++
		console.error(`  ✗ FAIL: ${testName} - ${reason}`)
	}

	printResults() {
		console.log(`\nResults: ${this.passed} passed, ${this.failed} failed`)
	}
}

// Export for use in test HTML
if (typeof window !== "undefined") {
	window.BlogEngineTests = BlogEngineTests
}

export { BlogEngineTests }
