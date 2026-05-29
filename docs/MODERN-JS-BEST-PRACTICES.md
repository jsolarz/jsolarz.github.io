# Modern JavaScript Best Practices (2025)

## Recommendation: Use ES Modules

**For this project, ES Modules is the best approach** because:
- ✅ Zero global pollution
- ✅ Explicit dependencies
- ✅ Better encapsulation
- ✅ Industry standard (2025)
- ✅ No performance penalty
- ✅ Easier to maintain and test

## Modern JavaScript Features (ES2020-2025)

### ✅ Already Using (Good)

1. **Private Fields (`#`)** - ES2022
   ```javascript
   class BlogEngine {
     #postsIndex = null  // ✅ Encapsulation
   }
   ```

2. **Async/Await** - ES2017
   ```javascript
   async loadPost(slug) {
     const post = await fetch(...)  // ✅ Clean async code
   }
   ```

3. **Arrow Functions** - ES2015
   ```javascript
   posts.map(post => ({ ...post }))  // ✅ Concise
   ```

4. **Template Literals** - ES2015
   ```javascript
   `${this.#basePath}/journal/post.html?slug=${slug}`  // ✅ Readable
   ```

5. **Destructuring** - ES2015
   ```javascript
   const { metadata, content } = this.#parseFrontMatter(markdown)  // ✅ Clean
   ```

6. **Array Methods** - ES2015+
   ```javascript
   .map(), .filter(), .find(), .toSorted()  // ✅ Functional style
   ```

7. **Const/Let** - ES2015
   ```javascript
   const blogEngine = new BlogEngine()  // ✅ Block scoping
   ```

8. **Optional Chaining** - ES2020
   ```javascript
   e.target?.closest(".menu-toggle")  // ✅ Safe access
   ```

9. **Nullish Coalescing** - ES2020
   ```javascript
   const title = metadata.title || "Untitled"  // ✅ Fallback
   ```

10. **Map/Set** - ES2015
    ```javascript
    #templates = new Map()  // ✅ Better than objects for caches
    ```

### 🔄 Should Use (Modern Best Practices)

1. **ES Modules** - ES2015 (Standard in 2025)
   ```javascript
   // ✅ DO: Explicit imports/exports
   export const blogEngine = new BlogEngine()
   import { blogEngine } from "./blog-engine.esm.js"

   // ❌ AVOID: Global pollution
   window.blogEngine = blogEngine
   ```

2. **Top-Level Await** - ES2022 (if needed)
   ```javascript
   // ✅ Can use in modules
   const data = await fetch(...)
   ```

3. **Object.hasOwn()** - ES2022 (instead of `hasOwnProperty`)
   ```javascript
   // ✅ DO: Modern check
   if (Object.hasOwn(data, key))

   // ❌ AVOID: Old way
   if (data.hasOwnProperty(key))
   ```

4. **Array.at()** - ES2022 (for negative indices)
   ```javascript
   const last = array.at(-1)  // ✅ Cleaner than array[array.length - 1]
   ```

5. **Error Cause** - ES2022
   ```javascript
   throw new Error("Failed", { cause: originalError })  // ✅ Chain errors
   ```

6. **Logical Assignment** - ES2021
   ```javascript
   value ||= defaultValue  // ✅ Shorthand
   ```

## Code Quality Standards

### 1. Encapsulation

**✅ DO:**
```javascript
class BlogEngine {
  #postsIndex = null  // Private field
  #formatDate() { }   // Private method

  async loadPost() { }  // Public method
}
```

**❌ AVOID:**
```javascript
class BlogEngine {
  postsIndex = null  // Public - can be modified externally
}
```

### 2. Error Handling

**✅ DO:**
```javascript
try {
  const post = await this.loadPost(slug)
  if (!post) throw new Error("Post not found")
} catch (error) {
  console.error("Error:", error)
  this.#renderError(container, error, slug)
}
```

**❌ AVOID:**
```javascript
const post = await this.loadPost(slug)  // No error handling
```

### 3. Type Safety (JSDoc)

**✅ DO:**
```javascript
/**
 * @param {string} slug - Post slug identifier
 * @param {HTMLElement | string} container - Container element or selector
 * @returns {Promise<void>}
 */
async renderPost(slug, container) { }
```

### 4. Immutability

**✅ DO:**
```javascript
const sorted = [...posts].toSorted((a, b) => b.date - a.date)  // New array
```

**❌ AVOID:**
```javascript
posts.sort((a, b) => b.date - a.date)  // Mutates original
```

### 5. Performance

**✅ DO:**
```javascript
// Use DocumentFragment for batch DOM operations
const fragment = document.createDocumentFragment()
posts.forEach(post => {
  fragment.appendChild(createPostElement(post))
})
container.appendChild(fragment)  // Single DOM update
```

**❌ AVOID:**
```javascript
posts.forEach(post => {
  container.appendChild(createPostElement(post))  // Multiple DOM updates
})
```

### 6. Async Patterns

**✅ DO:**
```javascript
// Parallel loading
const [posts, templates] = await Promise.all([
  loadPosts(),
  loadTemplates()
])
```

**❌ AVOID:**
```javascript
// Sequential (slower)
const posts = await loadPosts()
const templates = await loadTemplates()
```

## Architecture Patterns

### 1. Single Responsibility

**✅ DO:**
```javascript
// Separate concerns
class MarkdownLoader { }  // Only markdown rendering
class BlogEngine { }       // Only blog logic
class TemplateEngine { }   // Only templates
```

**❌ AVOID:**
```javascript
// God object
class Everything { }  // Does markdown, blog, templates, etc.
```

### 2. Dependency Injection

**✅ DO (ES Modules):**
```javascript
// Explicit dependencies
import { markdownLoader } from "./markdown-loader.esm.js"

class BlogEngine {
  async renderPost(slug) {
    const html = await markdownLoader.render(content)  // Clear dependency
  }
}
```

**❌ AVOID:**
```javascript
// Hidden dependencies
class BlogEngine {
  async renderPost(slug) {
    const html = await window.markdownLoader.render(content)  // Global dependency
  }
}
```

### 3. Composition over Inheritance

**✅ DO:**
```javascript
// Compose functionality
class BlogEngine {
  constructor(markdownLoader, templateEngine) {
    this.markdownLoader = markdownLoader
    this.templateEngine = templateEngine
  }
}
```

**❌ AVOID:**
```javascript
// Deep inheritance
class BlogEngine extends MarkdownRenderer extends TemplateRenderer { }
```

## Security Best Practices

### 1. XSS Prevention

**✅ DO:**
```javascript
// Escape HTML
#escapeHtml(text) {
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}

