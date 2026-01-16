async function createMockFetch(mockData) {
	const originalFetch = window.fetch
	window.fetch = async (url) => {
		if (url.includes("posts-index.json")) {
			return {
				ok: true,
				json: async () => mockData.postsIndex || [],
			}
		}
		if (url.includes("manifest.json")) {
			return {
				ok: true,
				json: async () => mockData.manifest || [],
			}
		}
		if (url.includes(".md")) {
			return {
				ok: true,
				text: async () => mockData.markdown || "",
			}
		}
		return originalFetch(url)
	}
	return () => {
		window.fetch = originalFetch
	}
}

async function testLoadPostsIndex() {
	console.log("Test: loadPostsIndex")
	const restore = await createMockFetch({
		postsIndex: [
			{
				title: "Test Post",
				date: "2025-01-01",
				slug: "test-post",
				filename: "2025-01-01-test-post.md",
				categories: ["test"],
				excerpt: "Test excerpt",
				author: "Jonathan Solarz",
			},
		],
	})

	try {
		const posts = await blogEngine.loadPostsIndex()
		if (Array.isArray(posts) && posts.length > 0 && posts[0].title === "Test Post") {
			console.log("✓ PASS: loadPostsIndex returns correct data")
			restore()
			return true
		} else {
			console.error("✗ FAIL: loadPostsIndex returned invalid data")
			restore()
			return false
		}
	} catch (error) {
		console.error("✗ FAIL: loadPostsIndex threw error:", error)
		restore()
		return false
	}
}

function testParseFrontMatter() {
	console.log("Test: parseFrontMatter")
	const markdown = `---
title: "Test Post"
date: 2025-01-01
author: Jonathan Solarz
categories: test
excerpt: Test excerpt
---

# Test Post

This is the content.`

	try {
		const { metadata, content } = blogEngine.parseFrontMatter(markdown)
		if (
			metadata.title === "Test Post" &&
			metadata.date === "2025-01-01" &&
			content.includes("This is the content")
		) {
			console.log("✓ PASS: parseFrontMatter parses correctly")
			return true
		} else {
			console.error("✗ FAIL: parseFrontMatter returned invalid data")
			return false
		}
	} catch (error) {
		console.error("✗ FAIL: parseFrontMatter threw error:", error)
		return false
	}
}

async function testLoadPost() {
	console.log("Test: loadPost")
	const testMarkdown = `---
title: "Test Post"
date: 2025-01-01
author: Jonathan Solarz
categories: test
excerpt: Test excerpt
---

# Test Post

This is the content.`

	const restore = await createMockFetch({
		postsIndex: [
			{
				title: "Test Post",
				date: "2025-01-01",
				slug: "test-post",
				filename: "2025-01-01-test-post.md",
			},
		],
		markdown: testMarkdown,
	})

	try {
		const post = await blogEngine.loadPost("test-post")
		if (
			post.title === "Test Post" &&
			post.date === "2025-01-01" &&
			post.content.includes("This is the content") &&
			post.slug === "test-post"
		) {
			console.log("✓ PASS: loadPost returns correct data")
			restore()
			return true
		} else {
			console.error("✗ FAIL: loadPost returned invalid data", post)
			restore()
			return false
		}
	} catch (error) {
		console.error("✗ FAIL: loadPost threw error:", error)
		restore()
		return false
	}
}

