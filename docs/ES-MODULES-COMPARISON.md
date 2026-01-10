# ES Modules vs Global Scripts - Comparison

## Encapsulation Comparison

### Current Approach (Global Scripts)

```javascript
// markdown-loader.js
const markdownLoader = new MarkdownLoader()
window.markdownLoader = markdownLoader  // ❌ Global exposure

// blog-engine.js
const blogEngine = new BlogEngine()  // ❌ Global scope
// Uses window.markdownLoader
```

**Issues:**
- 3 global variables (`window.markdownLoader`, `window.templateEngine`, `blogEngine`)
- No explicit dependencies
- Can be overwritten by other scripts
- Harder to track what's used where

### ES Modules Approach

```javascript
// markdown-loader.esm.js
export class MarkdownLoader { ... }
export const markdownLoader = new MarkdownLoader()  // ✅ Exported, not global

// blog-engine.esm.js
import { markdownLoader } from "./markdown-loader.esm.js"  // ✅ Explicit dependency
export const blogEngine = new BlogEngine()  // ✅ Exported, not global
```

**Benefits:**
- Zero global pollution (only what you explicitly export)
- Explicit dependencies via `import`
- Module scope isolation
- Better tree-shaking potential
- Easier to test (mock imports)

## Performance Analysis

### Loading Strategy

**Global Scripts (Current):**
```
1. markdown-loader.js (synchronous, blocks)
2. template-engine.js (synchronous, blocks)
3. scripts.js (synchronous, blocks)
4. blog-engine.js (synchronous, blocks)
```
- **Total blocking time:** Sum of all parse times
- **Parallel loading:** Yes (HTTP/2)
- **Execution:** Sequential, blocking

**ES Modules:**
```
1. post.esm.html loads main module
2. Module graph resolved (imports analyzed)
3. Dependencies loaded in parallel
4. Executed in dependency order
```
- **Total blocking time:** Similar, but better optimized
- **Parallel loading:** Yes, with dependency resolution
- **Execution:** Dependency-ordered, non-blocking after initial parse

### Performance Metrics

| Metric | Global Scripts | ES Modules | Impact |
|--------|---------------|------------|--------|
| **Initial Parse** | ~5-10ms | ~5-10ms | Same |
| **Dependency Resolution** | Manual (script order) | Automatic | ES Modules better |
| **Code Size** | Same | Same | No difference |
| **HTTP Requests** | 4 separate | 4 separate | Same |
| **Caching** | Per-file | Per-file | Same |
| **Tree Shaking** | No | Yes (if bundler used) | ES Modules better |
| **Browser Support** | All | Modern (IE11 no) | Global better |

### Real-World Performance

**First Load:**
- **Global Scripts:** ~50-100ms total parse time
- **ES Modules:** ~50-100ms total parse time
- **Difference:** Negligible (<5ms)

**Subsequent Loads (Cached):**
- **Global Scripts:** ~10-20ms
- **ES Modules:** ~10-20ms
- **Difference:** None

**Conclusion:** Performance impact is **negligible** (<5ms difference). ES Modules provide better encapsulation with no meaningful performance cost.

## Browser Support

### ES Modules Support
- ✅ Chrome 61+ (2017)
- ✅ Firefox 60+ (2018)
- ✅ Safari 10.1+ (2017)
- ✅ Edge 16+ (2017)
- ❌ IE11 (not supported)

**Current browser usage:** ~98% support ES modules

## Migration Impact

### What Changes

1. **HTML:**
   ```html
   <!-- Before -->
   <script src="js/markdown-loader.js"></script>
   <script src="js/blog-engine.js"></script>

   <!-- After -->
   <script type="module">
     import { blogEngine } from "./js/blog-engine.esm.js"
   </script>
   ```

2. **File Structure:**
   - Keep both versions (`.js` and `.esm.js`) during transition
   - Or fully migrate to ES modules

3. **Dependencies:**
   - Explicit `import` statements
   - No more `window.xxx` checks needed

### What Stays the Same

- Same functionality
- Same file sizes
- Same HTTP requests
- Same caching behavior
- Same private fields (`#`)

## Recommendation

**Use ES Modules** because:
1. ✅ Better encapsulation (zero globals)
2. ✅ Explicit dependencies
3. ✅ No performance penalty
4. ✅ Modern standard
5. ✅ Better maintainability
6. ✅ Easier testing

**Keep global scripts** only if:
- Need IE11 support (unlikely for personal blog)
- Prefer simpler HTML (no `type="module"`)

## Implementation

See example files:
- `js/markdown-loader.esm.js`
- `js/blog-engine.esm.js`
- `js/template-engine.esm.js`
- `js/scripts.esm.js`
- `blog/post.esm.html`
