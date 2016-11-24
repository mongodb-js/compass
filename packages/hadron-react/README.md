# hadron-react [![][travis_img]][travis_url]
> Hadron React Components

## Development

See [Lerna](https://github.com/lerna/lerna#readme) for information on the module
organisation and publishing.

### Installation

Lerna must be installed as a global module to run everything locally:

```shell
npm install --global lerna@prerelease
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

## License

Apache 2.0

[travis_img]: https://img.shields.io/travis/mongodb-js/hadron-react.svg?style=flat-square
[travis_url]: https://travis-ci.org/mongodb-js/hadron-react
