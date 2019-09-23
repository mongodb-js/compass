# MongoDB Compass [![][travis_img]][travis_url]

The MongoDB GUI.

## Requirements

- NodeJS 10.2.1
- NPM >= 6.0.0

## Running Compass

```shell
npm install
npm start [compass|compass-readonly|compass-isolated]
```

## Plugins

Current Plugin API Version: 3.0.0

All Compass plugins, for which the majority of the application functionality
lives, are tagged via the [compass-plugin](https://github.com/search?q=topic%3Acompass-plugin+org%3Amongodb-js&type=Repositories) topic in the mongodb-js organisation.

Plugins can be added by requiring them as a dependency in the Compass package.json,
and my adding their installed location to the distribution plugin list also in the
package.json.

### Plugin Roles

- `Instance.Tab` - Display as tabs in the instance context of the app.
- `Database.Tab` - Display as tabs in the database context of the app.
- `Collection.Tab` - Display as sub tabs in the collection context of the app.
- `Global.Modal` - Will open as modal dialogs in any context of the app.
- `Collection.ScopedModal` - Will open as a modal scoped in the collection context.

### Creating a New Plugin

```shell
npm i -g khaos
khaos create mongodb-js/compass-plugin ./my-plugin
```

### Issues

- Please create a ticket at our [JIRA Project](jira.mongodb.org/browse/COMPASS).

[travis_img]: https://travis-ci.org/mongodb-js/compass.svg
[travis_url]: https://travis-ci.org/mongodb-js/compass
