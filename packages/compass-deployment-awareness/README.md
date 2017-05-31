# Compass Deployment Awareness Plugin [![Build Status](https://travis-ci.com/10gen/compass-deployment-awareness.svg?token=ezEB2TnpPiu7XLo6ByZp&branch=master)](https://travis-ci.com/10gen/compass-deployment-awareness)

Provide functionality surrounding deployment awareness and if the topology
is in a state to read or write.

## Available Resources in the App Registry

### Components

| Key                 | Description                  |
|---------------------|------------------------------|

### Stores

| Key                                   | Description
|---------------------------------------|---------------------------------------------------------|
| `DeploymentAwareness.ReadStateStore`  | Triggers when the readable state changes.               |
| `DeploymentAwareness.WriteStateStore` | Triggers when the writable state changes.               |

## License

Apache 2
