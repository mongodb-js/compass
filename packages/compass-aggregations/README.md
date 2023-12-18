# compass-aggregations

> Compass Plugin for the MongoDB Aggregation Pipeline Builder.

[![](https://docs.mongodb.com/compass/master/_images/agg-builder-export-dropdown.png)](https://docs.mongodb.com/compass/master/aggregation-pipeline-builder/)

## Code Tour

- `src/components/aggregations` The primary export is connected component
- `src/modules/` is where action happens
  - action creators components call
  - reducers that call dataService, window.open, emit to other plugins, etc.
  - follows the `ducks` pattern
- `src/stores/store` is where plugin listens+responds to events of interest from other plugins
- store is global state instantiated via `configureStore()`
- All tests are local to their module e.g. `src/*/<module>.spec.js`

### Note: Cross-plugin Communication

> How does clicking on export to language button in aggregation builder show the modal that has code in it?

The aggregation builder in Compass actually involves 2 Compass plugins:

- [`<Aggregation />`](https://github.com/mongodb-js/compass-aggregations) Plugin for primary UI
- [`<ExportToLanguage />`](https://github.com/mongodb-js/compass-export-to-language) Modal plugin that connects `<Aggregation />` to `bson-transpilers` [for actual compiling to another language](https://github.com/mongodb-js/bson-transpilers)

Here's how these 2 plugins come together:

- `./src/modules/export-to-language.js` `appRegistry.emit('open-aggregation-export-to-language', generatePipelineAsString())`
- [`compass-export-to-language/src/stores/store.js`](https://github.com/mongodb-js/compass-export-to-language/blob/master/src/stores/store.js#L16) Listener for 'export to lang' event via appRegistry and renders its modal.
- [`compass-export-to-language/src/modules/export-query.js`](https://github.com/mongodb-js/compass-export-to-language/blob/master/src/modules/export-query.js#L56) has reducer for calling `bson-transpilers.compile()` which populates the code in the modal dialog.

### Usage with a `mongodb-data-service` Provider

See `./examples-data-service-provider.js` for details on what `data-service` functions are used and the applicable options for each.

## Contributing

If you're interested in helping with the Aggregation Builder plugin, we'd be over the moon excited! Here are a few ideas if you're interested but not sure where to start:

- [Add a new example aggregation](https://github.com/mongodb-js/compass-aggregations/#adding-new-examples)
- Additions/clarifications/improvements to `README`'s
- More tests (especially edge cases!)
- Generate `jsdoc` html to include in GitHub pages
- Improve build times (e.g. audit our webpack configs)

## Related

- [`<ExportToLanguage />`](https://github.com/mongodb-js/compass-export-to-language) Modal plugin that connects `<Aggregation />` to `bson-transpilers` [for actual compiling to another language](https://github.com/mongodb-js/bson-transpilers)
- [`mongodb-js/stage-validator`](https://github.com/mongodb-js/stage-validator) Aggregation Pipeline Stage grammar.
- [`bson-transpilers`](https://github.com/mongodb-js/bson-transpilers) Read the amazing: [Compiler in JavaScript using ANTLR](https://medium.com/dailyjs/compiler-in-javascript-using-antlr-9ec53fd2780f)
- [`@mongodb-js/compass-editor`](https://github.com/mongodb-js/compass/tree/main/packages/compass-editor) Reusable Compass editor component based on ace-editor with MongoDB-specific ace modes, themes, and autocompleters.

## Usage

This plugin uses an instance of a Redux store and not the traditional singleton,
so the store instance must be passed to the plugin. The plugin exports a function
to initialise the store instance, which decorates it with various methods to
conveniently set any values it uses.

This is for:

- `@mongodb-js/compass-aggregations 4.0.0-beta.11`
- `@mongodb-js/compass-export-to-language 4.0.2`

### Browser

Setting values via configure:

```js
import AppRegistry from 'hadron-app-registry';
import AggregationsPlugin, {
  configureStore as configureAggregationsStore
} from '@mongodb-js/compass-aggregations';
import ExportToLanguagePlugin, {
  configureStore as configureExportToLanguageStore
} from '@mongodb-js/compass-export-to-language';

const handleOut = (namespace) => {
  window.open(`https://cloud.mongodb.com/${namespace}`, '_new');
};

const handleCopy = (query) => {
  alert(query);
};

const appRegistry = new AppRegistry();

const aggregationsStore = configureAggregationsStore({
  dataProvider: {
    error: null,
    dataProvider: dataProvider
  },
  namespace: 'db.coll',
  serverVersion: '4.2.0',
  fields: [],
  outResultsFn: handleOut,
  env: 'atlas',
  localAppRegistry: appRegistry
});

const exportToLanguageStore = configureExportToLanguageStore({
  localAppRegistry: appRegistry,
  copyToClipboardFn: handleCopy
});

<AggregationsPlugin store={aggregationsStore} />
<ExportToLanguagePlugin store={exportToLanguageStore} />
```

### Hadron/Electron

```js
const role = appRegistry.getRole('Collection.Tab')[0];
const Plugin = role.component;
const configureStore = role.configureStore;
const store = configureStore({
  globalAppRegistry: appRegistry,
  localAppRegistry: localAppRegistry,
  dataProvider: {
    error: null,
    dataProvider: dataProvider,
  },
  env: 'on-prem',
  namespace: 'db.coll',
  serverVersion: '4.2.0',
  fields: [],
});

<Plugin store={store} />;
```

### Fields

The fields array must be an array of objects that the ACE editor autocompleter understands. See
[This example](https://github.com/mongodb-js/ace-autocompleter/blob/master/lib/constants/accumulators.js)
for what that array looks like.

### Data Provider

The data provider is an object that must adhere to the following interface:

```js
/**
 * Get a count of documents.
 *
 * @param {String} namespace - The namespace in "db.collection" format.
 * @param {Object} filter - The MQL query filter.
 * @param {Object} options - The query options.
 * @param {Function} callback - Gets error and integer count as params.
 */
provider.count(namespace, filter, options, callback);

/**
 * Execute an aggregation pipeline.
 *
 * @param {String} namespace - The namespace in "db.collection" format.
 * @param {Array} pipeline - The pipeline.
 * @param {Object} options - The agg options.
 * @param {Function} callback - Gets error and cursor as params. Cursor must
 *   implement #toArray (which takes a callback with error and an array of result docs)
 *   and #close
 */
provider.aggregate(namespace, pipeline, options, callback);
```

### App Registry Events Emmitted

Various actions within this plugin will emit events for other parts of the
application can be listened to via [hadron-app-registry][hadron-app-registry].
`Local` events are scoped to a `Tab`.
`Global` events are scoped to the whole Compass application.

#### Global

- **'open-create-view'**: Indicated `Create View` is to be opened.
- **'compass:export-to-language:opened', source**: Indicates
  `export-to-language` was opened. `source` refers to the module it is opened
  from, in this case `Aggregations`.
- **'open-namespace-in-new-tab'**: Indicates current pipeline's namespace is to
  be opened in a new tab. Called when `Create View` is successful, when
  `$merge` are to be shown, when `$out` results are to be shown.
- **'refresh-data'**: Indicates a data refresh is required within Compass.
- **'select-namespace', metadata**: Indicates a namespace is being selected.
  Emitted when updating a collection. `metadata` refers to information about the
  pipeline.
- **'agg-pipeline-deleted'**: Indicates a pipeline was deleted. Sends pipeline
  data to metrics.
- **'agg-pipeline-saved', pipelineName**: Indicates a pipeline was saved
  locally. Sens pipeline data to analytics.
- **'agg-pipeline-executed', metadata**: Indicates a pipeline was executed.
  `metadata` refers to data about the pipeline. Sends pipeline data to metrics.
- **'agg-pipeline-out-executed', pipelineId**: Indicates a pipeline was executed
  with a `$out`. Sends pipeline data to metrics.

#### Local

- **'open-aggregation-export-to-language', pipeline**: Indicates
  `export-to-language` plugin is to opened. `pipeline` refers to the pipeline to
  be exported.
- **'open-create-view', { meta: { source, pipeline }}**: Indicates `Create View` is being opened.

### App Registry Events Received

#### Local

- **'import-finished'**: When import data was successful, refresh plugin's input
  data.
- **'fields-changed', fields**: Received when schema fields change. Updates
  plugin's fields.
- **'refresh-data'**: Received when Compass data was refreshed. Refreshes input
  data in the plugin.
- **'open-create-view', { meta: { source, pipeline }}**: Received when `Create View` is to be opened. Opens a Create View modal.

#### Global

- **'refresh-data'**: Received when Input data is to be refreshed on Compass
  level. Refreshes plugin's input.

### Metrics Events

- `refresh-data`
- `open-create-view`
- `agg-pipeline-saved`
- `agg-pipeline-deleted`
- `agg-pipeline-executed`
- `agg-pipeline-out-executed`

## Development

### Tests

```shell
npm run test
```

### Electron

```shell
npm start
```

### Analyze Build

```shell
npm run analyze
```

## Install

```shell
npm i -S @mongodb-js/compass-aggregations
```

[hadron-app-registry]: https://github.com/mongodb-js/hadron-app-registry
