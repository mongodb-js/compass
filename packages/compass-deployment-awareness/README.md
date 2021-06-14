# Compass Deployment Awareness Plugin

Provide functionality surrounding deployment awareness and if the topology
is in a state to read or write.

## Available Resources in the App Registry

### Components

| Key                                   | Description                                                |
|---------------------------------------|------------------------------------------------------------|
| `DeploymentAwareness.TextWriteButton` | A text button that changes state when write state changes. |

### Roles

| Role          | Description                                                     |
|---------------|-----------------------------------------------------------------|
| `Header.Item` | Renders the topology information in the left of the header bar. |

### Stores

| Key                                   | Description
|---------------------------------------|---------------------------------------------------------|
| `DeploymentAwareness.ReadStateStore`  | Triggers when the readable state changes.               |
| `DeploymentAwareness.WriteStateStore` | Triggers when the writable state changes.               |
