# Compass Status Package

Provides functionality for the status bar.

## Available Resources in the App Registry

### Manual Testing in Compass

At a Chrome development console, it is possible to trigger specific actions:

```js
    const StatusAction = app.appRegistry.getAction('Status.Actions');
    
    // Can call individual actions
    StatusAction.showAnimation();
    StatusAction.setMessage('Loading navigation');
    
    // Can configure many things at once
    StatusAction.configure({
      animation: true, 
      message: 'Loading Databases', 
      visible: true
    });
    
    // Can also inject a subview
    const SchemaStatusSubview = app.appRegistry.getComponent('Schema.StatusSubview');
    const SchemaAction = app.appRegistry.getAction('Schema.Actions');
    StatusAction.setSubview(SchemaStatusSubview);
    SchemaAction.startSampling();
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