async function testRenderPost() {
	console.log("Test: renderPost - ACTUAL RENDERING TEST")

	if (typeof window.md4wLoader === "undefined") {
		console.error("✗ FAIL: window.md4wLoader not available")
		return false
	}

	if (typeof window.md4wLoader.render !== "function") {
		console.error("✗ FAIL: window.md4wLoader.render is not a function")
		return false
	}

	const testMarkdown = `---
title: "Test Post"
date: 2025-01-01
author: Jonathan Solarz
categories: test
excerpt: Test excerpt
---

# Test Post

This is **bold** content with a [link](https://example.com).`

	const restore = await createMockFetch({
		postsIndex: [
			{
				title: "Test Post",
				date: "2025-01-01",
				slug: "test-post",
				filename: "2025-01-01-test-post.md",
			},
		],
		markdown: testMarkdown,
	})

	const container = document.createElement("div")
	container.id = "test-container"

	try {
		await blogEngine.renderPost("test-post", container)

		const hasTitle = container.querySelector("h1")?.textContent.includes("Test Post")
		const hasContent = container.textContent.includes("bold") || container.textContent.includes("link")
		const hasArticle = container.querySelector("article") !== null

		if (hasTitle && hasContent && hasArticle) {
			console.log("✓ PASS: renderPost rendered post correctly")
			console.log("  - Title found:", hasTitle)
			console.log("  - Content found:", hasContent)
			console.log("  - Article element found:", hasArticle)
			restore()
			return true
		} else {
			console.error("✗ FAIL: renderPost did not render correctly")
			console.error("  - Title:", hasTitle)
			console.error("  - Content:", hasContent)
			console.error("  - Article:", hasArticle)
			console.error("  - Container HTML:", container.innerHTML.substring(0, 200))
			restore()
			return false
		}
	} catch (error) {
		console.error("✗ FAIL: renderPost threw error:", error)
		restore()
		return false
	}
}

async function testRealPost() {
	console.log("Test: Real Post Loading - future-of-intelligent-systems")

	if (typeof window.md4wLoader === "undefined") {
		console.error("✗ FAIL: window.md4wLoader not available")
		return false
	}

	try {
		const posts = await blogEngine.loadPostsIndex()
		if (!posts || posts.length === 0) {
			console.error("✗ FAIL: No posts loaded")
			return false
		}

		const testPost = posts.find(p => p.slug === "future-of-intelligent-systems")
		if (!testPost) {
			console.error("✗ FAIL: Test post 'future-of-intelligent-systems' not found")
			return false
		}

		const post = await blogEngine.loadPost("future-of-intelligent-systems")
		if (!post || !post.title || !post.content) {
			console.error("✗ FAIL: Post loaded but missing required fields")
			return false
		}

		if (!post.title.includes("Future of Intelligent Systems")) {
			console.error("✗ FAIL: Post title mismatch")
			return false
		}

		if (post.content.length < 100) {
			console.error("✗ FAIL: Post content too short")
			return false
		}

		const container = document.createElement("div")
		container.id = "test-real-post"
		await blogEngine.renderPost("future-of-intelligent-systems", container)

		const renderedTitle = container.querySelector("h1")?.textContent
		const hasContent = container.textContent.length > 200

		if (renderedTitle && renderedTitle.includes("Future") && hasContent) {
			console.log("✓ PASS: Real post loaded and rendered correctly")
			console.log("  - Title:", renderedTitle)
			console.log("  - Content length:", container.textContent.length, "chars")
			return true
		} else {
			console.error("✗ FAIL: Real post rendering failed")
			console.error("  - Rendered title:", renderedTitle)
			console.error("  - Has content:", hasContent)
			return false
		}
	} catch (error) {
		console.error("✗ FAIL: Real post test threw error:", error)
		return false
	}
}

async function runTests() {
	console.log("=== Blog Engine Tests ===\n")

	const results = []
	results.push(await testLoadPostsIndex())
	results.push(testParseFrontMatter())
	results.push(await testLoadPost())
	results.push(await testRenderPost())
	results.push(await testRealPost())

	const passed = results.filter(Boolean).length
	const total = results.length

	console.log(`\n=== Results: ${passed}/${total} tests passed ===`)

	if (passed === total) {
		console.log("✓ All tests passed!")
		return true
	} else {
		console.error(`✗ ${total - passed} test(s) failed`)
		return false
	}
}

if (typeof window !== "undefined") {
	window.blogEngineTests = { runTests }
}
