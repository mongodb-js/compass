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

The actions are added to the client in categorised groups, in order to
keep similar functionality together. These methods in `test/support/spectron-support` are:

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

The listed methods below are all available on a Spectron `client` instance.

### Wait Actions

### Click Actions

### Get Actions

### Input Actions

## Tips

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
