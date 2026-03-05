/**
 * Integration Tests for Blog Engine
 * Tests the actual flow with real dependencies
 */

async function testBlogEngineIntegration() {
	console.log("=== Blog Engine Integration Tests ===\n")

	const results = []

	// Test 1: md4wLoader is available
	console.log("Test 1: md4wLoader availability")
	if (typeof window !== "undefined" && window.md4wLoader) {
		console.log("✓ PASS: window.md4wLoader exists")
		results.push(true)

		// Test 2: md4wLoader has render method
		console.log("Test 2: md4wLoader.render method")
		if (typeof window.md4wLoader.render === "function") {
			console.log("✓ PASS: window.md4wLoader.render is a function")
			results.push(true)

			// Test 3: md4wLoader can render markdown
			console.log("Test 3: md4wLoader can render markdown")
			try {
				const testMarkdown = "# Test\nThis is a test."
				const html = await window.md4wLoader.render(testMarkdown)
				if (html && html.includes("Test")) {
					console.log("✓ PASS: md4wLoader can render markdown")
					results.push(true)
				} else {
					console.error("✗ FAIL: md4wLoader rendered invalid HTML")
					results.push(false)
				}
			} catch (error) {
				console.error("✗ FAIL: md4wLoader.render threw error:", error)
				results.push(false)
			}
		} else {
			console.error("✗ FAIL: window.md4wLoader.render is not a function")
			results.push(false)
		}
	} else {
		console.error("✗ FAIL: window.md4wLoader is not defined")
		console.error("  - Check if md4w-loader.js is loaded before blog-engine.js")
		console.error("  - Check browser console for errors in md4w-loader.js")
		results.push(false)
	}

	// Test 4: blogEngine is available
	console.log("\nTest 4: blogEngine availability")
	if (typeof blogEngine !== "undefined") {
		console.log("✓ PASS: blogEngine exists")
		results.push(true)

		// Test 5: blogEngine has renderPost method
		console.log("Test 5: blogEngine.renderPost method")
		if (typeof blogEngine.renderPost === "function") {
			console.log("✓ PASS: blogEngine.renderPost is a function")
			results.push(true)
		} else {
			console.error("✗ FAIL: blogEngine.renderPost is not a function")
			results.push(false)
		}
	} else {
		console.error("✗ FAIL: blogEngine is not defined")
		console.error("  - Check if blog-engine.js is loaded")
		results.push(false)
	}

	// Test 6: Script loading order
	console.log("\nTest 6: Script loading order")
	const scripts = Array.from(document.querySelectorAll("script[src]"))
	const md4wIndex = scripts.findIndex(s => s.src.includes("md4w-loader"))
	const blogIndex = scripts.findIndex(s => s.src.includes("blog-engine"))

	if (md4wIndex !== -1 && blogIndex !== -1 && md4wIndex < blogIndex) {
		console.log("✓ PASS: md4w-loader.js loads before blog-engine.js")
		results.push(true)
	} else {
		console.error("✗ FAIL: Script loading order is incorrect")
		console.error(`  - md4w-loader.js index: ${md4wIndex}`)
		console.error(`  - blog-engine.js index: ${blogIndex}`)
		results.push(false)
	}

	// Summary
	const passed = results.filter(Boolean).length
	const total = results.length

	console.log(`\n=== Results: ${passed}/${total} tests passed ===`)

	if (passed === total) {
		console.log("✓ All integration tests passed!")
		return true
	} else {
		console.error(`✗ ${total - passed} test(s) failed`)
		console.error("\nTroubleshooting:")
		console.error("1. Check browser console for JavaScript errors")
		console.error("2. Verify all script files are loading (Network tab)")
		console.error("3. Check that md4w-loader.js executes without errors")
		console.error("4. Verify window.md4wLoader is set in md4w-loader.js")
		return false
	}
}

// Auto-run if ?test=1 in URL
if (typeof window !== "undefined") {
	window.testBlogEngineIntegration = testBlogEngineIntegration

	if (new URLSearchParams(window.location.search).get("test") === "1") {
		// Wait for scripts to load
		setTimeout(() => {
			testBlogEngineIntegration().catch(console.error)
		}, 1000)
	}
}

