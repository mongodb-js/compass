# hadron-spectron [![Linux CI][travis_img]][travis_url] [![Windows CI][appveyor_img]][appveyor_url] [![][npm_img]][npm_url] 


## Installation

```
npm install --save-dev hadron-spectron
```

## Usage

With Mocha, create an App instance in the before hook and launch it, and quit it
in the after hook. For examples and more details, see [Compass' functional test README](https://github.com/10gen/compass/tree/master/test/functional).

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

[`chai-as-promised`](http://webdriver.io/v3.4/guide/usage/transferpromises.html) support is provided automatically as a convenience.

## License

Apache 2.0

[travis_img]: https://img.shields.io/travis/mongodb-js/hadron-spectron.svg?style=flat-square
[travis_url]: https://travis-ci.org/mongodb-js/hadron-spectron
[npm_img]: https://img.shields.io/npm/v/hadron-spectron.svg?style=flat-square
[npm_url]: https://www.npmjs.org/package/hadron-spectron
[appveyor_img]:https://ci.appveyor.com/api/projects/status/osk9hfjgq6rh5l4y?svg=true
[appveyor_url]: https://ci.appveyor.com/project/imlucas/hadron-spectron
