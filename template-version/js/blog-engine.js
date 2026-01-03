/**
 * Simple BBS-Style Blog Engine
 * Fetches markdown posts and renders them client-side using md4w
 * Designed for GitHub Pages static hosting
 */

class BlogEngine {
    constructor() {
        this.postsIndex = null;
        this.basePath = this._detectBasePath();
    }

    /**
     * Detects base path for GitHub Pages compatibility
     * Handles both root domain and /repo-name/ deployments
     * For template-version, checks if we're in a subdirectory
     */
    _detectBasePath() {
        const path = window.location.pathname;

        // Check if we're in template-version subdirectory
        if (path.includes('/template-version/')) {
            const match = path.match(/^\/([^\/]+)\/template-version/);
            if (match) {
                return `/${match[1]}/template-version`;
            }
            return '/template-version';
        }

        // Check for repo-name deployment
        const match = path.match(/^\/([^\/]+)\//);
        if (match && !['blog', 'pages', 'templates', 'js', 'css', '_posts', 'template-version'].includes(match[1])) {
            return `/${match[1]}`;
        }
        return '';
    }

    /**
     * Loads posts index from JSON file
     * @returns {Promise<Array>} Array of post metadata
     */
    async loadPostsIndex() {
        if (this.postsIndex) {
            return this.postsIndex;
        }

        try {
            const response = await fetch(`${this.basePath}/js/posts-index.json`);
            if (!response.ok) {
                throw new Error(`Failed to load posts index: ${response.status}`);
            }
            this.postsIndex = await response.json();
            return this.postsIndex;
        } catch (error) {
            console.error('Error loading posts index:', error);
            return [];
        }
    }

    /**
     * Parses front matter from markdown
     * @param {string} markdown - Markdown content with front matter
     * @returns {Object} Object with metadata and content
     */
    parseFrontMatter(markdown) {
        const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
        const match = markdown.match(frontMatterRegex);

        if (!match) {
            return { metadata: {}, content: markdown };
        }

        const metadataText = match[1];
        const content = match[2];
        const metadata = {};

        metadataText.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) return;

            const colonIndex = trimmed.indexOf(':');
            if (colonIndex > 0) {
                const key = trimmed.substring(0, colonIndex).trim();
                let value = trimmed.substring(colonIndex + 1).trim();

                if ((value.startsWith('"') && value.endsWith('"')) ||
                    (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }

                if (key === 'categories' && value.includes(' ')) {
                    metadata[key] = value.split(' ').filter(Boolean);
                } else {
                    metadata[key] = value;
                }
            }
        });

        return { metadata, content };
    }

    /**
     * Loads a markdown post file
     * @param {string} slug - Post slug/identifier
     * @returns {Promise<Object>} Post data with metadata and content
     */
    async loadPost(slug) {
        try {
            const index = await this.loadPostsIndex();
            const postMeta = index.find(p => p.slug === slug);

            if (!postMeta) {
                throw new Error(`Post not found: ${slug}`);
            }

            const filename = postMeta.filename || `${postMeta.date}-${slug}.md`;
            // Try template-version/_posts first, then root _posts
            let response = await fetch(`${this.basePath}/_posts/${filename}`);
            if (!response.ok) {
                // Fallback to root _posts if template-version doesn't have it
                const rootPath = this.basePath.replace('/template-version', '');
                response = await fetch(`${rootPath}/_posts/${filename}`);
            }

            if (!response.ok) {
                throw new Error(`Failed to load post: ${response.status}`);
            }

            const markdown = await response.text();
            const { metadata, content } = this.parseFrontMatter(markdown);

            return {
                ...postMeta,
                ...metadata,
                content,
                markdown
            };
        } catch (error) {
            console.error(`Error loading post ${slug}:`, error);
            throw error;
        }
    }

    /**
     * Renders a blog post into a container
     * @param {string} slug - Post slug
     * @param {HTMLElement|string} container - Container element or selector
     */
    async renderPost(slug, container) {
        const containerEl = typeof container === 'string'
            ? document.querySelector(container)
            : container;

        if (!containerEl) {
            console.error('Container not found');
            return;
        }

        try {
            const post = await this.loadPost(slug);
            const html = await md4wLoader.render(post.content);

            const postDate = new Date(post.date);
            const formattedDate = postDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            const wordCount = post.content.split(/\s+/).length;
            const readTime = Math.ceil(wordCount / 200);

            const categories = Array.isArray(post.categories)
                ? post.categories.join(' • ')
                : post.categories || '';

            if (window.templateEngine) {
                const templateData = {
                    postTitle: post.title,
                    postDate: formattedDate,
                    readTime: readTime,
                    fileName: slug,
                    postContent: html,
                    categories: categories
                };

                await templateEngine.includeTemplate(
                    containerEl,
                    'blog-post',
                    'templates/blog-post.html',
                    templateData
                );
            } else {
                containerEl.innerHTML = this._renderPostHTML({
                    postTitle: post.title,
                    postDate: formattedDate,
                    readTime: readTime,
                    fileName: slug,
                    postContent: html,
                    categories: categories
                });
            }
        } catch (error) {
            containerEl.innerHTML = `
                <div class="bbs-box error">
                    <div class="bbs-header">Error Loading Post</div>
                    <p>Failed to load post: ${error.message}</p>
                    <div class="terminal">
                        <span class="prompt">$ </span>
                        <span class="command">cat ${slug}.md</span>
                        <div class="output">cat: ${slug}.md: No such file or directory</div>
                    </div>
                </div>
            `;
        }
    }

    /**
     * Renders blog post list
     * @param {HTMLElement|string} container - Container element or selector
     */
    async renderPostList(container) {
        const containerEl = typeof container === 'string'
            ? document.querySelector(container)
            : container;

        if (!containerEl) {
            console.error('Container not found');
            return;
        }

        try {
            const posts = await this.loadPostsIndex();

            if (posts.length === 0) {
                containerEl.innerHTML = '<li class="post-item"><p>No posts found.</p></li>';
                return;
            }

            posts.sort((a, b) => new Date(b.date) - new Date(a.date));

            const html = posts.map(post => {
                const postDate = new Date(post.date);
                const formattedDate = postDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });

                const categories = Array.isArray(post.categories)
                    ? post.categories.join(' • ')
                    : post.categories || '';

                return `
                    <li class="post-item">
                        <h2 class="post-title">
                            <a href="${this.basePath}/blog/${post.slug}.html">${post.title}</a>
                        </h2>
                        <div class="post-meta">
                            Posted on ${formattedDate}${categories ? ' • ' + categories : ''}
                        </div>
                        <div class="post-excerpt">
                            <p>${post.excerpt || 'Read this post for more information.'}</p>
                        </div>
                        <a href="${this.basePath}/blog/${post.slug}.html">Read more →</a>
                    </li>
                `;
            }).join('');

            containerEl.innerHTML = html;
        } catch (error) {
            containerEl.innerHTML = `
                <li class="post-item">
                    <p>Error loading posts: ${error.message}</p>
                </li>
            `;
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
        `;
    }

    /**
     * Escapes HTML to prevent XSS
     * @private
     */
    _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

const blogEngine = new BlogEngine();

