@echo off
echo BBS-Style Website - Markdown Blog Post Converter
echo -------------------------------------------
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo Error: Node.js is required but not found.
  echo Please install Node.js from https://nodejs.org/
  pause
  exit /b 1
)

:: Create package.json if it doesn't exist
if not exist "%~dp0package.json" (
  echo Creating package.json...
  echo { > "%~dp0package.json"
  echo   "name": "bbs-blog-converter", >> "%~dp0package.json"
  echo   "version": "1.0.0", >> "%~dp0package.json"
  echo   "description": "Converts markdown blog posts to HTML", >> "%~dp0package.json"
  echo   "scripts": { >> "%~dp0package.json"
  echo     "convert": "node convert-blog.js" >> "%~dp0package.json"
  echo   }, >> "%~dp0package.json"
  echo   "dependencies": { >> "%~dp0package.json"
  echo     "front-matter": "^4.0.2", >> "%~dp0package.json"
  echo     "markdown-it": "^13.0.1", >> "%~dp0package.json"
  echo     "fs-extra": "^11.1.0" >> "%~dp0package.json"
  echo   } >> "%~dp0package.json"
  echo } >> "%~dp0package.json"
)

// Configure paths^
const postsDir = path.join(__dirname, '_posts');^
const outputDir = path.join(__dirname, 'blog');^
const templatePath = path.join(__dirname, 'blog', 'template.html');^

// Ensure output directory exists^
fs.ensureDirSync(outputDir);^

// Read the blog post template^
let template;^
try {^
  template = fs.readFileSync(templatePath, 'utf8');^
  console.log('Using template from: ' + templatePath);^
} catch (err) {^
  console.error('Blog template not found at: ' + templatePath);^
  console.log('Creating a default template...');^
  ^
  // Create a simple default template^
  template = `<!DOCTYPE html>^
<html lang="en">^
    <head>^
        <meta charset="UTF-8" />^
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />^
        <meta name="theme-color" content="#242933" />^
        <meta name="color-scheme" content="dark light" />^
        <title>{{title}} | BBS-Style Website</title>^
        <link rel="stylesheet" href="../css/style.css" />^
    </head>^
    <body>^
        <div class="container">^
            <header>^
                <h1 class="site-title typing-effect">"Behind You, a Syntax Error..."</h1>^
                <nav>^
                    <button class="menu-toggle" aria-label="Toggle navigation menu" aria-expanded="false">^
                        <span>Menu</span>^
                        <div class="menu-toggle-icon">^
                            <span></span>^
                            <span></span>^
                            <span></span>^
                        </div>^
                    </button>^
                    <ul>^
                        <li><a href="../index.html">home</a></li>^
                        <li><a href="../about.html">about</a></li>^
                        <li><a href="../blog.html">blog</a></li>^
                        <li><a href="../cv.html">cv</a></li>^
                        <li><a href="../portfolio.html">portfolio</a></li>^
                    </ul>^
                </nav>^
            </header>^
            <main>^
                <article class="blog-post">^
                    <div class="post-meta">^
                        Posted on {{date}} • {{categories}}^
                    </div>^
                    {{content}}^
                </article>^
                <div class="post-navigation">^
                    <a href="../blog.html">← Back to all posts</a>^
                </div>^
            </main>^
            <footer>^
                <p>^
                    &copy; <span class="current-year"></span> Jonathan Solarz | BBS-Style Website^
                </p>^
                <div class="footer-links">^
                    <a href="mailto:hello@solarz.me">Email</a>^
                    <a href="https://github.com/jsolarz">GitHub</a>^
                    <a href="https://linkedin.com/in/jonathan-solarz">LinkedIn</a>^
                </div>^
            </footer>^
        </div>^
        <script src="../js/scripts.js"></script>^
    </body>^
</html>`;^
  ^
  // Save the default template for future use^
  fs.writeFileSync(templatePath, template);^
}

:: Run the conversion script directly from the .js file
node "%~dp0convert-blog.js"

:: Install dependencies if node_modules doesn't exist
if not exist "%~dp0node_modules" (
  echo Installing dependencies...
  npm install
)

:: Run the conversion script
echo Converting markdown posts to HTML...
node "%~dp0convert-blog.js"

echo.
echo Conversion complete! Press any key to exit.
pause
