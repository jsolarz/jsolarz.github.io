# BBS-Style Website Template System

This is a simple template system for BBS-style websites that allows common sections like headers and footers to be shared across multiple pages. The template system is designed to be lightweight, easy to use, and doesn't rely on any external libraries.

## Features

- **Template Loading**: Load HTML templates from separate files
- **Variable Substitution**: Replace placeholders like `{{variableName}}` with dynamic content
- **Path Adjustment**: Automatically adjusts template paths for pages in subdirectories
- **Template Caching**: Caches templates after loading to improve performance

## Directory Structure

```
template-version/
├── css/
│   └── style.css
├── js/
│   ├── template-engine.js
│   └── scripts.js
├── templates/
│   ├── header.html
│   ├── footer.html
│   ├── home-content.html
│   ├── about-content.html
│   ├── portfolio-content.html
│   ├── cv-content.html
│   ├── blog-content.html
│   └── blog-post.html
├── blog/
│   └── first-post.html
├── index.html
├── about.html
├── portfolio.html
├── cv.html
└── blog.html
```

## Usage

### Basic Template Inclusion

To include a template in your HTML page:

```html
<div data-template="header"></div>
<main>
  <div data-template="home-content"></div>
</main>
<div data-template="footer"></div>
```

### Template with Variables

To include a template with dynamic data:

```html
<div 
  data-template="blog-post" 
  data-template-data='{"postTitle":"First Blog Post","postDate":"May 13, 2025"}'
></div>
```

In your template file:

```html
<h1>{{postTitle}}</h1>
<div class="post-meta">Posted on {{postDate}}</div>
```

### Creating a New Page

1. Create a new HTML file with the basic structure:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#242933" />
    <meta name="color-scheme" content="dark light" />
    <title>Page Title | BBS-Style Website</title>
    <link rel="stylesheet" href="css/style.css" />
  </head>
  <body>
    <div class="container">
      <!-- Header template -->
      <div data-template="header"></div>

      <!-- Main content area -->
      <main>
                <!-- Create and reference your content template -->
                <div data-template="your-content-template"></div>
                
                <!-- Or include content directly -->
                <h1>Your Page Title</h1>
                <p>Your content here...</p>
            </main>

            <!-- Footer template will be loaded here -->
            <div data-template="footer"></div>
        </div>

        <script src="js/template-engine.js"></script>
        <script src="js/scripts.js"></script>
    </body>
</html>
```

### Creating a Content Template

1. Create a new HTML file in the `templates` directory (e.g., `your-content-template.html`)
2. Add your content HTML (no need for full HTML structure, just the content)
3. Reference it in your page using `<div data-template="your-content-template"></div>`

### Modifying Shared Elements

To update elements across all pages:

1. Edit the template files in the `templates` directory
   - `header.html` for the site header
   - `footer.html` for the site footer

### Using Template Variables

The template system supports variable substitution using the `{{variable}}` syntax:

1. In your template file, use variables:
   ```html
   <h1>{{pageTitle}}</h1>
   ```

2. When loading the template, provide the values:
   ```html
   <div data-template="page-title" data-template-data='{"pageTitle": "My Custom Title"}'></div>
   ```

## Benefits

- **DRY (Don't Repeat Yourself)**: Update common elements in one place
- **Maintainability**: Easier to manage and update the site
- **Performance**: Templates are loaded once and cached
- **Modularity**: Separates content from structure

## Additional Pages and Features

### Blog Post System

The template system includes a blog post template that accepts variables for post title, date, content, and related posts:

```html
<div 
  data-template="blog-post" 
  data-template-data='{
    "postTitle": "My Blog Post Title",
    "postDate": "May 13, 2025",
    "readTime": "5",
    "fileName": "post-file-name",
    "postContent": "<p>Your HTML content here...</p>",
    "relatedPosts": "<li><a href=\"another-post.html\">Another Post</a></li>"
  }'
></div>
```

### Contact Form

The contact page template includes a simple form with JavaScript form handling. To use it:

1. Include the contact-content template in your page:
   ```html
   <div data-template="contact-content"></div>
   ```

2. The form includes client-side submission handling that can be replaced with actual form processing.

## Debug Mode

The template system includes a debug mode that shows template information on the page:

1. Open the browser console
2. Enable debug mode by running: `templateEngine.setDebugMode(true)`
3. Disable debug mode by running: `templateEngine.setDebugMode(false)`

This displays template names and boundaries, which can be helpful when:
- Troubleshooting template loading issues
- Understanding the page structure
- Identifying which templates are used where

## Testing the Template System

To test that everything is working properly:

1. Open any page in your browser (e.g., `index.html`)
2. Check that all templates load correctly (header, content, footer)
3. Navigate to other pages to ensure consistent loading
4. Test theme toggle functionality by clicking the theme button
5. Check that dynamic content (like the current year in the footer) updates properly
6. Test the blog post template with different data values

## Browser Compatibility

This template system works in all modern browsers that support:
- Fetch API
- ES6 Classes
- Template literals
- localStorage
- CSS custom properties

## Troubleshooting

If you encounter any issues:

1. Check the browser console for error messages
2. Verify that all template files exist and are correctly referenced
3. Make sure JSON data in `data-template-data` attributes is valid
4. Ensure paths are correct for subdirectory pages

For pages in subdirectories, the template engine automatically adjusts paths to template files and assets.
