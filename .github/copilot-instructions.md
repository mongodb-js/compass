For overview, do not summarize the changes. Only provide high level feedback on code quality, performance, and best practices.

When reviewing code, focus on:

## Performance Red Flags

- Spot inefficient loops and algorithmic issues
- Check for memory leaks and resource cleanup

## Code Quality Essentials

- Functions should be focused and appropriately sized
- Use clear, descriptive naming conventions
- Ensure proper error handling throughout
- Suggest changes to improve code readability and maintainability

## Best practices

- Refer to official documentation and best practices for React.js, Redux and Node.js. If you see anti-patterns, highlight them and provide links to the relevant official documentation.

### Testing

- Follow the official testing guidelines for Redux and React Testing Library.
- Ensure tests are meaningful, maintainable, and cover edge cases.
- Avoid false positive tests.

### React

- Follow React patterns and naming conventions when designing components, “think in React”.
  Be careful when using hooks, make sure that all dependencies are listed for callbacks / memos / effect.
- Keep in mind that defining non-primitive values in render (in function body or as component props) nullifies all memoization benefits.
- Same applies to non-primitive properties constructed inside Redux connect functions, they remove any benefits of granular connections
- Be especially careful when adding effects, remember that “you might not need an effect”.
- If you’re reaching for a useReducer hook, consider if it’s time to move this state and business logic to a Redux store instead.

### Redux

- The store state should be normalized, minimal, and based around the data you’re storing, not components.
- Keep in mind that not all state belongs in the redux store
- Be especially vigilant deciding whether something is state or a derived value produced from multiple existing sources
- As much state as possible should be calculated in reducers, reducers should own the state shape
- Store actions should be modeled around events, should not be dispatched in batches, and should handle all complex feature logic, especially the one requiring state and service access, instead of doing this in UI directly

## Review Style

- Be specific and actionable in feedback
- Explain the "why" behind recommendations

## MongoDB Specifics

### Performance antipatterns

- Warn about db.stats() performance implications, especially in connection with freeStorage: 1. Provide a reference to the official MongoDB documentation.

## Compass Specifics

- We're trying to stick to Redux style guide as close as possible, with two exceptions:
  - Compass doesn’t use a single Redux store to manage the whole application state.
  - Components inside the feature module boundaries don’t use Redux hooks API as a way to access data from stores (we do allow exposing hooks as public interfaces outside of module boundaries), using connect function instead.
