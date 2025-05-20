// Markdown blog post converter
const fs = require('fs-extra');
const path = require('path');
const markdownIt = require('markdown-it');
const frontMatter = require('front-matter');

const md = new markdownIt({
  html: true,
  linkify: true,
  typographer: true
});

// Configure paths
const postsDir = path.join(__dirname, '_posts');
const outputDir = path.join(__dirname, 'blog');
const templatePath = path.join(__dirname, 'blog', 'template.html');

// Ensure output directory exists
fs.ensureDirSync(outputDir);

// Read the blog post template
let template;
try {
  template = fs.readFileSync(templatePath, 'utf8');
  console.log('Using template from: ' + templatePath);
} catch (err) {
  console.error('Blog template not found at: ' + templatePath);
  console.log('Creating a default template...');
  
  // Create a simple default template
  template = `<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#242933" />
        <meta name="color-scheme" content="dark light" />
        <title>{{title}} | BBS-Style Website</title>
        <link rel="stylesheet" href="../css/style.css" />
    </head>
    <body>
        <div class="container">
            <header>
                <h1 class="site-title typing-effect">"Behind You, a Syntax Error..."</h1>
                <nav>
                    <button class="menu-toggle" aria-label="Toggle navigation menu" aria-expanded="false">
                        <span>Menu</span>
                        <div class="menu-toggle-icon">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </button>
                    <ul>
                        <li><a href="../index.html">home</a></li>
                        <li><a href="../about.html">about</a></li>
                        <li><a href="../blog.html">blog</a></li>
                        <li><a href="../cv.html">cv</a></li>
                        <li><a href="../portfolio.html">portfolio</a></li>
                    </ul>
                </nav>
            </header>
            <main>
                <article class="blog-post">
                    <div class="post-meta">
                        Posted on {{date}} • {{categories}}
                    </div>
                    {{content}}
                </article>
                <div class="post-navigation">
                    <a href="../blog.html">← Back to all posts</a>
                </div>
            </main>
            <footer>
                <p>
                    &copy; <span class="current-year"></span> Jonathan Solarz | BBS-Style Website
                </p>
                <div class="footer-links">
                    <a href="mailto:hello@solarz.me">Email</a>
                    <a href="https://github.com/jsolarz">GitHub</a>
                    <a href="https://linkedin.com/in/jonathan-solarz">LinkedIn</a>
                </div>
            </footer>
        </div>
        <script src="../js/scripts.js"></script>
    </body>
</html>`;
  
  // Save the default template for future use
  fs.writeFileSync(templatePath, template);
}

// Process all markdown files in the _posts directory
console.log('Processing markdown files...');
const files = fs.readdirSync(postsDir).filter(file => file.endsWith('.md'));

if (files.length === 0) {
  console.log('No markdown files found in ' + postsDir);
  process.exit(0);
}

files.forEach(file => {
  try {
    const filePath = path.join(postsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Parse front matter
    const { attributes, body } = frontMatter(content);
    const { title, date, author, categories, excerpt } = attributes;
    
    // Format the date
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Generate HTML from markdown
    const htmlContent = md.render(body);
    
    // Create filename (remove date prefix and change extension)
    const baseFileName = path.basename(file, '.md');
    const outputFileName = baseFileName.replace(/^\d{4}-\d{2}-\d{2}-/, '') + '.html';
    const outputPath = path.join(outputDir, outputFileName);
    
    // Replace template variables
    let postHtml = template
      .replace(/{{title}}/g, title)
      .replace(/{{date}}/g, formattedDate)
      .replace(/{{author}}/g, author || 'Jonathan Solarz')
      .replace(/{{categories}}/g, categories || '')
      .replace(/{{content}}/g, htmlContent);
    
    // Write the output file
    fs.writeFileSync(outputPath, postHtml);
    console.log(`Converted ${file} -> ${outputFileName}`);
  } catch (err) {
    console.error(`Error processing ${file}: ${err.message}`);
  }
});

console.log('Conversion complete!');
