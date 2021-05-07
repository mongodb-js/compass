# @mongodb-js/compass-collection [![][travis_img]][travis_url] [![][azure_img]][azure_url]

> Compass Collection Plugin

## Development

Almost all of your development will happen in the `./src` directory. Add new components
to `./src/components`, actions to `./src/actions/index.js` and if you need additional
stores, add them to `./src/stores`.

To be able to debug the plugin inside `compass` make sure [webpack prod config](./config/webpack.prod.config.js) has `devtool` is set to `source-map`.
If you want faster compiler time when you commit/push, switch it to `false.`

```js
const config = {
  target: 'electron-renderer',
  devtool: 'source-map'
}
```

### Directory Structure

For completeness, below is a list of directories present in this module:

- `coverage` code coverage data produced when [`npm test`][#test] or [`npm test:karma`][#test-karma] is run.
- `electron` code to start electron, open a browser window and load the source.
  You don't usually need to touch this, unless you want to render something other
  than the main component in Electron.
- `lib` compiled version of your components (plain javascript instead of `jsx`) and
  styles (`css` instead of `less`). Never change anything here as this entire folder
  gets automatically created and overwritten.
- `src` components, actions and stores source code, as well as style files. This is the
  place to implement your own components. `npm run compile` will use `./src` as input
  and create `./lib`.
- `test` implement your functional and store tests here, and name the files `{store,renderer}/*.test.js`. 
  These tests will be run in an electron renderer process by [`npm run test:karma`][#test-karma] detailed below. 
  Unit tests should live next to their implementation under `src/**/*.spec.js`

### Scripts

#### Day-to-day

##### start

Validate and test your component in an Electron window, styles included. The source automatically
compiles and the window content reloads when any file under `./src` changes.

To start Electron and render your component, type `npm start`.

If you edit the source code and hit _save_, the source will rebuild and the window reload
automatically. State is not maintained throughout reloads.

##### test

The test environment is configured to test components with [Enzyme][enzyme]
(including full `mount` mode through [jsdom][jsdom]) and [enzyme-chai][enzyme-chai].
See the test folder for examples. Run `npm test` to execute the test suite.

##### test:karma

Runs a test environment hosted in an electron renderer process using [karma-electron][karma-electron].

##### check

Runs [mongodb-js-precommit][mongodb-js-precommit] on your code to check for common JS typos using
[eslint][eslint] with [our shared eslint configuration][eslint-config-mongodb-js] and other useful 
things like did you forget to install a dependency.

#### Compass Integration Testing

##### link-plugin 

Links the Compass plugin and Compass for development along with React to ensure the plugin and Compass are using the same React instance.

```shell
COMPASS_HOME=/path/to/my/compass npm run link-plugin
```

##### unlink-plugin

Restores Compass and the plugin to their original unlinked state. 

```shell
COMPASS_HOME=/path/to/my/compass npm run unlink-plugin
```

## Todo

- [ ] docs: ci script
- [ ] docs: travis and azure pipelines
- [ ] docs: `xvfb-maybe` for electron on travis/azure
- [ ] docs: dependabot
- [x] ci: publish coverage and karma xunit on azure

## License

Apache 2.0

[travis_img]: https://travis-ci.org/mongodb-js/compass-collection.svg?branch=master
[travis_url]: https://travis-ci.org/mongodb-js/compass-collection
[azure_img]: https://dev.azure.com/team-compass/team-compass/_apis/build/status/mongodb-js.compass-collection?branchName=master
[azure_url]: https://dev.azure.com/team-compass/team-compass/_build/latest?definitionId=1&branchName=master
[react-storybook]: https://github.com/kadirahq/react-storybook
[enzyme]: http://airbnb.io/enzyme/
[enzyme-chai]: https://github.com/producthunt/chai-enzyme
[eslint]:https://eslint.org/
[eslint-config-mongodb-js]: https://github.com/mongodb-js/eslint-config
[jsdom]: https://github.com/tmpvar/jsdom
[karma]: https://karma-runner.github.io/latest/index.html
[karma-electron]: https://github.com/twolfson/karma-electron
[mongodb-js-precommit]: https://github.com/mongodb-js/precommit
