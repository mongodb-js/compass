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
- Encourage modern JavaScript/TypeScript features and syntax where applicable (e.g. for-of loops, nullish coalescing for Javascript; utility types or satisfied for Typescript..).

### Testing

- Follow the official testing guidelines for Redux and React Testing Library.
- Ensure tests are meaningful, maintainable, and cover edge cases.
- Avoid false positive tests.

### React

- Follow React patterns and naming conventions when designing components, “think in React”.
  Be careful when using hooks, make sure that all dependencies are listed for callbacks / memos / effect.
- Be especially careful when adding effects—remember that [you might not need an effect](https://react.dev/learn/you-might-not-need-an-effect).
- If you're reaching for a useReducer hook, consider if it's time to move this state and business logic to a Redux store instead.

#### Avoid non-primitive values in render

Defining non-primitive values in render (in function body or as component props) nullifies all memoization benefits.

```tsx
// ❌ Inline object/array props break memoization of child components
const MyComponent = ({ userId }) => {
  return (
    <MemoizedChild
      style={{ marginTop: 10 }}
      options={['edit', 'delete']}
      onClick={() => handleClick(userId)}
    />
  );
};

// ✅ Memoize or define outside render
const style = { marginTop: 10 };
const options = ['edit', 'delete'];

const MyComponent = ({ userId }) => {
  const handleItemClick = useCallback(() => handleClick(userId), [userId]);

  return (
    <MemoizedChild style={style} options={options} onClick={handleItemClick} />
  );
};
```

The same applies to non-primitive properties constructed inside Redux `connect` functions—they remove any benefits of granular connections.

```ts
// ❌ Creates new array on every render, breaks memoization
export default connect((state) => ({
  activeItems: state.items.filter((item) => item.isActive),
}))(MyComponent);

// ✅ Use a memoized selector
const selectActiveItems = createSelector(
  (state) => state.items,
  (items) => items.filter((item) => item.isActive)
);

export default connect((state) => ({
  activeItems: selectActiveItems(state),
}))(MyComponent);
```

### Redux

- The store state should be normalized, minimal, and based around the data you’re storing, not components.
- Be especially vigilant deciding whether something is state or a derived value produced from multiple existing sources
- As much state as possible should be calculated in reducers, reducers should own the state shape
- Store actions should be modeled around events, should not be dispatched in batches, and should handle all complex feature logic, especially the one requiring state and service access, instead of doing this in UI directly

#### Not all state belongs in Redux

Not all state belongs in the Redux store - see [redux - organizing state FAQ](https://redux.js.org/faq/organizing-state#do-i-have-to-put-all-my-state-into-redux-should-i-ever-use-reacts-usestate-or-usereducer).

State should go in Redux when:

- Other parts of the application care about this data
- You need to be able to create further derived data based on this original data
- The same data is being used to drive multiple components
- There is value in being able to restore this state to a given point in time (i.e., time travel debugging)
- You want to cache the data (i.e., use what's in state if it's already there instead of re-requesting it)
- You want to keep this data consistent while hot-reloading UI components (which may lose their internal state when swapped)

If none of these apply, local component state is likely more appropriate.

## Review Style

- Be specific and actionable in feedback
- Explain the "why" behind recommendations

## MongoDB Specifics

### Performance antipatterns

- Warn about db.stats() performance implications, especially in connection with freeStorage: 1. Provide a reference to the official MongoDB documentation.

## Compass Specifics

- We're trying to stick to Redux style guide as close as possible, with two exceptions

### Compass doesn’t use a single Redux store to manage the whole application state.

### Use `connect` instead of Redux hooks inside feature modules

Components inside feature module boundaries must use the `connect` function to access store data, not Redux hooks like `useSelector` or `useDispatch`.

The `connect` function introduces a deliberate level of indirection, allowing you to write presentational-style components that receive all their values as props without being specifically dependent on Redux. This aligns with the React guidelines for building components (see [Thinking in React](https://react.dev/learn/thinking-in-react)).

```ts
// ❌ Don't do this inside a feature module
import { useSelector } from 'react-redux';

const MyComponent = () => {
  const data = useSelector((state) => state.something);
  // ...
};

// ✅ Do this instead
import { connect } from 'react-redux';

const MyComponent = ({ data }) => {
  // ...
};

export default connect((state) => ({
  data: state.something,
}))(MyComponent);
```
