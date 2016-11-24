# hadron-react [![][travis_img]][travis_url] [![][npm_img]][npm_url]

> Hadron React Components

## Development

### Installation

Lerna must be installed as a global module to run everything locally:

```shell
npm install --global lerna@prerelease
```

### Bootstrapping

Bootstrap all the packages and install their dependencies, this replaces `npm install`.

```shell
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

### Usage

## License

Apache 2.0

[travis_img]: https://img.shields.io/travis/mongodb-js/hadron-react.svg?style=flat-square
[travis_url]: https://travis-ci.org/mongodb-js/hadron-react
[npm_img]: https://img.shields.io/npm/v/hadron-react.svg?style=flat-square
[npm_url]: https://www.npmjs.org/package/hadron-react
