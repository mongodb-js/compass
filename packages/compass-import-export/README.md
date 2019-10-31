# Compass Import/Export Plugin [![][travis_img]][travis_url]

> mongoimport and mongoexport functionality in [Compass][compass].

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

- [ ] Refactor src/modules/ so import and export reuse a common base
- [ ] Import and Export: Show system notification when operation completes. like dropbox screenshot message.
- [ ] Import csv: dynamicTyping of values like papaparse
- [ ] Import csv: mapHeaders option to support existing .<bson_type>() caster like [mongoimport does today](https://docs.mongodb.com/manual/reference/program/mongoimport)
- [ ] Import: expose finer-grained bulk op results in progress
- [ ] Import: define import mode: insert, upsert, merge
- [ ] Import: option to specify a different path for `_id` such as `business_id` in the yelp dataset
- [ ] Import: Paste URL to fetch from
- [ ] Import: multi file import via archive (supports gzip/zip/bzip2/etc.)
- [ ] Import: option for path to pass to jsonstream for nested docs (e.g. `results` array when fetching JSON from a rest api)
- [ ] Import: Option to drop target collection before import
- [ ] Import: Drop file target in modal
- [ ] Export: use electron add to destination file to [recent documents](https://electronjs.org/docs/tutorial/recent-documents)

## License

Apache 2.0

[travis_img]: https://travis-ci.org/mongodb-js/compass-import-export.svg?branch=master
[travis_url]: https://travis-ci.org/mongodb-js/compass-import-export
[compass]: https://github.com/mongodb-js/compass
