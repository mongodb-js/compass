# hadron-react [![][travis_img]][travis_url]
> Hadron React Components

## Packages

- [hadron-react-bson][hadron-react-bson-link] Hadron React BSON Components
- [hadron-react-utils][hadron-react-utils-link] Hadron React Utils
- [hadron-react-buttons][hadron-react-buttons-link] Hadron React Buttons
- [hadron-react-components][hadron-react-components-link] Hadron React Components

## Development

See [Lerna](https://github.com/lerna/lerna#readme) for information on the module
organisation and publishing.

### Installation

Lerna must be installed as a global module to run everything locally:

```shell
npm install --global lerna
```

### Bootstrapping

Bootstrap all the packages and install their dependencies. The first step is to
install the root development dependencies, so that the Lerna root package can
share the common dependencies with the child packages. Then bootstrap from the
root project to install all the child external dependencies.

```shell
npm install
lerna bootstrap
```

### Testing

Run all the tests in all the packages.

```shell
lerna run test
```

### Eslint

Run checks on all packages in the repo - this also runs as a precommit hook.

```shell
lerna run check
```

### Releasing

```shell
lerna publish
```

## License

Apache 2.0

[travis_img]: https://img.shields.io/travis/mongodb-js/hadron-react.svg?style=flat-square
[travis_url]: https://travis-ci.org/mongodb-js/hadron-react
[hadron-react-bson-link]: https://github.com/mongodb-js/hadron-react/tree/master/packages/hadron-react-bson
[hadron-react-utils-link]: https://github.com/mongodb-js/hadron-react/tree/master/packages/hadron-react-utils
[hadron-react-buttons-link]: https://github.com/mongodb-js/hadron-react/tree/master/packages/hadron-react-buttons
[hadron-react-components-link]: https://github.com/mongodb-js/hadron-react/tree/master/packages/hadron-react-components
