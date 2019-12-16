# Compass Import/Export Plugin [![][travis_img]][travis_url]

> [mongoimport][mongoimport] and [mongoexport][mongoexport] functionality in [Compass][compass].

## Development

After cloning this repository and running `npm install`, you can try this plugin with a real MongoDB Server in electron by running:

```bash
DEBUG=mongo* npm start
```

You can also utilize [Storybook](https://storybook.js.org/) when developing components:

```bash
npm run storybook;
```

## Testing

```bash
npm test
```

### Import Test Cases

See files in the `./test` directory.

## TODO/Ideas

- [x] Import: Move away from `state.fields` being array of objects to using all array's of strings. For now, there is some duplication of fields+transforms+excludes we'll come back to and fixup.
- [x] import-apply-type-and-projection supports nested dotnotation and only uses `state.importData.transforms`
- [ ] Import and Export: New Option: If you need to [specify extended-json legacy spec](https://github.com/mongodb/js-bson/pull/339)
- [ ] Import: bson-csv: support dotnotation expanded from `.` .<bson_type>() caster like [mongoimport does today][mongoimport]
- [ ] Import: Preview Table: Use highlight.js, mongodb-ace-mode, or something so the text style of the value within a cell matches its destination type
- [ ] Export: Use electron add to destination file to [recent documents](https://electronjs.org/docs/tutorial/recent-documents)
- [ ] Import and Export: Show system notification when operation completes. like dropbox screenshot message. toast "XX/XX documents successfully"
- [ ] Import: expose finer-grained bulk op results in progress -> "View Import Log File"
- [ ] Import: New Option: drop target collection before import
- [ ] Import: New Option: define import mode: insert, upsert, merge
- [ ] Import: New Option: specify a different path for `_id` such as `business_id` in the yelp dataset
- [ ] Import: Option for path to pass to JSONStream for nested docs (e.g. `results` array when fetching JSON from a rest api)
- [ ] Import: New Option: Paste URL to fetch from
- [ ] Import: Preview Table: use `react-table` and [`react-window`](https://www.npmjs.com/package/react-window-infinite-loader) for fixed headers and more # of documents to preview
- [ ] Import: Preview Table: Allow transpose on fields/values so all type selection and projection is in a single left aligned list
- [ ] Import: Multi file import via archive (supports gzip/zip/bzip2/etc.)
- [ ] Import: Use schema parser or something later to handle complete tabular renderings of sparse/polymorphic
- [ ] Import: Improve import-size-guesstimator
- [ ] Import: guess delimiter in `src/utils/detect-import-file.js`
- [ ] Import and Export: Extract anything from `./src/utils` that could live as standalone modules so other things like say a cli or a different platform could reuse compass' import/export business logic and perf.
- [ ] Refactor src/modules/ so import and export reuse a common base

## License

Apache 2.0

[travis_img]: https://travis-ci.org/mongodb-js/compass-import-export.svg?branch=master
[travis_url]: https://travis-ci.org/mongodb-js/compass-import-export
[compass]: https://github.com/mongodb-js/compass
[mongoimport]: https://docs.mongodb.com/manual/reference/program/mongoimport
[mongoexport]: https://docs.mongodb.com/manual/reference/program/mongoexport
