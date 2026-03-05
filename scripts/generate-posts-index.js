/**
 * Generates posts-index.json from _posts (metadata only). Optional: writes _posts/manifest.json.
 * Run after adding or changing posts so the blog listing is up to date.
 */

const fs = require("fs")
const path = require("path")

const POSTS_DIR = path.join(__dirname, "..", "_posts")
const OUTPUT_PATH = path.join(__dirname, "..", "js", "posts-index.json")
const DEFAULT_AUTHOR = "Jonathan Solarz"
const EXCERPT_MAX_LEN = 200

if (!fs.existsSync(POSTS_DIR)) {
	console.error(`Posts directory not found: ${POSTS_DIR}`)
	process.exit(1)
}

const outputDir = path.dirname(OUTPUT_PATH)
if (!fs.existsSync(outputDir)) {
	fs.mkdirSync(outputDir, { recursive: true })
}

const files = fs.readdirSync(POSTS_DIR).filter((file) => file.endsWith(".md"))

if (files.length === 0) {
	console.warn("No markdown files found in _posts directory")
	fs.writeFileSync(OUTPUT_PATH, JSON.stringify([], null, 2))
	process.exit(0)
}

function slugFromFilename(file) {
	return file.replace(/^\d{4}-\d{2}-\d{2}-/, "").replace(/\.md$/, "")
}

function dateFromFilename(file) {
	const m = file.match(/^(\d{4}-\d{2}-\d{2})/)
	return m ? m[1] : ""
}

function titleFromFirstHeading(content) {
	const m = content.match(/^#\s+(.+)$/m)
	return m ? m[1].trim() : "Untitled"
}

function excerptFromFirstParagraph(content) {
	const lines = content.split(/\r?\n/)
	let i = 0
	if (lines[0].match(/^#\s+/)) i = 1
	while (i < lines.length && lines[i].trim() === "") i++
	while (i < lines.length && lines[i].trim().match(/^#+\s+/)) {
		i++
		while (i < lines.length && lines[i].trim() === "") i++
	}
	const paragraphLines = []
	while (i < lines.length && lines[i].trim() !== "") {
		const line = lines[i].trim()
		if (!line.match(/^#+\s+/)) paragraphLines.push(line)
		i++
	}
	return paragraphLines.join(" ").replace(/\s+/g, " ").trim().slice(0, EXCERPT_MAX_LEN) || ""
}

function parseCategories(raw) {
	if (Array.isArray(raw)) return raw
	if (raw === "[]" || raw === "") return []
	return raw ? String(raw).split(" ").filter(Boolean) : []
}

const posts = files
	.map((file) => {
		const filePath = path.join(POSTS_DIR, file)
		const rawContent = fs.readFileSync(filePath, "utf8")
		const slug = slugFromFilename(file)
		const date = dateFromFilename(file)

		const frontMatterMatch = rawContent.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/)

		if (frontMatterMatch) {
			const metadataText = frontMatterMatch[1]
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

			return {
				title: metadata.title || titleFromFirstHeading(rawContent),
				date: metadata.date || date,
				slug: metadata.slug || slug,
				filename: file,
				categories: parseCategories(metadata.categories),
				excerpt: metadata.excerpt || "",
				author: metadata.author || DEFAULT_AUTHOR,
			}
		}

		return {
			title: titleFromFirstHeading(rawContent),
			date,
			slug,
			filename: file,
			categories: [],
			excerpt: excerptFromFirstParagraph(rawContent),
			author: DEFAULT_AUTHOR,
		}
	})
	.filter(Boolean)

posts.sort((a, b) => {
	const dateA = a?.date ? new Date(a.date).getTime() : 0
	const dateB = b?.date ? new Date(b.date).getTime() : 0
	return dateB - dateA
})

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(posts, null, 2))
console.log(`Generated posts index with ${posts.length} posts`)
console.log(`Output: ${OUTPUT_PATH}`)

const manifest = posts.map((p) => p.filename)
fs.writeFileSync(path.join(POSTS_DIR, "manifest.json"), JSON.stringify(manifest, null, 2))
console.log(`Updated: ${path.join(POSTS_DIR, "manifest.json")}`)
