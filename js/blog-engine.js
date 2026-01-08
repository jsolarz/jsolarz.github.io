class BlogEngine {
	#postsIndex = /** @type {Array<Object> | null} */ (null)
	#basePath = ""

	constructor() {
		this.#basePath = this.#detectBasePath()
	}

	#detectBasePath() {
		const match = window.location.pathname.match(/^\/([^\/]+)\//)
		if (match && !["blog", "pages", "templates", "js", "css", "_posts", "files", "img", "docs"].includes(match[1])) {
			return `/${match[1]}`
		}
		return ""
	}

	async loadPostsIndex() {
		if (this.#postsIndex) return this.#postsIndex

		try {
			const response = await fetch(`${this.#basePath}/js/posts-index.json`)
			if (response.ok) {
				const posts = await response.json()
				this.#postsIndex = posts.map((post) => ({ ...post, formattedDate: this.#formatDate(post.date) }))
				return this.#postsIndex
			}
		} catch {
			// Fall through to manifest fallback
		}

		try {
			const manifestResponse = await fetch(`${this.#basePath}/_posts/manifest.json`)
			if (!manifestResponse.ok) throw new Error("No index or manifest found")

			const filenames = await manifestResponse.json()
			if (!Array.isArray(filenames)) throw new Error("Invalid manifest format")

			const posts = (
				await Promise.all(
					filenames.map(async (filename) => {
						try {
							const response = await fetch(`${this.#basePath}/_posts/${filename}`)
							if (!response.ok) return null

							const markdown = await response.text()
							const { metadata, content } = this.#parseFrontMatter(markdown)
							const slug = filename.replace(/^\d{4}-\d{2}-\d{2}-/, "").replace(/\.md$/, "")
							const date = metadata.date || filename.match(/^(\d{4}-\d{2}-\d{2})/)?.[1] || ""

							return {
								title: metadata.title || "Untitled",
								date,
								slug,
								filename,
								categories: Array.isArray(metadata.categories)
									? metadata.categories
									: metadata.categories
									? metadata.categories.split(" ").filter(Boolean)
									: [],
								excerpt: metadata.excerpt || "",
								author: metadata.author || "Jonathan Solarz",
								formattedDate: this.#formatDate(date),
							}
						} catch (error) {
							console.warn(`Failed to load ${filename}:`, error)
							return null
						}
					})
				)
			).filter(/** @type {(post: any) => post is Object} */ ((post) => post !== null))

			/** @type {any} */
			const postsArray = posts
			this.#postsIndex = postsArray.toSorted((a, b) => {
				const dateA = a?.date ? new Date(a.date).getTime() : 0
				const dateB = b?.date ? new Date(b.date).getTime() : 0
				return dateB - dateA
			})
			return this.#postsIndex
		} catch (error) {
			console.error("Error loading posts:", error)
			return []
		}
	}

	#formatDate(dateString) {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
		})
	}

	#parseFrontMatter(markdown) {
		const match = markdown.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/)
		if (!match) return { metadata: {}, content: markdown }

		const metadata = {}
		match[1].split("\n").forEach((line) => {
			const trimmed = line.trim()
			if (!trimmed || trimmed.startsWith("#")) return

			const colonIndex = trimmed.indexOf(":")
			if (colonIndex > 0) {
				const key = trimmed.substring(0, colonIndex).trim()
				let value = trimmed.substring(colonIndex + 1).trim()

				if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
					value = value.slice(1, -1)
				}

				metadata[key] = key === "categories" && value.includes(" ") ? value.split(" ").filter(Boolean) : value
			}
		})

		return { metadata, content: match[2] }
	}

	async loadPost(slug) {
		const index = await this.loadPostsIndex()
		if (!index) throw new Error("Posts index not loaded")
		const postMeta = index.find((p) => p.slug === slug)
		if (!postMeta) throw new Error(`Post not found: ${slug}`)

		const filename = postMeta.filename || `${postMeta.date}-${slug}.md`
		const response = await fetch(`${this.#basePath}/_posts/${filename}`)
		if (!response.ok) throw new Error(`Failed to load post: ${response.status}`)

		const markdown = await response.text()
		const { metadata, content } = this.#parseFrontMatter(markdown)

		return { ...postMeta, ...metadata, content, markdown }
	}

	async renderPost(slug, container) {
		const containerEl = typeof container === "string" ? document.querySelector(container) : container
		if (!containerEl) {
			console.error("Container not found")
			return
		}

		try {
			const post = await this.loadPost(slug)
			if (!post || !post.content) {
				throw new Error("Post content is missing")
			}

			/** @type {any} */
			const win = window
			const loader = win.markdownLoader

			if (!loader) {
				throw new Error("markdownLoader is not available. Check if markdown-loader.js loaded successfully.")
			}

			if (typeof loader.render !== "function") {
				throw new Error(`markdownLoader.render is not a function (type: ${typeof loader.render})`)
			}

			const html = await loader.render(post.content)
			if (!html || typeof html !== "string") {
				throw new Error("Markdown rendering returned invalid result")
			}

			this.#updateMetaTags(post)
			this.#renderPostContent(containerEl, post, html, slug)
		} catch (error) {
			console.error("Error rendering post:", error)
			this.#renderError(containerEl, error, slug)
		}
	}

	#updateMetaTags(post) {
		if (!post.title) return

		document.title = `${post.title} | Jonathan Solarz`

		const updateMeta = (name, content) => {
			let meta = /** @type {HTMLMetaElement | null} */ (document.querySelector(`meta[name="${name}"]`))
			if (!meta) {
				meta = document.createElement("meta")
				meta.name = name
				document.head.appendChild(meta)
			}
			meta.setAttribute("content", content)
		}

		const updateProperty = (property, content) => {
			let meta = /** @type {HTMLMetaElement | null} */ (document.querySelector(`meta[property="${property}"]`))
			if (!meta) {
				meta = document.createElement("meta")
				meta.setAttribute("property", property)
				document.head.appendChild(meta)
			}
			meta.setAttribute("content", content)
		}

		updateMeta(
			"description",
			post.excerpt || `${post.title} - Article by Jonathan Solarz on software architecture and cloud solutions.`
		)
		updateProperty("og:title", `${post.title} | Jonathan Solarz`)
		updateProperty("og:description", post.excerpt || `${post.title} - Article on software architecture and cloud solutions.`)
		updateProperty("og:url", `${window.location.origin}${this.#basePath}/blog/post.html?slug=${post.slug}`)

		const publishedTime = document.querySelector('meta[property="article:published_time"]') || document.createElement("meta")
		if (!publishedTime.hasAttribute("property")) {
			publishedTime.setAttribute("property", "article:published_time")
			document.head.appendChild(publishedTime)
		}
		publishedTime.setAttribute("content", new Date(post.date).toISOString())

		const author = document.querySelector('meta[property="article:author"]') || document.createElement("meta")
		if (!author.hasAttribute("property")) {
			author.setAttribute("property", "article:author")
			document.head.appendChild(author)
		}
		author.setAttribute("content", post.author)

		updateMeta("twitter:title", `${post.title} | Jonathan Solarz`)
		updateMeta("twitter:description", post.excerpt || `${post.title} - Article on software architecture and cloud solutions.`)

		const canonical = /** @type {HTMLLinkElement} */ (document.querySelector('link[rel="canonical"]') || document.createElement("link"))
		if (!canonical.hasAttribute("rel")) {
			canonical.rel = "canonical"
			document.head.appendChild(canonical)
		}
		canonical.href = `${window.location.origin}${this.#basePath}/blog/post.html?slug=${post.slug}`
	}

	#renderPostContent(containerEl, post, html, slug) {
		const formattedDate = post.formattedDate || this.#formatDate(post.date)
		const wordCount = post.content.split(/\s+/).length
		const readTime = Math.ceil(wordCount / 200)
		const categories = Array.isArray(post.categories) ? post.categories.join(" • ") : post.categories || ""

		const templateData = {
			postTitle: post.title,
			postDate: formattedDate,
			readTime,
			fileName: slug,
			postContent: html,
			categories,
		}

		/** @type {any} */
		const win = window
		if (win.templateEngine) {
			win.templateEngine.includeTemplate(containerEl, "blog-post", "templates/blog-post.html", templateData)
		} else {
			containerEl.innerHTML = this.#renderPostHTML(templateData)
		}
	}

	#renderPostHTML(data) {
		return `
			<article>
				<h1>${this.#escapeHtml(data.postTitle)}</h1>
				<div class="post-meta">Posted on ${this.#escapeHtml(data.postDate)} • ${data.readTime} min read</div>
				<div class="terminal">
					<span class="prompt">$ </span>
					<span class="command">cat ${this.#escapeHtml(data.fileName)}.md | less</span>
				</div>
				<div class="bbs-box">${data.postContent}</div>
				<div class="terminal">
					<span class="prompt">$ </span>
					<span class="command">echo "Comments and discussion"</span>
					<div class="output">
						<p>Feel free to share your thoughts by
							<a href="mailto:hello@solarz.me" style="color: var(--frost-2)">emailing me</a>
							or reaching out on social media!</p>
					</div>
				</div>
				<a href="${this.#basePath}/blog.html" class="highlight-2">← Back to all posts</a>
			</article>
		`
	}

	#renderError(containerEl, error, slug) {
		const errorBox = document.createElement("div")
		errorBox.className = "bbs-box error"

		const header = document.createElement("div")
		header.className = "bbs-header"
		header.textContent = "Error Loading Post"
		errorBox.appendChild(header)

		const p = document.createElement("p")
		p.textContent = `Failed to load post: ${error.message}`
		errorBox.appendChild(p)

		const terminal = document.createElement("div")
		terminal.className = "terminal"
		terminal.innerHTML = `
			<span class="prompt">$ </span>
			<span class="command">cat ${this.#escapeHtml(slug)}.md</span>
			<div class="output">cat: ${this.#escapeHtml(slug)}.md: No such file or directory</div>
		`
		errorBox.appendChild(terminal)

		containerEl.innerHTML = ""
		containerEl.appendChild(errorBox)
	}

	async renderPostList(container) {
		const containerEl = typeof container === "string" ? document.querySelector(container) : container
		if (!containerEl) {
			console.error("Container not found")
			return
		}

		try {
			const posts = await this.loadPostsIndex()
			if (!posts || posts.length === 0) {
				containerEl.innerHTML = '<li class="post-item"><p>No posts found.</p></li>'
				return
			}

			const fragment = document.createDocumentFragment()
			/** @type {any} */
			const postsArray = posts
			postsArray
				.toSorted((a, b) => {
					const dateA = a?.date ? new Date(a.date).getTime() : 0
					const dateB = b?.date ? new Date(b.date).getTime() : 0
					return dateB - dateA
				})
				.forEach((post) => {
					const li = document.createElement("li")
					li.className = "post-item"

					const h2 = document.createElement("h2")
					h2.className = "post-title"
					const titleLink = document.createElement("a")
					titleLink.href = `${this.#basePath}/blog/post.html?slug=${encodeURIComponent(post.slug)}`
					titleLink.textContent = post.title
					h2.appendChild(titleLink)
					li.appendChild(h2)

					const meta = document.createElement("div")
					meta.className = "post-meta"
					const categories = Array.isArray(post.categories) ? post.categories.join(" • ") : post.categories || ""
					meta.textContent = `Posted on ${post.formattedDate}${categories ? " • " + categories : ""}`
					li.appendChild(meta)

					const excerpt = document.createElement("div")
					excerpt.className = "post-excerpt"
					const p = document.createElement("p")
					p.textContent = post.excerpt || "Read this post for more information."
					excerpt.appendChild(p)
					li.appendChild(excerpt)

					const readMoreLink = document.createElement("a")
					readMoreLink.href = `${this.#basePath}/blog/post.html?slug=${encodeURIComponent(post.slug)}`
					readMoreLink.textContent = "Read more →"
					li.appendChild(readMoreLink)

					fragment.appendChild(li)
				})

			containerEl.innerHTML = ""
			containerEl.appendChild(fragment)
		} catch (error) {
			containerEl.innerHTML = `<li class="post-item"><p>Error loading posts: ${error.message}</p></li>`
		}
	}

	#escapeHtml(text) {
		const div = document.createElement("div")
		div.textContent = text
		return div.innerHTML
	}
}

const blogEngine = new BlogEngine()
