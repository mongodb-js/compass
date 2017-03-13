# Compass Functional Test Suite

The Compass functional test suite uses Spectron to test the electron
application. This document describes the common patterns in the suite and
the current API that developers can leverage.

## Patterns for Client Actions

The actions in the test suite are divided into 4 main categories of
actions that the test may execute:

- "Wait" actions - These methods are prefixed with `wait` and indicate that
    the test should wait until some condition evaluates to `true`.
- "Click" actions - These methods click on an element in the application.
    This can include buttons, links, divs -- anything that the application
    has defined as clickable.
- "Get" actions - These methods retrieve values from the application that
    exist in the DOM.
- "Input" actions - These methods simulate user input anywhere in the app
    where a user would be required to enter a value.

The actions are added to the client in categorised groups by package, 
in order to keep similar functionality together. These methods in each 
package in [/test/functional/support/packages/](support/packages/) 
are grouped by:

- `#addWaitCommands(client)`
- `#addClickCommands(client)`
- `#addGetCommands(client)`
- `#addInputCommands(client)`

## React Component Patterns

For HTML elements that are unique to the entire application in the context
of what is currently being worked on, they must all have a unique `data-test-id`
attribute. This is so the test suite can easily identify them without having
impact on normal DOM attributes, like `id` or `name`.

For HTML elements that exist *n* times in the application, for example a list,
the parent element that is unique must contain a uniue `data-test-id` attribute
in order to identify the child by the `nth-child` selector from the unique parent.

The general reasoning for a specific attribute on DOM nodes for testing is for
the application itself to be flexible for CSS and behaviour changes without
having too much impact on the test suite.

## Functional Test Suite API

### Starting/Stopping Compass

```javascript
const { launchCompass, quitCompass } = require('./support/spectron-support');

describe('Compass Functional Test Suite #spectron', function() {
  let app = null;
  let client = null;

  context('when a MongoDB instance is running', function() {
    before(function(done) {
      launchCompass().then(function(application) {
        app = application;
        client = application.client;
        done();
      });
    });

    after(function(done) {
      quitCompass(app, done);
    });

    context('write the functional tests here...', function() {

    });
  });
});
```


## Tips

### Running subsets of the functional suite

You can use the 
[mocha `-g` or `--grep` option](https://mochajs.org/#g---grep-pattern) 
to run only a subset of the functional test suite.

For example, to test just the `#launch` feature:

    npm test -- --functional -g '#launch'

To additionally test the `#launch` feature followed by the `#connect` feature:

    npm test -- --functional -g '#launch|#connect'

### `waitForVisible` vs. `waitForExist`

A common problem is confusing these 2 methods.

`waitForVisible` MUST be used when testing that an object that is already present
in the DOM becomes visible to the user or loses visibility. This is either from
changing the `display` or `visibility` attribute of the element or by moving it
out of the viewport via absolute positioning or scrolling. Common elements to
be testing via this method include modals and tabs.

`waitForExist` MUST be used when testing that an element is added to the DOM or
removed from the DOM. Common cases for this are the addition and deletion of
items in the application, such as databases, collections, documents, etc.

### Tests Hang On Startup

If the tests hang immediately on startup, check that you have no duplicate command
names being added via `client#addCommand`. This will cause Spectron to hang after
loading the application without any erros anywhere.

### Timeouts

Please use the custom methods `waitForVisibleInCompass` and `waitForExistsInCompass`
to leverage the incremental timeout functionality to provide faster and more stable tests.

How does this help? Previously the core wait commands would try to resolve the
condition once, then wait until the provided timout until trying again. This
meant when using large timeouts to account for slow machines (for example 30
seconds) would cause fast machines to have to wait the full timeout when a much
smaller one (like 5 seconds) would suffice. These new methods now poll the core
wait commands with a fibonacci sequence of timeouts up until a max last timeout
of 13 seconds. (1, 2, 3, 5, 8, 13)


### Element Is Not Clickable At...

The usual reasoning for this error is that the status bar has not gotten to 100%
and the transparent overlay is still present. Adding a `waitForStatusBar` command
before the click command should resolve most of these.

For more ideas, please see the [ChromeDriver 'Element is not clickable' error documentation](https://sites.google.com/a/chromium.org/chromedriver/help/clicking-issues).

## Roadmap

### Scoped data-test-id

Using `data-test-id` was the first step in creating a way to find elements without
being affected by CSS changes and major layout changes. The next step is to make
the selectors faster. We will be scoping the selectors based on section next, with
each corresponding section being identified with an `id` attribute in the HTML tag.

These will be placed in areas that will not have excessive change:

- Sidebar
- Databases Tab
- Performance Tab
- Collections Tab
- Schema Tab
- Documents Tab
- Explain Plan Tab
- Validation Tab
- Indexes Tab

This is so we can select based on the `id` of the section first, which does not require
a full scan of the DOM and then subsequently select on `data-test-id` from the subset.

### More Debug

We will be adding more debugging output across all commmands, not just the wait commands,
so that test failures with debug on will be easy to resolve.

### Modularisation

We will be looking to split the tests up into modules based on functional area, so a subset
of the tests can be run without having to run the entire suite. CI will always run everything.

### Read/Write Split

A second split of the tests will happen into tests for writable servers vs. readonly servers
and the CI test suite expanded to test shards and replica sets.
