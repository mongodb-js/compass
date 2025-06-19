// We need to import from testing-library/react directly because the wrapping done
// by testing-library-compass already sets up the context menu provider which is not
// useful for our tests.
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
export { render } from '@testing-library/react';
