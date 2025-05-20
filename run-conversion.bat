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

:: Install dependencies if needed
if not exist "%~dp0node_modules" (
  echo Installing dependencies...
  npm install front-matter markdown-it fs-extra
)

:: Run the conversion script
echo Running conversion script...
node "%~dp0convert-blog.js"

echo.
echo Conversion complete! Press any key to exit.
pause
