# 📄 Dynamic CV System

This system dynamically loads and renders CV content from a markdown file (`/files/cv.md`) with custom BBS-style formatting.

## Features

- **Markdown Parsing**: Automatically converts CV markdown to styled HTML
- **BBS Aesthetic**: Maintains the retro terminal look and feel
- **Responsive Design**: Works on all device sizes
- **Dynamic Loading**: CV content can be updated by simply editing the markdown file
- **Error Handling**: Graceful fallback when content cannot be loaded

## File Structure

```
├── pages/cv.html          # Main CV page (uses dynamic loading)
├── js/cv-loader.js        # CV markdown parser and loader
├── files/cv.md           # Source CV content in markdown
└── css/style.css         # CV-specific styles included
```

## Markdown Format

The CV markdown follows this structure:

```markdown
# NAME
Contact info
---

## Section Title
### Job Title - Company
**Date Range**
- Bullet point 1
- Bullet point 2

### Another Job
**Date Range**
- More bullets
```

## CSS Classes

The system automatically applies these CSS classes:

- `.cv-header` - CV name and contact info
- `.cv-section` - Main sections (Experience, Education, etc.)
- `.cv-job-header` - Job title and company
- `.cv-job-title` - Position title
- `.cv-company` - Company name
- `.cv-date` - Date ranges
- `.cv-bullet` - Bullet points
- `.cv-list` - Bullet point containers

## Usage

1. Edit `/files/cv.md` with your CV content
2. The page will automatically reload the content
3. All styling is handled automatically

## Error Handling

If the markdown file cannot be loaded, an error message is displayed with BBS-style terminal output.
