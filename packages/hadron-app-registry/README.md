# hadron-app-registry [![][travis_img]][travis_url] [![][npm_img]][npm_url]

> Hadron App Registry

## Installation

```
npm install --save hadron-app-registry
```

### Usage

```javascript
const AppRegistry = require('hadron-app-registry');

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

## License

Apache 2.0

[travis_img]: https://img.shields.io/travis/mongodb-js/hadron-app-registry.svg?style=flat-square
[travis_url]: https://travis-ci.org/mongodb-js/hadron-app-registry
[npm_img]: https://img.shields.io/npm/v/hadron-app-registry.svg?style=flat-square
[npm_url]: https://www.npmjs.org/package/hadron-app-registry
