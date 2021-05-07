# Compass Status [![][travis_img]][travis_url]

> Compass Status Plugin

## Usage

### Trigger specific actions:

```js
  var StatusAction = app.appRegistry.getAction('Status.Actions');

  // Can call individual actions
  StatusAction.showAnimation();
  StatusAction.setMessage('Loading navigation');

  // Can configure many things at once
  StatusAction.configure({
    animation: true,
    message: 'Loading Databases',
    visible: true
  });
```

### See a subview

For example, the schema subview:

```js
  var StatusAction = app.appRegistry.getAction('Status.Actions');
  var SchemaStatusSubview = app.appRegistry.getComponent('Schema.StatusSubview');
  var SchemaStore = app.appRegistry.getStore('Schema.Store');
  StatusAction.showAnimation();
  StatusAction.setSubview(SchemaStatusSubview);
  SchemaStore.setState({samplingState: 'timeout'});

  // Also possible to show the waiting state
  SchemaStore.setState({samplingState: 'error', samplingTimeMS: 15001});
```

### Roles

| Key                  | Description                 |
|----------------------|-----------------------------|
| `Application.Status` | The status plugin component |

### Actions

| Key              | Description                  |
|------------------|------------------------------|
| `Status.Actions` | Gets all the status actions. |

### Stores

| Key            | Description                       |
|----------------|-----------------------------------|
| `Status.Store` | Triggers with status information. |

## License

Apache 2.0

[travis_img]: https://travis-ci.org/mongodb-js/compass-status.svg
[travis_url]: https://travis-ci.org/mongodb-js/compass-status
