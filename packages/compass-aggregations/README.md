# compass-aggregations [![][travis_img]][travis_url]

> Compass Aggregation Pipeline Builder

## Related

- [`mongodb-js/stage-validator`](https://github.com/mongodb-js/stage-validator) Aggregation Pipeline Stage grammar.
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
- [ ] Remove sample mode toggle
- [ ] clarify settings name language

#### Future

- [ ] Write some more tests for saving
- [ ] Save pipeline validation
