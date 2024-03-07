# @cloud-mongodb-js/hadron-app-registry [![][npm_img]][npm_url]

> Hadron App Registry

## Installation

```
npm install --save @cloud-mongodb-js/hadron-app-registry
```

### Usage

```javascript
const { AppRegistry } = require('@cloud-mongodb-js/hadron-app-registry');

var registry = new AppRegistry();

registry.registerAction('Action::MyAction', action);
registry.registerComponent('Component::MyComponent', component);
registry.registerStore('Store::MyStore', store);

registry.actions; //=> { 'Action::MyAction': action }
registry.components; //=> { 'Component::MyComponent': component }
registry.stores; //=> { 'Store::MyStore':: store }

registry.getAction('Action::MyAction'); //=> action
registry.getComponent('Component::MyComponent'); //=> component
registry.getStore('Store::MyStore'); //=> store

registry.deregisterAction('Action::MyAction');
registry.deregisterComponent('Component::MyComponent');
registry.deregisterStore('Store::MyStore');
```

[npm_img]: https://img.shields.io/npm/v/@cloud-mongodb-js/hadron-app-registry.svg?style=flat-square
[npm_url]: https://www.npmjs.org/package/@cloud-mongodb-js/hadron-app-registry
