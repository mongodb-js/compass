import path from 'path';

const FIXTURES = {
  GOOD_COMMAS_CSV: path.join(__dirname, 'good-commas.csv'),
  GOOD_TABS_CSV: path.join(__dirname, 'good-tabs.csv'),
  BAD_CSV: path.join(__dirname, 'test_bad.csv'),
  JS_I_THINK_IS_JSON: path.join(__dirname, 'js-i-think-is-json'),
  GOOD_JSON: path.join(__dirname, 'docs.json'),
  DEEP_NESTED_JSON: path.join(__dirname, 'deep-nested.json'),
  LINE_DELIMITED_JSON: path.join(__dirname, 'docs.jsonl'),
  LINE_DELIMITED_JSON_EXTRA_LINE: path.join(
    __dirname,
    'docs-with-newline-ending.jsonl'
  ),
  NUMBER_TRANSFORM_CSV: path.join(__dirname, 'number-transform.csv'),
  JSON_ARRAY: path.join(__dirname, 'docs.json'),
  NDJSON: path.join(__dirname, 'docs.jsonl'),
  NDJSON_EXTRA_LINE: path.join(__dirname, 'docs-with-newline-ending.jsonl'),
  JSON_WITH_CSV_FILEEXT: path.join(__dirname, 'json-with-a.csv'),
  JSON_SINGLE_DOC: path.join(__dirname, 'export-single-doc.json'),
  JSON_MULTI_SMALL_DOCS: path.join(__dirname, 'export-multi-small-docs.json'),
  JSONL: path.join(__dirname, 'export-two-docs.jsonl'),
  CSV_FLAT_HEADERS: path.join(__dirname, 'export-flat-headers.csv'),
};

export { FIXTURES };
