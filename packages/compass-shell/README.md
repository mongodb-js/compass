# compass-shell

> Compass Shell Plugin

## Features

#### Testing

The test environment is configured to test components with
[@mongodb-js/testing-library-compass][testing-library-compass] (including full DOM
rendering through [jsdom][jsdom]).
See the test folder for examples. Run `npm test` to execute the test suite.

## Developing

Almost all of your development will happen in the `./src` directory. Add new components
to `./src/components`, actions to `./src/actions/index.js` and if you need additional
stores, add them to `./src/stores`.

#### Directory Structure

For completeness, below is a list of directories present in this module:

- `dist` compiled version of your components (plain javascript instead of `jsx`) and
  styles (`css` instead of `less`). Never change anything here as this entire folder
  gets automatically created and overwritten.
- `src` components, actions and stores source code, as well as style files. This is the
  place to implement your own components. `npm run compile` will use `./src` as input
  and create `./dist`.

[testing-library-compass]: ../../configs/testing-library-compass
[jsdom]: https://github.com/tmpvar/jsdom
