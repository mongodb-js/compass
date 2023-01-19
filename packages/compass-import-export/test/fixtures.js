import path from 'path';

const FIXTURES = {
  // other
  JS_I_THINK_IS_JSON: path.join(__dirname, 'other', 'js-i-think-is-json'),

  // csv
  GOOD_COMMAS_CSV: path.join(__dirname, 'csv', 'good-commas.csv'),
  GOOD_TABS_CSV: path.join(__dirname, 'csv', 'good-tabs.csv'), // tsv?
  BAD_CSV: path.join(__dirname, 'csv', 'test_bad.csv'),
  NUMBER_TRANSFORM_CSV: path.join(__dirname, 'csv', 'number-transform.csv'),
  CSV_FLAT_HEADERS: path.join(__dirname, 'csv', 'export-flat-headers.csv'),
  SPARSE_CSV: path.join(__dirname, 'csv', 'sparse.csv'),

  // json
  JSON_SINGLE_DOC: path.join(__dirname, 'json', 'export-single-doc.json'),
  JSON_MULTI_SMALL_DOCS: path.join(__dirname, 'json', 'export-multi-small-docs.json'),
  GOOD_JSON: path.join(__dirname, 'json', 'docs.json'),
  JSON_ARRAY: path.join(__dirname, 'json', 'docs.json'),
  JSON_WITH_CSV_FILEEXT: path.join(__dirname, 'json', 'json-with-a.csv'),
  COMPLEX_JSON: path.join(__dirname, 'json', 'complex.json'),
  SINGLE_JSON: path.join(__dirname, 'json', 'single-doc.json'),

  // jsonl
  JSONL: path.join(__dirname, 'jsonl', 'export-two-docs.jsonl'),
  NDJSON: path.join(__dirname, 'jsonl', 'docs.jsonl'),
  NDJSON_EXTRA_LINE: path.join(__dirname, 'jsonl', 'docs-with-newline-ending.jsonl'),
  LINE_DELIMITED_JSON: path.join(__dirname, 'jsonl', 'docs.jsonl'),
  LINE_DELIMITED_JSON_EXTRA_LINE: path.join(
    __dirname,
    'jsonl',
    'docs-with-newline-ending.jsonl'
  ),
};

export { FIXTURES };
