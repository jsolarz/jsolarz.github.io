# BBS-Style Website

A modern BBS-style website with Nord color theme (slightly darker variant), designed to be simple, responsive, and easy to update. This is a static website with no frameworks, focusing on mobile-first design and using monospace text-heavy content.

## Features

- Responsive, mobile-first design
- Simple HTML/CSS/JS without frameworks
- BBS-style aesthetic with Nord color theme (darker variant)
- Dark mode by default with light mode toggle option
- Easy to update content via HTML files
- Monospace text-heavy design inspired by old bulletin board systems
- Modern retro feel with clean typography

## Project Structure

```
├── css/                      # Stylesheets
│   └── style.css             # Main CSS with Nord theme
├── js/                       # JavaScript files
│   ├── scripts.js            # Main site scripts
│   ├── analytics.js          # Analytics tracking
│   └── analytics-db.js       # Analytics database
├── scripts/                  # Build & automation scripts
│   ├── convert-blog.js       # Markdown to HTML converter
│   ├── generate-post-json.js # Blog post indexer
│   └── *.bat                 # Windows batch files
├── tests/                    # Test files
│   ├── test-analytics.html   # Analytics testing
│   └── test-*.html           # Various test pages
├── blog/                     # Blog posts directory
├── img/                      # Image assets
├── _posts/                   # Markdown blog posts
├── analytics-dashboard/      # Analytics dashboard
├── index.html                # Homepage
├── about.html                # About page
├── blog.html                 # Blog listing
├── cv.html                   # Resume/CV
├── portfolio.html            # Portfolio
└── analytics.html            # Analytics dashboard
```

## How to Update Content

### General Page Content

Each main section of the website has its own HTML file:

1. `index.html` - Homepage/welcome page
2. `about.html` - About information
3. `blog.html` - Blog post listing
4. `cv.html` - Resume/CV information
5. `portfolio.html` - Portfolio of work/projects

To update any of these pages, simply edit the corresponding HTML file using a text editor.

### Adding a New Blog Post

To add a new blog post:

1. Create a new HTML file in the `blog/` directory (e.g., `blog/new-post.html`)
2. Copy the structure from an existing blog post like `blog/first-post.html`
3. Update the content, title, meta information, etc.
4. Add a link to the new post in `blog.html` by adding a new list item in the `post-list` section

### Updating the Portfolio

To add a new portfolio item:

1. Open `portfolio.html`
2. Add a new `div` element with the class `portfolio-item` within the `portfolio-grid` section
3. Update the content with your project information

### Updating the CV/Resume

To update your CV or resume information:

1. Open `cv.html`
2. Edit the relevant sections to reflect your current experience, skills, education, etc.

## Customization

### Colors

The color scheme is defined in CSS variables at the top of `css/style.css`. You can modify these to change the color scheme of the entire website.

### Theme Toggle (Dark/Light Mode)

The website features a dark mode by default with a light mode toggle option. The toggle button appears in the bottom right corner of every page. User preferences are saved in localStorage so their choice persists across pages and visits.

To customize the light mode colors, modify the CSS variables with the `--light-` prefix in the `:root` section of the CSS file.

### Typography

The website uses monospace typography, with the font specified in the `--font-mono` CSS variable. You can change this to any other monospace font.

### Adding Custom Styling

If you need to add custom styles for specific elements, you can add them at the end of the `style.css` file.

## Browser Compatibility

This website is designed to work on modern browsers, including:

- Chrome/Edge (latest versions)
- Firefox (latest versions)
- Safari (latest versions)
- Mobile browsers (iOS/Android)

## Deployment

This is a static website, so it can be deployed to any web hosting service that supports static sites, including:

- GitHub Pages
- Netlify
- Vercel
- Amazon S3
- Any traditional web hosting service

Simply upload all the files to your hosting provider to deploy the website.

## License

Feel free to modify this template for your personal use.
