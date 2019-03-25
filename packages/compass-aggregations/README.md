# compass-aggregations [![][travis_img]][travis_url] [![][storybook_img]][storybook_url]

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

- [Add a new example aggregation](https://github.com/mongodb-js/compass-aggregations/tree/master/examples#adding-new-examples)
- Additions/clarifications/improvements to `README`'s
- More tests (especially edge cases!)
- Generate `jsdoc` html to include in GitHub pages
- Improve build times (e.g. audit our webpack configs)

## Related

- [`<ExportToLanguage />`](https://github.com/mongodb-js/compass-export-to-language) Modal plugin that connects `<Aggregation />` to `bson-transpilers` [for actual compiling to another language](https://github.com/mongodb-js/bson-transpilers)
- [`mongodb-js/stage-validator`](https://github.com/mongodb-js/stage-validator) Aggregation Pipeline Stage grammar.
- [`bson-transpilers`](https://github.com/mongodb-js/bson-transpilers) Read the amazing: [Compiler in JavaScript using ANTLR](https://medium.com/dailyjs/compiler-in-javascript-using-antlr-9ec53fd2780f)
- [`mongodb-js/ace-mode`](https://github.com/mongodb-js/ace-mode) MongoDB highlighting rules for ACE.
- [`mongodb-js/ace-theme`](https://github.com/mongodb-js/ace-theme) MongoDB syntax highlighting rules for ACE.
- [`mongodb-js/ace-autocompleter`](https://github.com/mongodb-js/ace-autocompleter) Makes ACE autocompletion aware of MongoDB Aggregation Pipeline [operators, expressions, and fields](https://github.com/mongodb-js/ace-autocompleter/tree/master/lib/constants).

## Development

### Tests

```
npm run test
```

### Electron

```
npm start
```

### Storybook

```
npm run storybook
```

### Analyze Build

```
npm run analyze
```

## License

Apache 2.0

[travis_img]: https://travis-ci.org/mongodb-js/compass-aggregations.svg?branch=master
[travis_url]: https://travis-ci.org/mongodb-js/compass-aggregations
[storybook_img]: https://raw.githubusercontent.com/storybooks/brand/master/badge/badge-storybook.svg
[storybook_url]: https://mongodb-js.github.io/compass-aggregations/

## TODO

- [x] Verify Storybook not included in `production` bundle for Cloud
- [x] Switch Storybook deploy from `3.0.0` to `master`
- [x] Webpack 4 Upgrade #79 
- [x] Webpack 4 upgrade part 2 mongodb-js/compass-plugin#23
- [ ] COMPASS-2888: Autocompletion includes projections #76
- [ ] COMPASS-2960: Autocomplete `$$variables` defined from `let`
- [ ] COMPASS-3086: Quickly create new pipelines by pasting into stage editor when in `INITIAL_STATE`

#### Misc

- [ ] input-docs uses sample size setting

#### Future

- [ ] Write some more tests for saving
- [ ] Save pipeline validation
