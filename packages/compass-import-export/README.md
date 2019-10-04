# Compass Import/Export Plugin [![][travis_img]][travis_url]

> mongoimport and mongoexport functionality in [Compass][compass].

## Development

```bash
DEBUG=mongo* npm start
```

## Testing

```bash
npm test
```

### Test Cases

#### `compass-data-sets:crimedb.incidents`

We should be able to export this and import it back without losing anything. If I export it with the current Compass it only exports ~115k docs.

#### `compass-data-sets:test.people`

Small but contains arrays and \_id is a UUID

#### `compass-data-sets:test.people_missing_fields`

Small but not all documents contain all the fields

## TODO/Ideas

- [ ] COMPASS-3827: delimiter selection
- [ ] Format numbers/counters everywhere with numeral.js
- [ ] Set storybook back up
- [ ] Refactor src/modules/ so import and export reuse a common base
- [ ] Import csv: dynamicTyping of values like papaparse
- [ ] Import csv: mapHeaders option to support existing .<bson_type>() caster like [mongoimport does today](https://docs.mongodb.com/manual/reference/program/mongoimport)
- [ ] Import: expose finer-grained bulk op results in progress
- [ ] Import: define import mode: insert, upsert, merge
- [ ] Import: continue on unique index and doc validation errors by default
- [ ] Import: option to specify path for \_id
- [ ] Import from URL
- [ ] Import supports gzip/zip/bzip2 -> multi file import
- [ ] Import: option for path to pass to jsonstream for nested docs
- [ ] Show system notification when operation completes. like dropbox screenshot message.
- [ ] Import: Option to drop target collection before import
- [ ] Switch <ProgressBar /> to shared one from hadron-react
- [ ] Import: Drop file target
- [ ] Export: use electron add to recent documents API
- [ ]

## License

Apache 2.0

[travis_img]: https://travis-ci.org/mongodb-js/compass-import-export.svg?branch=master
[travis_url]: https://travis-ci.org/mongodb-js/compass-import-export
[compass]: https://github.com/mongodb-js/compass
