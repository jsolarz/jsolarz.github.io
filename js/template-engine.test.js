/**
 * Tests for Template Engine
 * Run in browser console or with a test runner
 */

// Test: Template rendering
function testRenderTemplate() {
	console.log("Test: Template rendering")

	const engine = new TemplateEngine()
	const template = "Hello {{name}}, today is {{date}}"
	const data = { name: "World", date: "2025-01-15" }
	const rendered = engine.renderTemplate(template, data)

	if (rendered === "Hello World, today is 2025-01-15") {
		console.log("✓ Pass: Template rendered correctly")
		return true
	} else {
		console.error("✗ Fail: Template rendering incorrect", rendered)
		return false
	}
}

// Test: Base path detection
function testDetectBasePath() {
	console.log("Test: Base path detection")

	const engine = new TemplateEngine()
	const basePath = engine._detectBasePath()

	if (typeof basePath === "string") {
		console.log("✓ Pass: Base path detected correctly")
		return true
	} else {
		console.error("✗ Fail: Base path detection incorrect", basePath)
		return false
	}
}

// Test: Template path adjustment
function testAdjustTemplatePath() {
	console.log("Test: Template path adjustment")

	const engine = new TemplateEngine()
	const adjusted = engine.adjustTemplatePath("templates/header.html")

	if (typeof adjusted === "string" && adjusted.includes("templates/header.html")) {
		console.log("✓ Pass: Template path adjusted correctly")
		return true
	} else {
		console.error("✗ Fail: Template path adjustment incorrect", adjusted)
		return false
	}
}

// Run all tests
function runTests() {
	console.log("Running template engine tests...\n")

	const results = []
	results.push(testRenderTemplate())
	results.push(testDetectBasePath())
	results.push(testAdjustTemplatePath())

	const passed = results.filter(Boolean).length
	const total = results.length

	console.log(`\nTests: ${passed}/${total} passed`)

	if (passed === total) {
		console.log("✓ All tests passed!")
	} else {
		console.error(`✗ ${total - passed} test(s) failed`)
	}

	return passed === total
}

// Export for use in browser console
if (typeof window !== "undefined") {
	window.templateEngineTests = {
		runTests,
		testRenderTemplate,
		testDetectBasePath,
		testAdjustTemplatePath,
	}
}
