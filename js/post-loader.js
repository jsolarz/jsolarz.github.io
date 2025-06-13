/**
 * BBS-Style Website - Dynamic Post Loader
 *
 * This script dynamically loads blog posts from the _posts folder and renders them in the blog.html page.
 * It uses the Fetch API to load post data and dynamically create DOM elements.
 */

document.addEventListener("DOMContentLoaded", function () {
	// Only run on the blog page
	if (!document.querySelector(".post-list")) return;

	const postListContainer = document.querySelector(".post-list");

	/**
	 * Fetch and parse post data from JSON
	 * @returns {Promise<Array>} - Array of post objects
	 */
	async function fetchPosts() {
		try {
			const response = await fetch("/js/posts.json");
			if (!response.ok) {
				throw new Error(`Failed to fetch posts: ${response.status}`);
			}
			return await response.json();
		} catch (error) {
			console.error("Error loading posts:", error);
			return [];
		}
	}

	/**
	 * Generate a post list item element from post data
	 * @param {Object} post - Post data object
	 * @returns {HTMLElement} - The generated post element
	 */
	function createPostElement(post) {
		const postItem = document.createElement("li");
		postItem.className = "post-item";

		// Format the date
		const postDate = new Date(post.date);
		const formattedDate = postDate.toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});

		// Generate categories string
		const categoriesString = post.categories ? post.categories.join(" • ") : "";

		// Create post HTML structure
		postItem.innerHTML = `
            <h2 class="post-title">
                <a href="blog/${post.slug}.html">${post.title}</a>
            </h2>
            <div class="post-meta">
                Posted on ${formattedDate}${categoriesString ? " • " + categoriesString : ""}
            </div>
            <div class="post-excerpt">
                <p>${post.excerpt || "Read this post for more information."}</p>
            </div>
            <a href="blog/${post.slug}.html">Read more →</a>
        `;

		return postItem;
	}

	/**
	 * Filter posts by category
	 * @param {Array} posts - All posts
	 * @param {string} category - Category to filter by
	 * @returns {Array} - Filtered posts
	 */
	function filterPostsByCategory(posts, category) {
		if (!category) return posts;
		return posts.filter((post) => post.categories && post.categories.includes(category.toLowerCase()));
	}

	/**
	 * Set up category filtering
	 * @param {Array} posts - All posts
	 */
	function setupCategoryFiltering(posts) {
		const categoryLinks = document.querySelectorAll(".categories-list a");
		categoryLinks.forEach((link) => {
			link.addEventListener("click", function (e) {
				e.preventDefault();
				const category = this.getAttribute("data-category");

				// Remove active class from all links
				categoryLinks.forEach((l) => l.classList.remove("active"));
				// Add active class to clicked link
				this.classList.add("active");

				// Filter and display posts
				const filteredPosts = filterPostsByCategory(posts, category);
				renderPosts(filteredPosts);
			});
		});
	}

	/**
	 * Render posts to the page
	 * @param {Array} posts - Posts to render
	 */
	function renderPosts(posts) {
		if (posts.length === 0) {
			postListContainer.innerHTML = '<li class="post-item">No posts found matching this category.</li>';
			return;
		}

		// Clear current content
		postListContainer.innerHTML = "";

		// Add posts to the container
		posts.forEach((post) => {
			const postElement = createPostElement(post);
			postListContainer.appendChild(postElement);
		});
	}

	/**
	 * Load and render posts to the page
	 */
	async function loadPosts() {
		const posts = await fetchPosts();

		// Sort posts by date (most recent first)
		posts.sort((a, b) => new Date(b.date) - new Date(a.date));

		// Render all posts initially
		renderPosts(posts);

		// Set up category filtering
		setupCategoryFiltering(posts);
	}

	// Start loading posts
	loadPosts();
});