// Use textContent for user input
element.textContent = userInput  // Safe
```

**❌ AVOID:**
```javascript
// Dangerous
element.innerHTML = userInput  // XSS risk
```

### 2. Input Validation

**✅ DO:**
```javascript
async render(markdown) {
  if (!markdown || typeof markdown !== "string") {
    throw new Error("Invalid markdown input")
  }
  // Process...
}
```

### 3. CSP Compliance

**✅ DO:**
- Use `type="module"` for ES modules
- Avoid inline scripts (use external files)
- Use `nonce` or `hash` for CSP if needed

## Performance Best Practices

### 1. Lazy Loading

**✅ DO:**
```javascript
// Load only when needed
if (window.location.pathname.includes("/blog")) {
  markdownLoader.load().catch(() => {})
}
```

### 2. Caching

**✅ DO:**
```javascript
#templates = new Map()  // Cache templates

async loadTemplate(id) {
  if (this.#templates.has(id)) {
    return this.#templates.get(id)  // Return cached
  }
  // Load and cache...
}
```

### 3. Debouncing/Throttling

**✅ DO:**
```javascript
// For frequent events (scroll, resize)
let timeout
window.addEventListener("scroll", () => {
  clearTimeout(timeout)
  timeout = setTimeout(() => {
    // Handle scroll
  }, 100)
})
```

## Code Organization

### File Structure

```
js/
  ├── markdown-loader.esm.js    # Single responsibility
  ├── blog-engine.esm.js        # Blog logic
  ├── template-engine.esm.js    # Templates
  └── scripts.esm.js            # UI effects
```

### Naming Conventions

**✅ DO:**
```javascript
// Classes: PascalCase
class BlogEngine { }

// Instances: camelCase
const blogEngine = new BlogEngine()

// Private: # prefix
#postsIndex = null

// Constants: SCREAMING_SNAKE_CASE (if truly constant)
const MAX_RETRIES = 3

// Functions: camelCase, verb-based
async loadPost() { }
async renderPost() { }
```

## Testing Best Practices

### 1. Test Structure

**✅ DO:**
```javascript
// Separate test files
blog-engine.test.js
blog-engine.test-integration.js
blog-engine.test-end-to-end.js
```

### 2. Mocking (ES Modules)

**✅ DO:**
```javascript
// Easy to mock with ES modules
import { markdownLoader } from "./markdown-loader.esm.js"

// In tests
jest.mock("./markdown-loader.esm.js", () => ({
  markdownLoader: { render: jest.fn() }
}))
```

## Browser Compatibility

### Target Browsers (2025)

- ✅ Chrome 90+ (2021)
- ✅ Firefox 88+ (2021)
- ✅ Safari 14+ (2020)
- ✅ Edge 90+ (2021)

**Features to avoid:**
- ❌ IE11 (dead)
- ❌ Legacy Edge (dead)

## Summary: Best Approach for This Project

### ✅ Recommended: ES Modules

**Why:**
1. **Zero globals** - Better encapsulation
2. **Explicit dependencies** - Easier to understand
3. **Modern standard** - Industry best practice in 2025
4. **No performance cost** - Same speed as globals
5. **Better testing** - Easy to mock imports
6. **Future-proof** - Aligns with modern JS ecosystem

**Implementation:**
- Use `.esm.js` files
- Use `type="module"` in HTML
- Explicit `import`/`export` statements
- No `window.xxx` globals

### ❌ Avoid: Global Scripts

**Why not:**
1. Global namespace pollution
2. Hidden dependencies
3. Harder to test
4. Can be overwritten
5. Not modern standard

## Migration Path

1. **Keep both versions** during transition (`.js` and `.esm.js`)
2. **Test ES modules** in `post.esm.html`
3. **Migrate gradually** or all at once
4. **Remove globals** once ES modules work
5. **Update HTML** to use `type="module"`

## Resources

- [MDN: ES Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- [Can I Use: ES Modules](https://caniuse.com/es6-module)
- [JavaScript.info: Modern JavaScript](https://javascript.info/)
- [TC39: ECMAScript Proposals](https://github.com/tc39/proposals)
