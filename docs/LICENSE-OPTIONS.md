# License Options for Personal Blog

## Current License

**MIT License** - Very permissive, allows:
- Commercial use
- Modification
- Distribution
- Private use
- Sublicensing

**For a personal blog, this is too permissive for content protection.**

## Recommended Approach: Dual Licensing

Separate licenses for **code** (software) and **content** (blog posts, writing):

### Option 1: Creative Commons (Recommended for Content)

**Best for:** Blog posts, articles, written content

#### CC BY-NC-ND 4.0 (Most Protective)
- ✅ Allows sharing with attribution
- ❌ No commercial use
- ❌ No modifications/derivatives
- **Use when:** You want maximum protection, attribution only

#### CC BY-NC-SA 4.0 (Balanced)
- ✅ Allows sharing with attribution
- ❌ No commercial use
- ✅ Allows modifications (must share under same license)
- **Use when:** You want sharing but no commercial use

#### CC BY-ND 4.0 (Moderate)
- ✅ Allows sharing with attribution
- ✅ Allows commercial use
- ❌ No modifications/derivatives
- **Use when:** You allow commercial use but no changes

#### CC BY-SA 4.0 (Open)
- ✅ Allows sharing with attribution
- ✅ Allows commercial use
- ✅ Allows modifications (must share under same license)
- **Use when:** You want open sharing with attribution

### Option 2: All Rights Reserved (Maximum Protection)

**Best for:** Full copyright protection

```
Copyright (c) 2025 Jonathan Solarz. All rights reserved.

This website and its content, including but not limited to text, images,
and code, are the property of Jonathan Solarz and are protected by
copyright law. Unauthorized reproduction, distribution, or modification
is prohibited without express written permission.
```

**Use when:** You want maximum legal protection

### Option 3: Custom License (Hybrid)

**Best for:** Specific requirements

Example:
```
Copyright (c) 2025 Jonathan Solarz

Code (HTML, CSS, JavaScript):
Licensed under MIT License - see LICENSE file for details.

Content (Blog Posts, Articles, Writing):
All rights reserved. You may:
- Share with attribution and link back
- Quote excerpts (with attribution)
- Not reproduce entire posts
- Not use commercially without permission
- Not create derivative works
```

## Comparison Table

| License | Commercial Use | Modifications | Attribution | Best For |
|---------|---------------|--------------|-------------|----------|
| **MIT** | ✅ Yes | ✅ Yes | ✅ Required | Code only |
| **CC BY-NC-ND** | ❌ No | ❌ No | ✅ Required | Maximum protection |
| **CC BY-NC-SA** | ❌ No | ✅ Yes* | ✅ Required | Balanced sharing |
| **CC BY-ND** | ✅ Yes | ❌ No | ✅ Required | Commercial OK, no changes |
| **CC BY-SA** | ✅ Yes | ✅ Yes* | ✅ Required | Open sharing |
| **All Rights Reserved** | ❌ No | ❌ No | ✅ Required | Maximum legal protection |

*Modifications must be shared under same license

## Recommendation for Personal Blog

### For Content (Blog Posts):
**CC BY-NC-ND 4.0** or **All Rights Reserved**

**Why:**
- Protects your writing
- Prevents commercial use without permission
- Prevents unauthorized modifications
- Still allows sharing with attribution

### For Code (HTML/CSS/JS):
**MIT License** or **Keep MIT**

**Why:**
- Code is less valuable than content
- Allows others to learn from your implementation
- Standard practice for website code

## Implementation

### Option A: Dual License (Recommended)

1. Keep `LICENSE` file for code (MIT)
2. Add `CONTENT-LICENSE.md` for blog posts (CC BY-NC-ND)
3. Add license notice to footer template
4. Add license metadata to blog posts

### Option B: Single License (Simpler)

1. Replace `LICENSE` with All Rights Reserved
2. Add notice to footer
3. Add copyright to each blog post

## Legal Considerations

1. **Copyright is automatic** - You own copyright by default
2. **License clarifies permissions** - Makes your intent clear
3. **Enforcement** - License helps but doesn't guarantee protection
4. **Consult lawyer** - For commercial concerns, consult legal counsel

## Best Practices

1. **Be explicit** - State license clearly in footer/about page
2. **Add to posts** - Include license notice in blog post template
3. **Register copyright** - For maximum protection (US Copyright Office)
4. **Monitor usage** - Use tools to detect unauthorized use
5. **Clear attribution** - Make it easy for people to attribute correctly

## Example Footer Addition

```html
<footer>
    <p>&copy; 2025 Jonathan Solarz. All rights reserved.</p>
    <p>
        <small>
            Code: <a href="LICENSE">MIT License</a> |
            Content: <a href="CONTENT-LICENSE.md">CC BY-NC-ND 4.0</a>
        </small>
    </p>
</footer>
```

