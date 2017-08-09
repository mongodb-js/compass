# Compass Connect [![][travis_img]][travis_url]

Compass Connection Plugin

## Usage

### Scripts

`link-plugin`: Links the Compass plugin and Compass for development along with React to ensure the
  plugin and Compass are using the same React instance.

```shell
COMPASS_HOME=/path/to/my/compass npm run link-plugin
```

`unlink-plugin`: Restores Compass and the plugin to their original unlinked state.

```shell
COMPASS_HOME=/path/to/my/compass npm run unlink-plugin
```

## License

Apache 2.0

[travis_img]: https://travis-ci.com/10gen/compass-connect.svg?token=ezEB2TnpPiu7XLo6ByZp&branch=master
[travis_url]: https://travis-ci.com/10gen/compass-connect
[npm_img]: https://img.shields.io/npm/v/@mongodb-js/compass-connect.svg?style=flat-square
[npm_url]: https://www.npmjs.org/package/@mongodb-js/compass-connect
