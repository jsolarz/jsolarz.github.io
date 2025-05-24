@echo off
echo BBS-Style Website - Post JSON Generator
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

:: Install dependencies if needed
if not exist "%~dp0node_modules\front-matter" (
  echo Installing dependencies...
  npm install front-matter fs-extra
)

:: Run the JSON generator script
echo Generating posts.json...
node "%~dp0generate-post-json.js"

echo.
echo Post JSON generation complete! Press any key to exit.
pause
