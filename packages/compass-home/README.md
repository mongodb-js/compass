# home [![][travis_img]][travis_url]

The Compass plugin responsible for gluing together other plugins:

- [compass-aggregations][compass-aggregations]
- [compass-auth-kerberos][compass-auth-kerberos]
- [compass-auth-ldap][compass-auth-ldap]
- [compass-auth-x509][compass-auth-x509]
- [compass-auto-updates][compass-auto-updates]
- [compass-collection][compass-collection]
- [compass-collection-stats][compass-collection-stats]
- [compass-collections-ddl][compass-collections-ddl]
- [compass-connect][compass-connect]
- [compass-crud][compass-crud]
- [compass-database][compass-database]
- [compass-databases-ddl][compass-databases-ddl]
- [compass-deployment-awareness][compass-deployment-awareness]
- [compass-export-to-language][compass-export-to-language]
- [compass-field-store][compass-field-store]
- [compass-find-in-page][compass-find-in-page]
- [compass-import-export][compass-import-export]
- [compass-indexes][compass-indexes]
- [compass-instance][compass-instance]
- [compass-license][compass-license]
- [compass-metrics][compass-metrics]
- [compass-plugin-info][compass-plugin-info]
- [compass-query-bar][compass-query-bar]
- [compass-query-history][compass-query-history]
- [compass-schema-validation][compass-schema-validation]
- [compass-server-version][compass-server-version]
- [compass-serverstats][compass-serverstats]
- [compass-sidebar][compass-sidebar]
- [compass-ssh-tunnel-status][compass-ssh-tunnel-status]
- [compass-status][compass-status]

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

#### Electron

Validate and test your component in an Electron window, styles included. The source automatically
compiles and the window content reloads when any file under `./src` changes.

To start Electron and render your component, type `npm start`.

If you edit the source code and hit _save_, the source will rebuild and the window reload
automatically. State is not maintained throughout reloads.

#### Enzyme

The test environment is configured to test components with [Enzyme][enzyme] (including full `mount` mode through [jsdom][jsdom]) and [enzyme-chai][enzyme-chai]. See the test folder for examples. Run `npm test` to execute the test suite.

## Developing

Almost all of your development will happen in the `./src` directory. Add new components to `./src/components`, actions to `./src/actions/index.js` and if you need additional stores, add them to `./src/stores`.

To be able to debug the plugin inside `compass` make sure [webpack prod config](./config/webpack.prod.config.js) has `devtool` is set to `source-map`. If you want faster compiler time when you commit/push, switch it to `false.`

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
- `test` implement your tests here, and name the files `*.test.js`.

## License

Apache 2.0

[travis_img]: https://travis-ci.org/mongodb-js/compass-home.svg?branch=master
[travis_url]: https://travis-ci.org/mongodb-js/compass-home
[react-storybook]: https://github.com/kadirahq/react-storybook
[enzyme]: http://airbnb.io/enzyme/
[enzyme-chai]: https://github.com/producthunt/chai-enzyme
[jsdom]: https://github.com/tmpvar/jsdom
[compass-aggregations]: https://github.com/mongodb-js/compass-aggregations
[compass-auth-kerberos]: https://github.com/mongodb-js/compass-auth-kerberos
[compass-auth-ldap]: https://github.com/mongodb-js/compass-auth-ldap
[compass-auth-x509]: https://github.com/mongodb-js/compass-auth-x509
[compass-auto-updates]: https://github.com/mongodb-js/compass-auto-updates
[compass-collection]: https://github.com/mongodb-js/compass-collection
[compass-collection-stats]: https://github.com/mongodb-js/compass-collection-stats
[compass-collections-ddl]: https://github.com/mongodb-js/compass-collections-ddl
[compass-connect]: https://github.com/mongodb-js/compass-connect
[compass-crud]: https://github.com/mongodb-js/compass-crud
[compass-database]: https://github.com/mongodb-js/compass-database
[compass-databases-ddl]: https://github.com/mongodb-js/compass-databases-ddl
[compass-deployment-awareness]: https://github.com/mongodb-js/compass-deployment-awareness
[compass-export-to-language]: https://github.com/mongodb-js/compass-export-to-language
[compass-field-store]: https://github.com/mongodb-js/compass-field-store
[compass-find-in-page]: https://github.com/mongodb-js/compass-find-in-page
[compass-import-export]: https://github.com/mongodb-js/compass-import-export
[compass-indexes]: https://github.com/mongodb-js/compass-indexes
[compass-instance]: https://github.com/mongodb-js/compass-instance
[compass-license]: https://github.com/mongodb-js/compass-license
[compass-metrics]: https://github.com/mongodb-js/compass-metrics
[compass-plugin-info]: https://github.com/mongodb-js/compass-plugin-info
[compass-query-bar]: https://github.com/mongodb-js/compass-query-bar
[compass-query-history]: https://github.com/mongodb-js/compass-query-history
[compass-schema-validation]: https://github.com/mongodb-js/compass-schema-validation
[compass-server-version]: https://github.com/mongodb-js/compass-server-version
[compass-serverstats]: https://github.com/mongodb-js/compass-serverstats
[compass-sidebar]: https://github.com/mongodb-js/compass-sidebar
[compass-ssh-tunnel-status]: https://github.com/mongodb-js/compass-ssh-tunnel-status
[compass-status]: https://github.com/mongodb-js/compass-status