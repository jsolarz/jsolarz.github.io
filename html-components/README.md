# Zero JavaScript Components Guide

This guide explains how to implement reusable components in your website using only HTML and CSS, with no JavaScript required.

## Approach Overview

There are three main approaches to creating JavaScript-free components:

1. **Copy-Paste Templates**: Simple HTML snippets that you copy into each page
2. **Server-Side Includes**: If you have server access (PHP, SSI, etc.)
3. **CSS-only Techniques**: For interactive elements like mobile menus

This guide focuses primarily on the copy-paste approach with CSS enhancements, which works for static websites.

## Implementation

### 1. Basic Copy-Paste Components

The simplest approach is to maintain HTML component files that you copy into each page. Example files are provided in the `html-components` directory:

- `header.html` - Site header with navigation
- `footer.html` - Site footer with links

When updating these components, you'll need to manually update each page that uses them.

### 2. CSS-Only Interactive Elements

For mobile menu toggles and other interactive elements, we use CSS techniques like the checkbox hack:

```html
<input type="checkbox" id="mobile-menu" class="mobile-menu-checkbox">
<label for="mobile-menu" class="mobile-menu-toggle">
    Menu
    <div class="mobile-menu-icon">
        <span></span>
        <span></span>
        <span></span>
    </div>
</label>
<ul>
    <!-- Navigation items -->
</ul>
```

With corresponding CSS in `components.css`:

```css
.mobile-menu-checkbox:checked ~ ul {
  display: block;
}
```

### 3. Current Page Highlighting

To highlight the current page in navigation without JavaScript:

1. Add a page-specific class to the `<body>` tag
   ```html
   <body class="page-home">
   ```

2. Use CSS to highlight the matching navigation item
   ```css
   body.page-home .nav-home {
     text-decoration: underline;
     font-weight: bold;
   }
   ```

### 4. Content "Slots"

For flexibility, we use empty divs as "slots" that disappear when not used:

```html
<div class="header-content-slot">
    <!-- Custom content here, if any -->
</div>
```

With CSS to hide them when empty:

```css
.header-content-slot:empty {
  display: none;
}
```

## Usage Example

See the complete working example in `html-components/no-js-example.html`.

## Pros and Cons

### Advantages:

- Zero JavaScript dependency
- Works with JS disabled
- Extremely lightweight
- Simple to implement and understand
- No build process required

### Disadvantages:

- Manual updates required across all pages
- Limited interactive capabilities
- Some features may still need minimal JS (e.g., current year)
- No true encapsulation
- Potential for inconsistencies

## Best Practices

1. **Minimize Duplication**: Keep components as small as possible
2. **Consistent Naming**: Use consistent class names across pages
3. **Documentation**: Comment your HTML to indicate component boundaries
4. **Validation**: Regularly check all pages for consistency
5. **CSS Organization**: Keep component-specific styles together
