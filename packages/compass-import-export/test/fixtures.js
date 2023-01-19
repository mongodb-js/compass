import path from 'path';

const fixtures = {
  // other
  other: {
    javascript: path.join(__dirname, 'other', 'javascript'),
  },

  // csv
  csv: {
    good_commas: path.join(__dirname, 'csv', 'good-commas.csv'),
    good_tabs: path.join(__dirname, 'csv', 'good-tabs.csv'),
    // TODO: semicolon, space
    bad: path.join(__dirname, 'csv', 'bad.csv'),
    number_transform: path.join(__dirname, 'csv', 'number-transform.csv'),
    sparse: path.join(__dirname, 'csv', 'sparse.csv'),
  },

  // json
  json: {
    good: path.join(__dirname, 'json', 'good.json'),
    json_with_csv_fileext: path.join(
      __dirname,
      'json',
      'json-with-csv-fileext.csv'
    ),
    complex: path.join(__dirname, 'json', 'complex.json'),
    single_doc: path.join(__dirname, 'json', 'single-doc.json'),
  },

  // jsonl
  jsonl: {
    good: path.join(__dirname, 'jsonl', 'good.jsonl'),
    extra_line: path.join(__dirname, 'jsonl', 'extra-line.jsonl'),
  },

  // some tests write files
  JSON_MULTI_SMALL_DOCS: path.join(__dirname, 'json-multi-small-docs.json'),
  JSON_SINGLE_DOC: path.join(__dirname, 'json-single-doc.json'),
  CSV_FLAT_HEADERS: path.join(__dirname, 'csv-flat-headers.csv'),
  JSONL: path.join(__dirname, 'jsonl.jsonl'),

  // CSV files by BSON type
  csvByType: [
    'array',
    'binData',
    'boolean',
    'date',
    'decimal',
    'double',
    'int',
    'javascript',
    'javascriptWithScope',
    'long',
    'maxKey',
    'minKey',
    'null',
    'object',
    'objectId',
    'regex',
    'string',
    'symbol',
    'timestamp',
    'number', // actually a mix of all number types
    'mixed', // mix of a bunch of different types
  ].reduce((memo, type) => {
    memo[type] = path.join(__dirname, 'csv', 'types', `${type}.csv`);
    return memo;
  }, {}),
};

export { fixtures };
