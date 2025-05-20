@echo off
echo Starting local server for BBS-Style Website Template System...

cd /d "%~dp0"
echo Server running at http://localhost:8000
echo Press Ctrl+C to stop the server

:: Check if Python is available (most systems have it)
where python >nul 2>nul
if %ERRORLEVEL% == 0 (
  python -m http.server 8000
  goto :end
)

:: Try Python 3 specifically
where python3 >nul 2>nul
if %ERRORLEVEL% == 0 (
  python3 -m http.server 8000
  goto :end
)

:: If Python isn't available, try with Node.js
where npx >nul 2>nul
if %ERRORLEVEL% == 0 (
  npx http-server -p 8000
  goto :end
)

echo ERROR: Could not find Python or Node.js to start a local server.
echo Please install Python or Node.js, or use another local server solution.
pause

:end
