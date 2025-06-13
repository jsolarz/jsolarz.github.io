# Migrating to Web Components

This guide explains how to migrate existing pages from using the component loader approach to the new Web Components with templates and slots.

## Updating Existing Pages

### Step 1: Update the `<head>` section
Replace or add the Web Components script:

```html
<!-- Remove or comment out the old component loader -->
<!-- <script src="js/component-loader.js"></script> -->

<!-- Add the Web Components script in the head (with defer attribute) -->
<script src="js/web-components.js" defer></script>
```

### Step 2: Replace header component

From:
```html
<div data-component="header"></div>
```

To:
```html
<site-header></site-header>
```

### Step 3: Replace footer component

From:
```html
<div data-component="footer"></div>
```

To:
```html
<site-footer></site-footer>
```

### Step 4: Add custom content using slots (optional)

You can customize the components using slots:

```html
<!-- Add custom content to the header -->
<site-header>
  <div slot="header-content">Your custom content here</div>
</site-header>

<!-- Add custom links and content to the footer -->
<site-footer>
  <a slot="additional-links" href="/privacy.html">Privacy</a>
  <div slot="footer-content">Additional footer information</div>
</site-footer>
```

## Testing

After updating a page, check to make sure that:

1. The header and footer render correctly
2. Navigation highlighting works for the current page
3. Mobile menu toggle functions properly
4. Any custom slot content appears as expected

You can use the test page at `/tests/test-web-components.html` to verify the components are working correctly.

## Benefits of Web Components

- **No JavaScript DOM Manipulation**: Components render automatically
- **Encapsulation**: Shadow DOM prevents style conflicts
- **Extensibility**: Easy to add new features with slots
- **Performance**: Less JavaScript overhead
- **Standards-Based**: Uses native browser features instead of custom code

## Troubleshooting

If components don't render:

1. Check browser console for errors
2. Verify the path to web-components.js is correct
3. Make sure the web-components.js script is loaded before using the components
4. Check that custom element names are spelled correctly (`site-header`, `site-footer`)

For any other issues, refer to the [Web Components README](../components/WEB-COMPONENTS-README.md)
