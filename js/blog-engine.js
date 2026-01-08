/**
 * Simple BBS-Style Blog Engine
 * Fetches markdown posts and renders them client-side using md4w
 * Designed for GitHub Pages static hosting
 */

class BlogEngine {
	constructor() {
		this.postsIndex = null
		this.basePath = this._detectBasePath()
	}

	/**
	 * Detects base path for GitHub Pages compatibility
	 * Handles both root domain and /repo-name/ deployments
	 */
	_detectBasePath() {
		const path = window.location.pathname

		// Check for repo-name deployment (e.g., /jsolarz.github.io/)
		const match = path.match(/^\/([^\/]+)\//)
		if (match && !["blog", "pages", "templates", "js", "css", "_posts", "files", "img", "docs"].includes(match[1])) {
			return `/${match[1]}`
		}
		return ""
	}

	/**
	 * Loads posts index - tries JSON index first, falls back to manifest + markdown parsing
	 * @returns {Promise<Array>} Array of post metadata
	 */
	async loadPostsIndex() {
		if (this.postsIndex) {
			return this.postsIndex
		}

		// Try to load pre-generated index first (faster)
		try {
			const response = await fetch(`${this.basePath}/js/posts-index.json`)
			if (response.ok) {
				const posts = await response.json()
				this.postsIndex = posts.map((post) => ({
					...post,
					formattedDate: this._formatDate(post.date),
				}))
				return this.postsIndex
			}
		} catch (error) {
			// Index doesn't exist or failed - try manifest fallback
		}

		// Fallback: Load manifest and parse markdown files
		try {
			const manifestResponse = await fetch(`${this.basePath}/_posts/manifest.json`)
			if (!manifestResponse.ok) {
				throw new Error("No index or manifest found")
			}

			const filenames = await manifestResponse.json()
			if (!Array.isArray(filenames)) {
				throw new Error("Invalid manifest format")
			}

			// Fetch and parse each markdown file in parallel
			const postPromises = filenames.map(async (filename) => {
				try {
					const response = await fetch(`${this.basePath}/_posts/${filename}`)
					if (!response.ok) return null

					const markdown = await response.text()
					const { metadata, content } = this.parseFrontMatter(markdown)

					// Extract slug from filename
					const slug = filename.replace(/^\d{4}-\d{2}-\d{2}-/, "").replace(/\.md$/, "")

					return {
						title: metadata.title || "Untitled",
						date: metadata.date || filename.match(/^(\d{4}-\d{2}-\d{2})/)?.[1] || "",
						slug: slug,
						filename: filename,
						categories: Array.isArray(metadata.categories)
							? metadata.categories
							: metadata.categories
							? metadata.categories.split(" ").filter(Boolean)
							: [],
						excerpt: metadata.excerpt || "",
						author: metadata.author || "Jonathan Solarz",
						formattedDate: this._formatDate(metadata.date || filename.match(/^(\d{4}-\d{2}-\d{2})/)?.[1] || ""),
					}
				} catch (error) {
					console.warn(`Failed to load ${filename}:`, error)
					return null
				}
			})

			const posts = (await Promise.all(postPromises)).filter(Boolean)
			posts.sort((a, b) => new Date(b.date) - new Date(a.date))

			this.postsIndex = posts
			return this.postsIndex
		} catch (error) {
			console.error("Error loading posts:", error)
			return []
		}
	}

	/**
	 * Formats a date string to a readable format
	 * @param {string} dateString - Date string to format
	 * @returns {string} Formatted date
	 * @private
	 */
	_formatDate(dateString) {
		const date = new Date(dateString)
		return date.toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
		})
	}

	/**
	 * Parses front matter from markdown
	 * @param {string} markdown - Markdown content with front matter
	 * @returns {Object} Object with metadata and content
	 */
	parseFrontMatter(markdown) {
		const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/
		const match = markdown.match(frontMatterRegex)

		if (!match) {
			return { metadata: {}, content: markdown }
		}

		const metadataText = match[1]
		const content = match[2]
		const metadata = {}

		metadataText.split("\n").forEach((line) => {
			const trimmed = line.trim()
			if (!trimmed || trimmed.startsWith("#")) return

			const colonIndex = trimmed.indexOf(":")
			if (colonIndex > 0) {
				const key = trimmed.substring(0, colonIndex).trim()
				let value = trimmed.substring(colonIndex + 1).trim()

				if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
					value = value.slice(1, -1)
				}

				if (key === "categories" && value.includes(" ")) {
					metadata[key] = value.split(" ").filter(Boolean)
				} else {
					metadata[key] = value
				}
			}
		})

		return { metadata, content }
	}

	/**
	 * Loads a markdown post file
	 * @param {string} slug - Post slug/identifier
	 * @returns {Promise<Object>} Post data with metadata and content
	 */
	async loadPost(slug) {
		try {
			const index = await this.loadPostsIndex()
			const postMeta = index.find((p) => p.slug === slug)

			if (!postMeta) {
				throw new Error(`Post not found: ${slug}`)
			}

			const filename = postMeta.filename || `${postMeta.date}-${slug}.md`
			const response = await fetch(`${this.basePath}/_posts/${filename}`)

			if (!response.ok) {
				throw new Error(`Failed to load post: ${response.status}`)
			}

			const markdown = await response.text()
			const { metadata, content } = this.parseFrontMatter(markdown)

			return {
				...postMeta,
				...metadata,
				content,
				markdown,
			}
		} catch (error) {
			console.error(`Error loading post ${slug}:`, error)
			throw error
		}
	}

	/**
	 * Renders a blog post into a container
	 * @param {string} slug - Post slug
	 * @param {HTMLElement|string} container - Container element or selector
	 */
	async renderPost(slug, container) {
		const containerEl = typeof container === "string" ? document.querySelector(container) : container

		if (!containerEl) {
			console.error("Container not found")
			return
		}

		try {
			const post = await this.loadPost(slug)
			const html = await md4wLoader.render(post.content)

			// Update page title dynamically
			if (post.title) {
				document.title = `${post.title} | BBS-Style Website`
			}

			// Use cached formatted date if available, otherwise format
			const formattedDate = post.formattedDate || this._formatDate(post.date)

			const wordCount = post.content.split(/\s+/).length
			const readTime = Math.ceil(wordCount / 200)

			const categories = Array.isArray(post.categories) ? post.categories.join(" • ") : post.categories || ""

			if (window.templateEngine) {
				const templateData = {
					postTitle: post.title,
					postDate: formattedDate,
					readTime: readTime,
					fileName: slug,
					postContent: html,
					categories: categories,
				}

				await templateEngine.includeTemplate(containerEl, "blog-post", "templates/blog-post.html", templateData)
			} else {
				containerEl.innerHTML = this._renderPostHTML({
					postTitle: post.title,
					postDate: formattedDate,
					readTime: readTime,
					fileName: slug,
					postContent: html,
					categories: categories,
				})
			}
		} catch (error) {
			// Use safe DOM methods for error display
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
                <span class="command">cat ${this._escapeHtml(slug)}.md</span>
                <div class="output">cat: ${this._escapeHtml(slug)}.md: No such file or directory</div>
            `
			errorBox.appendChild(terminal)

			containerEl.innerHTML = ""
			containerEl.appendChild(errorBox)
		}
	}

	/**
	 * Renders blog post list
	 * @param {HTMLElement|string} container - Container element or selector
	 */
	async renderPostList(container) {
		const containerEl = typeof container === "string" ? document.querySelector(container) : container

		if (!containerEl) {
			console.error("Container not found")
			return
		}

		try {
			const posts = await this.loadPostsIndex()

			if (posts.length === 0) {
				const li = document.createElement("li")
				li.className = "post-item"
				const p = document.createElement("p")
				p.textContent = "No posts found."
				li.appendChild(p)
				containerEl.innerHTML = ""
				containerEl.appendChild(li)
				return
			}

			posts.sort((a, b) => new Date(b.date) - new Date(a.date))

			// Use DocumentFragment for better performance
			const fragment = document.createDocumentFragment()

			posts.forEach((post) => {
				const li = document.createElement("li")
				li.className = "post-item"

				// Title with link
				const h2 = document.createElement("h2")
				h2.className = "post-title"
				const titleLink = document.createElement("a")
				titleLink.href = `${this.basePath}/blog/${this._escapeHtml(post.slug)}.html`
				titleLink.textContent = post.title // Safe: textContent escapes automatically
				h2.appendChild(titleLink)
				li.appendChild(h2)

				// Meta information
				const meta = document.createElement("div")
				meta.className = "post-meta"
				const categories = Array.isArray(post.categories) ? post.categories.join(" • ") : post.categories || ""
				const metaText = `Posted on ${post.formattedDate}${categories ? " • " + categories : ""}`
				meta.textContent = metaText
				li.appendChild(meta)

				// Excerpt
				const excerpt = document.createElement("div")
				excerpt.className = "post-excerpt"
				const p = document.createElement("p")
				p.textContent = post.excerpt || "Read this post for more information."
				excerpt.appendChild(p)
				li.appendChild(excerpt)

				// Read more link
				const readMoreLink = document.createElement("a")
				readMoreLink.href = `${this.basePath}/blog/${this._escapeHtml(post.slug)}.html`
				readMoreLink.textContent = "Read more →"
				li.appendChild(readMoreLink)

				fragment.appendChild(li)
			})

			containerEl.innerHTML = "" // Clear first
			containerEl.appendChild(fragment)
		} catch (error) {
			const li = document.createElement("li")
			li.className = "post-item"
			const p = document.createElement("p")
			p.textContent = `Error loading posts: ${error.message}`
			li.appendChild(p)
			containerEl.innerHTML = ""
			containerEl.appendChild(li)
		}
	}

	/**
	 * Fallback HTML renderer
	 * @private
	 */
	_renderPostHTML(data) {
		return `
            <article>
                <h1>${this._escapeHtml(data.postTitle)}</h1>
                <div class="post-meta">Posted on ${this._escapeHtml(data.postDate)} • ${data.readTime} min read</div>
                <div class="terminal">
                    <span class="prompt">$ </span>
                    <span class="command">cat ${this._escapeHtml(data.fileName)}.md | less</span>
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
                <a href="${this.basePath}/blog.html" class="highlight-2">← Back to all posts</a>
            </article>
        `
	}

	/**
	 * Escapes HTML to prevent XSS
	 * @private
	 */
	_escapeHtml(text) {
		const div = document.createElement("div")
		div.textContent = text
		return div.innerHTML
	}
}

const blogEngine = new BlogEngine()
