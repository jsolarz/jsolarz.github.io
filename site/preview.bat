@echo off
echo BBS-Style Website Local Preview
echo ==============================
echo.
echo This script will help you preview your website locally using Python's built-in HTTP server.
echo.

:MENU
echo Choose an option:
echo 1. Start Python HTTP server (Python 3)
echo 2. Start Python HTTP server (Python 2)
echo 3. Start PHP development server (if PHP is installed)
echo 4. Start Node.js server (if Node.js is installed)
echo 5. Open in browser
echo 6. Exit
echo.

set /p choice="Enter your choice (1-6): "

if "%choice%"=="1" goto PYTHON3
if "%choice%"=="2" goto PYTHON2
if "%choice%"=="3" goto PHP
if "%choice%"=="4" goto NODE
if "%choice%"=="5" goto BROWSER
if "%choice%"=="6" goto END
goto MENU

:PYTHON3
echo.
echo Starting Python 3 HTTP server on port 8000...
echo Press Ctrl+C to stop the server.
echo.
python -m http.server 8000
goto END

:PYTHON2
echo.
echo Starting Python 2 HTTP server on port 8000...
echo Press Ctrl+C to stop the server.
echo.
python -m SimpleHTTPServer 8000
goto END

:PHP
echo.
echo Starting PHP development server on port 8000...
echo Press Ctrl+C to stop the server.
echo.
php -S localhost:8000
goto END

:NODE
echo.
if not exist server.js (
  echo Creating simple Node.js server file...
  echo const http = require('http'); > server.js
  echo const fs = require('fs'); >> server.js
  echo const path = require('path'); >> server.js
  echo. >> server.js
  echo const PORT = 8000; >> server.js
  echo. >> server.js
  echo const MIME_TYPES = { >> server.js
  echo   '.html': 'text/html', >> server.js
  echo   '.css': 'text/css', >> server.js
  echo   '.js': 'text/javascript', >> server.js
  echo   '.json': 'application/json', >> server.js
  echo   '.png': 'image/png', >> server.js
  echo   '.jpg': 'image/jpeg', >> server.js
  echo   '.jpeg': 'image/jpeg', >> server.js
  echo   '.gif': 'image/gif', >> server.js
  echo   '.svg': 'image/svg+xml', >> server.js
  echo   '.ico': 'image/x-icon' >> server.js
  echo }; >> server.js
  echo. >> server.js
  echo const server = http.createServer((req, res) ^=^> { >> server.js
  echo   console.log(`${req.method} ${req.url}`); >> server.js
  echo. >> server.js
  echo   // Handle default route to index.html >> server.js
  echo   let filePath = req.url === '/' ? 'index.html' : req.url; >> server.js
  echo   filePath = path.join(__dirname, filePath); >> server.js
  echo. >> server.js
  echo   const extname = path.extname(filePath); >> server.js
  echo   const contentType = MIME_TYPES[extname] || 'text/plain'; >> server.js
  echo. >> server.js
  echo   // Read the file >> server.js
  echo   fs.readFile(filePath, (err, content) ^=^> { >> server.js
  echo     if (err) { >> server.js
  echo       if (err.code === 'ENOENT') { >> server.js
  echo         // File not found >> server.js
  echo         fs.readFile(path.join(__dirname, 'index.html'), (err, content) ^=^> { >> server.js
  echo           res.writeHead(200, { 'Content-Type': 'text/html' }); >> server.js
  echo           res.end(content, 'utf-8'); >> server.js
  echo         }); >> server.js
  echo       } else { >> server.js
  echo         // Server error >> server.js
  echo         res.writeHead(500); >> server.js
  echo         res.end(`Server Error: ${err.code}`); >> server.js
  echo       } >> server.js
  echo     } else { >> server.js
  echo       // Success >> server.js
  echo       res.writeHead(200, { 'Content-Type': contentType }); >> server.js
  echo       res.end(content, 'utf-8'); >> server.js
  echo     } >> server.js
  echo   }); >> server.js
  echo }); >> server.js
  echo. >> server.js
  echo server.listen(PORT, () ^=^> { >> server.js
  echo   console.log(`Server running at http://localhost:${PORT}/`); >> server.js
  echo   console.log('Press Ctrl+C to stop the server'); >> server.js
  echo }); >> server.js
)

echo Starting Node.js server on port 8000...
echo Press Ctrl+C to stop the server.
echo.
node server.js
goto END

:BROWSER
echo.
echo Opening website in your default browser...
start http://localhost:8000
goto MENU

:END
echo.
echo Thank you for using BBS-Style Website Local Preview!
echo.
