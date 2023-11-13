import path from 'path';

function getCSVByType(): Record<string, string> {
  return [
    'array',
    'binData',
    'boolean',
    'date',
    'decimal',
    'double',
    'int',
    'long',
    'maxKey',
    'minKey',
    'null',
    'object',
    'objectId',
    'regex',
    'string',
    'timestamp',
    'md5',
    'uuid',
    'ejson', // the fallback when exporting various types
    'number', // actually a mix of all number types
    'mixed', // mix of a bunch of different types
  ].reduce((memo: Record<string, string>, type: string) => {
    memo[type] = path.join(__dirname, 'csv', 'types', `${type}.csv`);
    return memo;
  }, {});
}

const fixtures = {
  // other
  other: {
    javascript: path.join(__dirname, 'other', 'javascript'),
    text: path.join(__dirname, 'other', 'hello.txt'),
    empty: path.join(__dirname, 'other', 'empty'),
  },

  // csv
  csv: {
    good_commas: path.join(__dirname, 'csv', 'good-commas.csv'),
    good_tabs: path.join(__dirname, 'csv', 'good-tabs.csv'),
    semicolons: path.join(__dirname, 'csv', 'semicolons.csv'),
    spaces: path.join(__dirname, 'csv', 'spaces.csv'),
    // TODO: semicolon, space
    bad: path.join(__dirname, 'csv', 'bad.csv'),
    number_transform: path.join(__dirname, 'csv', 'number-transform.csv'),
    sparse: path.join(__dirname, 'csv', 'sparse.csv'),
    array: path.join(__dirname, 'csv', 'array.csv'),
    object: path.join(__dirname, 'csv', 'object.csv'),
    complex: path.join(__dirname, 'csv', 'complex.csv'),
    many_columns: path.join(__dirname, 'csv', 'many-columns.csv'),
    linebreaks: path.join(__dirname, 'csv', 'linebreaks.csv'),
  },

  // json
  json: {
    good: path.join(__dirname, 'json', 'good.json'),
    complex: path.join(__dirname, 'json', 'complex.json'),
    promotable: path.join(__dirname, 'json', 'promotable.json'),
  },

  // jsonl
  jsonl: {
    good: path.join(__dirname, 'jsonl', 'good.jsonl'),
    extra_line: path.join(__dirname, 'jsonl', 'extra-line.jsonl'),
    jsonl_with_csv_fileext: path.join(
      __dirname,
      'jsonl',
      'jsonl-with-csv-fileext.csv'
    ),
    single_doc: path.join(__dirname, 'jsonl', 'single-doc.json'),
  },

  // some tests write files
  JSON_MULTI_SMALL_DOCS: path.join(__dirname, 'json-multi-small-docs.json'),
  JSON_SINGLE_DOC: path.join(__dirname, 'json-single-doc.json'),
  CSV_FLAT_HEADERS: path.join(__dirname, 'csv-flat-headers.csv'),
  JSONL: path.join(__dirname, 'jsonl.jsonl'),

  allTypes: path.join(__dirname, 'docs', 'all-bson-types.js'),

  // CSV files by BSON type
  csvByType: getCSVByType(),
};

export { fixtures };
