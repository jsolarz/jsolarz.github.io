# Contributing

Guidelines for contributing to this BBS-style blog website.

## Code of Conduct

-   Don't be an asshole
-   Provide constructive feedback
-   Focus on what is best for the community
-   If you become more annoying to work with than your contributions justify, you will get booted.

## How to Contribute

Did you find a bug?
Ensure the bug was not already reported by searching on GitHub under Issues.

If you're unable to find an open issue addressing the problem, open a new one. Be sure to include a title and clear description, as much relevant information as possible, and a code sample or an executable test case demonstrating the expected behavior that is not occurring.

Did you write a patch that fixes a bug?
Open a new GitHub pull request with the patch.

Ensure the PR description clearly describes the problem and solution. Include the relevant issue number if applicable.

Did you fix whitespace, format code, or make a purely cosmetic patch?
Changes that are cosmetic in nature and do not add anything substantial to the stability, functionality, or testability will generally not be accepted.

Do not open an issue on GitHub until you have collected positive feedback about the change. GitHub issues are primarily intended for bug reports and fixes.

### Reporting Bugs

1. Check if the bug has already been reported in existing issues
2. Create a new issue with:
    - Clear title and description
    - Steps to reproduce
    - Expected vs actual behavior
    - Environment details (OS, Node.js version, browser)

### Suggesting Enhancements

1. Check existing issues and discussions
2. Create a new issue with:
    - Clear description of the enhancement
    - Use case and benefits
    - Proposed implementation approach (if applicable)

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following the coding standards below
4. Test your changes thoroughly
5. Update documentation as needed
6. Commit with clear, descriptive messages
7. Push to your fork and create a Pull Request

## Coding Standards

### PowerShell Scripts

-   Use proper parameter naming (PascalCase with `-` prefix)
-   Include parameter validation
-   Add error handling with try-catch blocks
-   Use Write-Host for user-facing messages
-   Include usage examples in comments
-   Validate dependencies before execution

### Python Scripts

-   Follow PEP 8 style guidelines
-   Use type hints where appropriate
-   Include docstrings for functions
-   Handle exceptions gracefully
-   Use `os.path.join()` for path operations

### Documentation

-   Use Markdown format
-   Follow existing document structure
-   Keep language clear and concise
-   Update README.md for user-facing changes
-   Update CHANGELOG.md for all changes

## Project Structure

```
.
├── _posts/          # Markdown blog posts
├── blog/            # Blog post pages
├── css/             # Stylesheets
├── js/              # JavaScript modules
├── templates/       # HTML templates
├── docs/            # Documentation
└── scripts/         # Build scripts
```

## Testing

Before submitting a PR:

1. Test in multiple browsers (Chrome, Firefox, Safari, Edge)
2. Verify blog posts render correctly
3. Test template system functionality
4. Ensure responsive design works
5. Validate markdown rendering

## Commit Messages

Use clear, descriptive commit messages:

-   Use present tense ("Add feature" not "Added feature")
-   First line should be concise (50 chars or less)
-   Include detailed description if needed
-   Reference issue numbers if applicable

Examples:

```
Add error handling to semantic-index.ps1

- Validate Python installation
- Check for required packages
- Provide helpful error messages
- Fixes #123
```

## Questions?

If you have questions, please open an issue with the "question" label.

Thanks!

Thank you for contributing!
