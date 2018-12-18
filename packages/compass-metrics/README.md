# metrics [![][travis_img]][travis_url] [![][npm_img]][npm_url]

> Compass Metrics Plugin

## Usage

## License

Apache 2

===

## Features

## Developing

Almost all of your development will happen in the `./src` directory. Add new components
to `./src/components`, actions to `./src/actions/index.js` and if you need additional
stores, add them to `./src/stores`.

To be able to debug the plugin inside `compass` make sure [webpack prod
config](./config/webpack.prod.config.js) has `devtool` is set to `source-map`.
If you want faster compiler time when you commit/push, switch it to `false.`

```js
const config = {
  target: 'electron-renderer',
  devtool: 'source-map'
}
```

#### Directory Structure

For completeness, below is a list of directories present in this module:

- `electron` code to start electron, open a browser window and load the source.
  You don't usually need to touch this, unless you want to render something other
  than the main component in Electron.
- `lib` compiled version of your components (plain javascript instead of `jsx`) and
  styles (`css` instead of `less`). Never change anything here as this entire folder
  gets automatically created and overwritten.
- `src` components, actions and stores source code, as well as style files. This is the
  place to implement your own components. `npm run compile` will use `./src` as input
  and create `./lib`.
- `stories` stories for react-storybook. You can add as many story files as you like,
  they are automatically added to storybook.
- `test` implement your tests here, and name the files `*.test.js`.

## License

Apache 2.0

[travis_img]: https://travis-ci.com/10gen/compass-metrics.svg?token=ezEB2TnpPiu7XLo6ByZp&branch=master
[travis_url]: https://travis-ci.com/10gen/compass-metrics
[npm_img]: https://img.shields.io/npm/v/@mongodb-js/compass-metrics.svg?style=flat-square
[npm_url]: https://www.npmjs.org/package/@mongodb-js/compass-metrics
