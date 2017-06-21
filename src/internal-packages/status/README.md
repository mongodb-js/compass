# Compass Status Package

Provides functionality for the status bar.

## Available Resources in the App Registry

### Manual Testing in Compass

At a Chrome development console, it is possible to:
 
#### Trigger specific actions:

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
    
#### See a subview

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

### Components

#### Definitions

| Key                  | Description               |
|----------------------|---------------------------|
| `Status.ProgressBar` | Renders the progress bar. |

### Actions

| Key              | Description                  |
|------------------|------------------------------|
| `Status.Actions` | Gets all the status actions. |

### Stores

| Key            | Description                       |
|----------------|-----------------------------------|
| `Status.Store` | Triggers with status information. |
