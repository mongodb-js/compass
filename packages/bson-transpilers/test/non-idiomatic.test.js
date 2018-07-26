const chai = require('chai');
const expect = chai.expect;
const compiler = require('..');

const nonIdiomaticDocs = [
  {
    description: '{x: 1}',
    javascript: '{x: 1}',
    shell: '{x: 1}',
    java: 'new Document("x", 1L)'
  },
  {
    description: 'Doc with trailing comma',
    javascript: '{x: \'1\',}',
    shell: '{x: 1}',
    java: 'new Document("x", "1")'
  },
  {
    description: 'Doc with array',
    javascript: '{x: [\'1\', \'2\']}',
    shell: '{x: [\'1\', \'2\']}',
    java: 'new Document("x", Arrays.asList("1", "2"))'
  },
  {
    description: 'Doc with subdoc',
    javascript: '{x: {y: \'2\'}}',
    shell: '{x: {y: \'2\'}}',
    java: 'new Document("x", new Document("y", "2"))'
  },
  {
    description: 'Object.create()',
    javascript: 'Object.create({x: \'1\'})',
    shell: 'Object.create({x: \'1\'})',
    java: 'new Document("x", "1")'
  },
  {
    description: 'Empty object',
    javascript: '{}',
    shell: '{}',
    java: 'new Document()'
  },
  {
    description: 'Two items in document',
    javascript: '{x: \'1\', n: \'4\'}',
    shell: '{x: \'1\', n: \'4\'}',
    java: 'new Document("x", "1")\n    .append("n", "4")'
  },
  {
    description: 'nested document',
    javascript: '{ graphLookup : { "from" : "raw_data", "startWith" : "$_id", "connectFromField" : "_id", "connectToField" : "manager", "as" : "reports" } }',
    shell: '{ graphLookup : { "from" : "raw_data", "startWith" : "$_id", "connectFromField" : "_id", "connectToField" : "manager", "as" : "reports" } }',
    java: 'new Document("graphLookup", new Document("from", "raw_data")\n        .append("startWith", "$_id")\n        .append("connectFromField", "_id")\n        .append("connectToField", "manager")\n        .append("as", "reports"))'
  },
  {
    description: 'nested document with array',
    javascript: '{ status: \'A\', $or: [{ qty: { $lt: 30 } }, { item: { $regex: \'^p\' } }] }',
    shell: '{ status: \'A\', $or: [{ qty: { $lt: 30 } }, { item: { $regex: \'^p\' } }] }',
    java: 'new Document("status", "A")\n    .append("$or", Arrays.asList(new Document("qty", \n        new Document("$lt", 30L)), \n        new Document("item", \n        new Document("$regex", "^p"))))'
  },
  {
    description: 'Array with subdoc',
    javascript: '[\'1\', { settings: \'http2\' }]',
    shell: '[\'1\', { settings: \'http2\' }]',
    java: 'Arrays.asList("1", \n    new Document("settings", "http2"))'
  },
  {
    description: 'nested array with nested subdoc',
    javascript: '{"pipeline": [ { $match: { $expr: { "$eq": [ "$manager", "$$me" ] } } }, { $project: { managers : 0 } }, { $sort: { startQuarter: 1, notes:1, job_code: 1 } } ]}',
    shell: '{"pipeline": [ { $match: { $expr: { "$eq": [ "$manager", "$$me" ] } } }, { $project: { managers : 0 } }, { $sort: { startQuarter: 1, notes:1, job_code: 1 } } ]}',
    java: 'new Document("pipeline", Arrays.asList(new Document("$match", \n        new Document("$expr", \n        new Document("$eq", Arrays.asList("$manager", "$$me")))), \n        new Document("$project", \n        new Document("managers", 0L)), \n        new Document("$sort", \n        new Document("startQuarter", 1L)\n                .append("notes", 1L)\n                .append("job_code", 1L))))'
  }
];

describe('Non-idiomatic documents', () => {
  describe('non-idiomatic java documents from javascript', () => {
    for (const test of nonIdiomaticDocs) {
      it(test.description, () => {
        expect(compiler.javascript.java(test.javascript, false)).to.equal(test.java);
      });
    }
  });
  describe('non-idiomatic java documents from shell', () => {
    for (const test of nonIdiomaticDocs) {
      it(test.description, () => {
        expect(compiler.shell.java(test.javascript, false)).to.equal(test.java);
      });
    }
  });
});
