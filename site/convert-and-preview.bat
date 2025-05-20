@echo off
echo BBS-Style Website - Convert and Preview
echo -------------------------------------
echo.

echo Step 1: Converting Markdown posts to HTML...
call convert_markdown.bat

echo.
echo Step 2: Starting preview server...
call preview.bat

echo.
echo Done! Your site should now be visible in your browser.
