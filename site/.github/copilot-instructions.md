---
applyTo: "**"
---

# Development Guidelines for GitHub Copilot

## Test-Driven Development (TDD)

1. Write a failing test first
2. Write the minimum code to make the test pass
3. Refactor while keeping tests green
4. Follow Red-Green-Refactor cycle strictly

## Commit Guidelines

1. Maximum 50 lines of changes per commit
2. Each commit should be atomic and focused on a single concern
3. Commit after each test-code cycle
4. Format commit messages as:
    - test: (when adding tests)
    - feat: (when adding features)
    - refactor: (when refactoring)
    - fix: (when fixing bugs)
5. Make sure all tests including edge tests are written.
6. Review the implementation plan and put an X against all completed requirements and review any missing requirement and add them to be completed later.
7. Run the tests and make sure all the tests pass before committing.

## Clean Code Principles

1. Methods should do one thing only
2. Maximum method length: 20 lines
3. Descriptive naming:
    - Methods: verb + noun (e.g., validateCredentials)
    - Classes: noun (e.g., CredentialValidator)
    - Tests: should + behavior (e.g., shouldValidateCredentials)
4. No abbreviations unless universally known
5. Keep nesting level <= 2

## Test Quality

1. Arrange-Act-Assert pattern
2. One assertion per test
3. Test behavior, not implementation
4. Use meaningful test data
5. Mock external dependencies

## Code Organization

1. Follow Domain-Driven Design patterns
2. Keep classes small and focused
3. Respect SOLID principles
4. Place tests close to implementation
5. Maintain clear layer separation

## Response Format

-   Each response should follow TDD cycle
-   Show test first, then implementation
-   Include refactoring suggestions
-   Respect existing architecture
-   Consider edge cases

## Angular 19.x Development Guidelines

-   Use Angular 19.x features and best practices
-   Use Angular Material for UI components
-   Use RxJS for reactive programming
-   Use NgRx for state management
-   Use Angular CLI for project structure and build
-   Use Angular Signals for state management
-   Use Angular CDK for custom components
-   Use Angular Router for navigation
-   Use Angular Forms for form handling
-   Use Angular i18n for internationalization
-   Use Angular A11y for accessibility
-   Use Angular Testing Library for unit testing
-   Use Angular E2E for end-to-end testing
-   Use Angular DevTools for debugging
-   Use Angular Lint for code quality

# 👑 Core Philosophy

-   ✅ Write ultra-clean, testable, reusable code
-   ✅ Follow DRY (Don’t Repeat Yourself) at all times
-   ✅ Predict bugs & optimize for performance
-   ✅ Promote code clarity & maintainability
-   ✅ Ensure 90%+ unit test pass rate
-   ✅ Encourage documentation with emojis 😎
-   ✅ Check for existing components before suggesting new ones
-   ✅ Use Angular-Material components and styles where possible

## 💡 General Coding Prompt

Write clean, reusable, and highly optimized Angular 19.x code with Angular Material, ensuring it is:

DRY-compliant: Eliminate redundancy, suggest reusable components/utilities.

Predictable & Bug-Resistant: Warn about edge cases, suggest best error-handling strategies.

Unit-Test Friendly: Always ensure 90%+ test coverage and provide suggested Jest Testing Library tests.

Documented: Use JSDoc comments & occasional emojis (😎🔥) to make the code engaging.

Pre-Built Component Aware: Check if a similar component exists before writing a new one.

## ⚡ Angular Component Development Prompt

Create a highly reusable, optimized Standalone Angular components using Angular Material. Ensure:

Component inputs and outputs are strongly typed readonly signals, with either sensible default values or marked required.

Performance Optimized: Make heavy use of computed signals on componnts where needed.

Minimal Re-Renders: Suggest best state management practices, leaning towards the use of @ngrx/signal-store for application state, but local signals on components. Ideally, only bind to signals in a template.

Unit Tests: Provide at least three Jest test cases covering all possible states. If possible, adapt to the current testing framework or library for the current code base.

Pipes and Directives: Always recommend using built-in Angular pipes and directives before creating custom components.

Clear Documentation: Add JSDoc + short inline comments (with 🔥 emojis when useful)."

## Angular Forms and Validation

Prefer template-drive forms over reactive forms.

Use built-in validators where possible before suggestion custom validators.

Suggest custom directives when creating custom validators is required.

## 🧪 Unit Testing & Bug Prevention Prompt

For every function/component:

Generate a Jest test plan ensuring at least 90% test coverage.

Predict and highlight potential bugs with suggestions to prevent them.

Include edge case handling: Handle empty states, errors, async failures, etc.

Ensure testability: Avoid side effects, keep functions pure where possible."

# 📄 Code Documentation & Readability Prompt

Generate clear and concise documentation for every function/module, ensuring:

JSDoc comments for all functions and complex logic.

Readable variable and function names that tell a story.

Usage examples in the comments (where applicable).

Avoid bloated explanations—keep it short and precise with occasional fun emojis 😎.

## 🛠️ Refactoring Old Code (Legacy Fixes) Prompt

When working on old codebases (5+ years):

Detect and suggest modern alternatives to deprecated libraries/patterns.

Refactor repetitive logic into reusable hooks/components.

Improve maintainability while ensuring backward compatibility.

Minimize breaking changes & suggest gradual improvements.

Enhance testability by modularizing tightly coupled logic.

## ⚡ Performance Optimization Prompt

Always suggest ways to optimize for performance:

Reduce unnecessary renders (use signals everywhere possible for template bindings).

-   If the new value is self-contained, use set().
-   If the new value is dependent on the current value but no other signal, use update().
-   If the new value is dependent on the value of one or more other signals, use computed().
-   If another signal can set the new value, use linkedSignal().

Lazy load non-critical components.

Cache expensive computations.

Optimize network requests (debouncing, batching).

Tree-shake unused dependencies to reduce bundle size.

Use CSS over code where possible, particularly around animations and responsive design.

## 🔍 Pre-Built Component Check Prompt

Before creating a new component, check if an existing one already serves the purpose.

If a similar one exists, suggest reusing/extending it instead of reinventing the wheel.

If not, generate a future-proof, modular component that can be easily extended later.

## 🛑 Error Handling & Edge Case Considerations Prompt

Ensure robust error handling by:

Using try-catch blocks for async functions.

Providing clear error messages for logging/debugging.

Gracefully handling null, undefined, and empty states.

Implement fallback UI states where necessary.

## 🔁 State Management & Reusability Prompt

When handling state, prioritize:

First, use Angular’s built-in state management (Signals, RxJS Subjects) before considering external libraries.

Only use external state management (e.g., @ngrx/signal-store) when absolutely necessary, such as for global state that must persist across components.

Minimize re-renders using signals, especially computed signals.

Extract repeated logic into reusable custom pure functions.

Ensure state updates are predictable and side-effect free.

## A11y (Accessibility)

Design all HTML for maximum accessibility.

Use semantic HTML always.

Do not disable elements using [disabled] but instead use [aria-disabled] and CSS to simulate it.

## 🚀 Push Me to Be the Best

Encourage me to write better, cleaner, and more optimized code every single day.

Challenge me with questions: ‘Is this the simplest solution?’ ‘Can this be more reusable?’

Motivate me like Elon Musk/Steve Jobs: Push for excellence, clarity, and simplicity.

Suggest improvements actively, don’t let me settle for ‘good enough.’

Call out bad patterns immediately with better alternatives.

Keep it short, clear, and ultra-precise—no fluff, just results.
