/**
 * Generates posts-index.json from _posts directory
 * Run this after adding new posts: npm run generate-index
 */

const fs = require('fs');
const path = require('path');

const postsDir = path.join(__dirname, '..', '_posts');
const outputPath = path.join(__dirname, '..', 'js', 'posts-index.json');

if (!fs.existsSync(postsDir)) {
    console.error(`Posts directory not found: ${postsDir}`);
    process.exit(1);
}

const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const files = fs.readdirSync(postsDir).filter(file => file.endsWith('.md'));

if (files.length === 0) {
    console.warn('No markdown files found in _posts directory');
    fs.writeFileSync(outputPath, JSON.stringify([], null, 2));
    process.exit(0);
}

const posts = files.map(file => {
    const filePath = path.join(postsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');

    const frontMatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);

    if (!frontMatterMatch) {
        console.warn(`Skipping ${file}: No front matter found`);
        return null;
    }

    const metadataText = frontMatterMatch[1];
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

    const slug = file.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '');

    return {
        title: metadata.title || 'Untitled',
        date: metadata.date || file.match(/^(\d{4}-\d{2}-\d{2})/)?.[1] || '',
        slug: slug,
        filename: file,
        categories: metadata.categories || (metadata.categories ? metadata.categories.split(' ') : []),
        excerpt: metadata.excerpt || '',
        author: metadata.author || 'Jonathan Solarz'
    };
}).filter(Boolean);

posts.sort((a, b) => new Date(b.date) - new Date(a.date));

fs.writeFileSync(outputPath, JSON.stringify(posts, null, 2));
console.log(`Generated posts index with ${posts.length} posts`);
console.log(`Output: ${outputPath}`);

