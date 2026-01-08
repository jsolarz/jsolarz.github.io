/**
 * Tests for Blog Engine
 * Run in browser console or with a test runner
 */

// Mock fetch for testing
function createMockFetch(mockData) {
	return async (url) => {
		if (url.includes("posts-index.json")) {
			return {
				ok: true,
				json: async () => mockData.index || [],
			}
		}
		if (url.includes("manifest.json")) {
			return {
				ok: true,
				json: async () => mockData.manifest || [],
			}
		}
		if (url.includes("_posts/")) {
			return {
				ok: true,
				text: async () => mockData.posts[url] || "",
			}
		}
		return { ok: false }
	}
}

// Test: Load posts index
async function testLoadPostsIndex() {
	console.log("Test: Load posts index")

	const mockIndex = [
		{
			title: "Test Post",
			date: "2025-01-15",
			slug: "test-post",
			filename: "2025-01-15-test-post.md",
			categories: ["test"],
			excerpt: "Test excerpt",
			author: "Test Author",
		},
	]

	const originalFetch = window.fetch
	window.fetch = createMockFetch({ index: mockIndex })

	try {
		const engine = new BlogEngine()
		const posts = await engine.loadPostsIndex()

		if (posts.length === 1 && posts[0].title === "Test Post") {
			console.log("✓ Pass: Posts index loaded correctly")
			return true
		} else {
			console.error("✗ Fail: Posts index format incorrect")
			return false
		}
	} catch (error) {
		console.error("✗ Fail: Error loading posts index", error)
		return false
	} finally {
		window.fetch = originalFetch
	}
}

// Test: Parse front matter
function testParseFrontMatter() {
	console.log("Test: Parse front matter")

	const engine = new BlogEngine()
	const markdown = `---
title: "Test Post"
date: 2025-01-15
categories: test blog
excerpt: Test excerpt
---

# Content
Test content here.`

	const { metadata, content } = engine.parseFrontMatter(markdown)

	if (
		metadata.title === "Test Post" &&
		metadata.date === "2025-01-15" &&
		Array.isArray(metadata.categories) &&
		metadata.categories.length === 2 &&
		content.includes("# Content")
	) {
		console.log("✓ Pass: Front matter parsed correctly")
		return true
	} else {
		console.error("✗ Fail: Front matter parsing incorrect", { metadata, content })
		return false
	}
}

// Test: Format date
function testFormatDate() {
	console.log("Test: Format date")

	const engine = new BlogEngine()
	const formatted = engine._formatDate("2025-01-15")

	if (formatted && formatted.includes("2025") && formatted.includes("January")) {
		console.log("✓ Pass: Date formatted correctly")
		return true
	} else {
		console.error("✗ Fail: Date formatting incorrect", formatted)
		return false
	}
}

// Test: Load post from manifest fallback
async function testLoadPostFromManifest() {
	console.log("Test: Load post from manifest fallback")

	const mockManifest = ["2025-01-15-test-post.md"]
	const mockPost = `---
title: "Test Post"
date: 2025-01-15
excerpt: Test excerpt
---

# Test Content
This is test content.`

	const originalFetch = window.fetch
	window.fetch = createMockFetch({
		manifest: mockManifest,
		posts: {
			"_posts/2025-01-15-test-post.md": mockPost,
		},
	})

	try {
		const engine = new BlogEngine()
		const posts = await engine.loadPostsIndex()

		if (posts.length === 1 && posts[0].slug === "test-post") {
			console.log("✓ Pass: Post loaded from manifest correctly")
			return true
		} else {
			console.error("✗ Fail: Post loading from manifest incorrect", posts)
			return false
		}
	} catch (error) {
		console.error("✗ Fail: Error loading post from manifest", error)
		return false
	} finally {
		window.fetch = originalFetch
	}
}

// Run all tests
async function runTests() {
	console.log("Running blog engine tests...\n")

	const results = []
	results.push(await testLoadPostsIndex())
	results.push(testParseFrontMatter())
	results.push(testFormatDate())
	results.push(await testLoadPostFromManifest())

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
	window.blogEngineTests = {
		runTests,
		testLoadPostsIndex,
		testParseFrontMatter,
		testFormatDate,
		testLoadPostFromManifest,
	}

	// Auto-run tests if ?test=1 in URL
	if (new URLSearchParams(window.location.search).get("test") === "1") {
		setTimeout(() => runTests().catch(console.error), 1000)
	}
}
