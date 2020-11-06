# hadron-react [![][travis_img]][travis_url] [![][lerna_img]][lerna_url]

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

``` sh
npm install
```

This will bootstrap all the packages, install all their dependencies and link the local packages together so that local changes on one package will immediate reflect in the others.

Is also useful to have Lerna installed as a global module to run scoped tasks locally:

```shell
npm install --global lerna
```

**NOTE**: do not run `npm install` directly inside the packages since that will break the links that lerna maintain.

### Testing

Run all the tests in all the packages.

```shell
npm run test
```

### Eslint

Run checks on all packages in the repo - this also runs as a precommit hook.

```shell
npm run check
```

### Releasing

After merging a PR you can run this from master:

```shell
npm run release
```

Lerna will take care of everything, bumping the version of the packages chaged from the last release.

**NOTE:** lerna keeps track of changes from latest release by creating a tag for each package and each release: `hadron-react-utils@4.0.4`, `hadron-react-components@4.0.5`, ...

## License

Apache 2.0

[travis_img]: https://img.shields.io/travis/mongodb-js/hadron-react.svg?style=flat-square
[travis_url]: https://travis-ci.org/mongodb-js/hadron-react
[lerna_img]: https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg?style=flat-square
[lerna_url]: https://lernajs.io/
[hadron-react-bson-link]: https://github.com/mongodb-js/hadron-react/tree/master/packages/hadron-react-bson
[hadron-react-utils-link]: https://github.com/mongodb-js/hadron-react/tree/master/packages/hadron-react-utils
[hadron-react-buttons-link]: https://github.com/mongodb-js/hadron-react/tree/master/packages/hadron-react-buttons
[hadron-react-components-link]: https://github.com/mongodb-js/hadron-react/tree/master/packages/hadron-react-components
