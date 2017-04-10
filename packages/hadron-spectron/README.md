# hadron-spectron [![][travis_img]][travis_url] [![][npm_img]][npm_url]


## Installation

```
npm install --save hadron-spectron
```

## Usage

With Mocha, create an App instance in the before hook and launch it, and quit it
in the after hook.

```javascript
const { App, selector } = require('hadron-spectron');

/**
 * The path to the root of the application, as well as the electron app.
 */
const ROOT = path.join(__dirname, '..', '..', '..');

function addCustomCommands(client) {
  // Add custom commands to the client here.
}

function launchApp() {
  return new App(ROOT).launch(addCustomCommands);
}

function quitApp() {
  return app.quit();
}

describe('Functional Test', function() {
  let app = null;
  let client = null;

  before(function() {
    return launchApp().then(function(application) {
      app = application;
      client = application.client;
    });
  });

  after(function() {
    return quitApp(app);
  });
});
```

## License

Apache 2.0

[travis_img]: https://img.shields.io/travis/mongodb-js/hadron-spectron.svg?style=flat-square
[travis_url]: https://travis-ci.org/mongodb-js/hadron-spectron
[npm_img]: https://img.shields.io/npm/v/hadron-spectron.svg?style=flat-square
[npm_url]: https://www.npmjs.org/package/hadron-spectron
