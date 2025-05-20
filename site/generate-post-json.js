// Post JSON Generator
const fs = require("fs-extra");
const path = require("path");
const frontMatter = require("front-matter");

// Configure paths
const postsDir = path.join(__dirname, "_posts");
const outputFile = path.join(__dirname, "js", "posts.json");

// Process markdown files and generate posts.json
console.log("Generating posts.json from markdown files...");
const files = fs.readdirSync(postsDir).filter((file) => file.endsWith(".md"));

if (files.length === 0) {
    console.log("No markdown files found in " + postsDir);
    process.exit(0);
}

const posts = [];

files.forEach((file) => {
    try {
        const filePath = path.join(postsDir, file);
        const content = fs.readFileSync(filePath, "utf8");

        // Parse front matter
        const { attributes, body } = frontMatter(content);
        const { title, date, categories, excerpt, image } = attributes;

        // Get slug from filename (remove date prefix and extension)
        const slug = file
            .replace(/^\d{4}-\d{2}-\d{2}-/, "") // Remove date prefix
            .replace(/\.md$/, ""); // Remove .md extension

        // Add post data to array
        posts.push({
            title,
            date,
            slug,
            categories: categories ? categories.split(" ") : [],
            excerpt: excerpt || getExcerpt(body),
            image: image || null,
        });

        console.log(`Processed ${file}`);
    } catch (err) {
        console.error(`Error processing ${file}: ${err.message}`);
    }
});

// Sort posts by date (newest first)
posts.sort((a, b) => new Date(b.date) - new Date(a.date));

// Write the JSON file
fs.writeFileSync(outputFile, JSON.stringify(posts, null, 2));
console.log(`Successfully generated ${outputFile} with ${posts.length} posts`);

/**
 * Extract an excerpt from the post body if none is provided in front matter
 * @param {string} markdown - The post content
 * @returns {string} - The extracted excerpt
 */
function getExcerpt(markdown) {
    // Remove heading lines
    const withoutHeadings = markdown.replace(/^#+.*$/gm, "");

    // Get first non-empty paragraph
    const paragraphs = withoutHeadings.split("\n\n");
    const firstParagraph = paragraphs.find((p) => p.trim().length > 0) || "";

    // Clean up paragraph and limit length
    const cleaned = firstParagraph
        .replace(/[#*_`]/g, "") // Remove markdown formatting
        .trim();

    return cleaned.length > 150 ? cleaned.substring(0, 150) + "..." : cleaned;
}
