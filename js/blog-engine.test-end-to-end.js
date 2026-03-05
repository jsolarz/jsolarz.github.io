async function runBlogEngineTests() {
	console.log("=== Blog Engine End-to-End Tests ===\n")

	const results = []
	let allPassed = true

	// Test 1: Scripts loaded in correct order
	console.log("Test 1: Script loading order")
	const scripts = Array.from(document.querySelectorAll("script[src]"))
	const md4wIndex = scripts.findIndex(s => s.src.includes("md4w-loader"))
	const blogIndex = scripts.findIndex(s => s.src.includes("blog-engine"))

	if (md4wIndex !== -1 && blogIndex !== -1 && md4wIndex < blogIndex) {
		console.log("✓ PASS: md4w-loader.js loads before blog-engine.js")
		results.push({ test: "Script order", passed: true })
	} else {
		console.error("✗ FAIL: Script loading order incorrect")
		console.error(`  md4w-loader.js index: ${md4wIndex}, blog-engine.js index: ${blogIndex}`)
		results.push({ test: "Script order", passed: false })
		allPassed = false
	}

	// Test 2: window.md4wLoader exists
	console.log("\nTest 2: window.md4wLoader exists")
	if (typeof window.md4wLoader !== "undefined") {
		console.log("✓ PASS: window.md4wLoader is defined")
		results.push({ test: "md4wLoader exists", passed: true })
	} else {
		console.error("✗ FAIL: window.md4wLoader is undefined")
		results.push({ test: "md4wLoader exists", passed: false })
		allPassed = false
		return { allPassed: false, results }
	}

	// Test 3: md4wLoader.render is a function
	console.log("\nTest 3: md4wLoader.render is a function")
	if (typeof window.md4wLoader.render === "function") {
		console.log("✓ PASS: window.md4wLoader.render is a function")
		results.push({ test: "md4wLoader.render", passed: true })
	} else {
		console.error(`✗ FAIL: window.md4wLoader.render is not a function (type: ${typeof window.md4wLoader.render})`)
		results.push({ test: "md4wLoader.render", passed: false })
		allPassed = false
		return { allPassed: false, results }
	}

	// Test 4: md4wLoader can actually render markdown
	console.log("\nTest 4: md4wLoader can render markdown")
	try {
		const testMarkdown = "# Test Heading\n\nThis is **bold** text."
		const html = await window.md4wLoader.render(testMarkdown)
		if (html && (html.includes("Test Heading") || html.includes("bold") || html.includes("<h1") || html.includes("<strong"))) {
			console.log("✓ PASS: md4wLoader successfully rendered markdown")
			console.log(`  Rendered HTML preview: ${html.substring(0, 100)}...`)
			results.push({ test: "md4wLoader rendering", passed: true })
		} else {
			console.error("✗ FAIL: md4wLoader rendered invalid HTML")
			console.error(`  Got: ${html}`)
			results.push({ test: "md4wLoader rendering", passed: false })
			allPassed = false
		}
	} catch (error) {
		console.error("✗ FAIL: md4wLoader.render threw error:", error)
		results.push({ test: "md4wLoader rendering", passed: false, error: error.message })
		allPassed = false
	}

	// Test 5: blogEngine exists
	console.log("\nTest 5: blogEngine exists")
	if (typeof blogEngine !== "undefined") {
		console.log("✓ PASS: blogEngine is defined")
		results.push({ test: "blogEngine exists", passed: true })
	} else {
		console.error("✗ FAIL: blogEngine is undefined")
		results.push({ test: "blogEngine exists", passed: false })
		allPassed = false
		return { allPassed: false, results }
	}

	// Test 6: blogEngine.renderPost is a function
	console.log("\nTest 6: blogEngine.renderPost is a function")
	if (typeof blogEngine.renderPost === "function") {
		console.log("✓ PASS: blogEngine.renderPost is a function")
		results.push({ test: "blogEngine.renderPost", passed: true })
	} else {
		console.error(`✗ FAIL: blogEngine.renderPost is not a function (type: ${typeof blogEngine.renderPost})`)
		results.push({ test: "blogEngine.renderPost", passed: false })
		allPassed = false
	}

	// Test 7: Can load posts index
	console.log("\nTest 7: Can load posts index")
	try {
		const posts = await blogEngine.loadPostsIndex()
		if (Array.isArray(posts) && posts.length > 0) {
			console.log(`✓ PASS: Loaded ${posts.length} posts`)
			results.push({ test: "Load posts index", passed: true, count: posts.length })
		} else {
			console.error("✗ FAIL: Posts index is empty or not an array")
			results.push({ test: "Load posts index", passed: false })
			allPassed = false
		}
	} catch (error) {
		console.error("✗ FAIL: Failed to load posts index:", error)
		results.push({ test: "Load posts index", passed: false, error: error.message })
		allPassed = false
	}

	// Test 8: Can load a specific post
	console.log("\nTest 8: Can load a specific post")
	try {
		const posts = await blogEngine.loadPostsIndex()
		if (posts.length > 0) {
			const testPost = posts[0]
			const post = await blogEngine.loadPost(testPost.slug)
			if (post && post.title && post.content) {
				console.log(`✓ PASS: Successfully loaded post: ${post.title}`)
				console.log(`  - Content length: ${post.content.length} chars`)
				results.push({ test: "Load post", passed: true, post: post.title })
			} else {
				console.error("✗ FAIL: Post loaded but missing required fields")
				results.push({ test: "Load post", passed: false })
				allPassed = false
			}
		} else {
			console.log("⚠ SKIP: No posts available to test")
			results.push({ test: "Load post", passed: true, skipped: true })
		}
	} catch (error) {
		console.error("✗ FAIL: Failed to load post:", error)
		results.push({ test: "Load post", passed: false, error: error.message })
		allPassed = false
	}

	// Test 9: ACTUAL RENDERING TEST - Render a real post
	console.log("\nTest 9: ACTUAL POST RENDERING - future-of-intelligent-systems")
	try {
		const posts = await blogEngine.loadPostsIndex()
		const testPost = posts.find(p => p.slug === "future-of-intelligent-systems")

		if (!testPost) {
			console.error("✗ FAIL: Test post 'future-of-intelligent-systems' not found")
			results.push({ test: "Render post", passed: false })
			allPassed = false
		} else {
			const container = document.createElement("div")
			container.id = "test-render-container"

			await blogEngine.renderPost("future-of-intelligent-systems", container)

			const renderedTitle = container.querySelector("h1")?.textContent || container.querySelector("article h1")?.textContent
			const hasContent = container.textContent.length > 500
			const hasArticle = container.querySelector("article") !== null
			const titleMatches = renderedTitle && renderedTitle.includes("Future of Intelligent Systems")

			if (titleMatches && hasContent && hasArticle) {
				console.log("✓ PASS: Post rendered correctly")
				console.log(`  - Title: ${renderedTitle}`)
				console.log(`  - Content length: ${container.textContent.length} chars`)
				console.log(`  - Has article element: ${hasArticle}`)
				results.push({ test: "Render post", passed: true, title: renderedTitle })
			} else {
				console.error("✗ FAIL: Post rendering failed")
				console.error(`  - Title found: ${titleMatches} (${renderedTitle})`)
				console.error(`  - Has content: ${hasContent} (${container.textContent.length} chars)`)
				console.error(`  - Has article: ${hasArticle}`)
				console.error(`  - HTML preview: ${container.innerHTML.substring(0, 300)}`)
				results.push({ test: "Render post", passed: false })
				allPassed = false
			}
		}
	} catch (error) {
		console.error("✗ FAIL: Post rendering threw error:", error)
		console.error("  Error stack:", error.stack)
		results.push({ test: "Render post", passed: false, error: error.message })
		allPassed = false
	}

	// Summary
	const passed = results.filter(r => r.passed).length
	const total = results.filter(r => !r.skipped).length

	console.log(`\n=== Test Results: ${passed}/${total} passed ===`)

	if (allPassed) {
		console.log("✓ All tests passed! Blog engine is working correctly.")
	} else {
		console.error(`✗ ${total - passed} test(s) failed`)
		console.error("\nTroubleshooting steps:")
		console.error("1. Open browser DevTools (F12)")
		console.error("2. Check Console tab for JavaScript errors")
		console.error("3. Check Network tab - verify all .js files load (status 200)")
		console.error("4. Verify md4w-loader.js executes and sets window.md4wLoader")
		console.error("5. Verify blog-engine.js executes and creates blogEngine")
	}

	return { allPassed, results, passed, total }
}

// Expose globally
if (typeof window !== "undefined") {
	window.runBlogEngineTests = runBlogEngineTests

	// Auto-run if ?test=1 in URL
	if (new URLSearchParams(window.location.search).get("test") === "1") {
		if (document.readyState === "loading") {
			document.addEventListener("DOMContentLoaded", () => {
				setTimeout(() => runBlogEngineTests().catch(console.error), 1000)
			})
		} else {
			setTimeout(() => runBlogEngineTests().catch(console.error), 1000)
		}
	}
}
