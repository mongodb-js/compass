const chai = require('chai');
const expect = chai.expect;
const compiler = require('..');
const {
  BsonCompilersRuntimeError
} = require('../helper/error');

const errors = {
  type_error: [
    {
      input: '{$project: "invalid"}',
      error: BsonCompilersRuntimeError
    },
    {
      input: '{$project: {}}',
      error: BsonCompilersRuntimeError
    },
    {
      input: '{x: {$not: "1"}}',
      error: BsonCompilersRuntimeError
    },
    {
      input: '{x: {$mod: 1}}',
      error: BsonCompilersRuntimeError
    },
    {
      input: '{x: {$mod: [1]}}',
      error: BsonCompilersRuntimeError
    },
    {
      input: '{x: {$mod: {}}}',
      error: BsonCompilersRuntimeError
    },
    {
      input: '{$sort: {}}',
      error: BsonCompilersRuntimeError
    },
    {
      input: '{$sort: 1}',
      error: BsonCompilersRuntimeError
    },
    {
      input: '{$sort: {x: 1, y: "not 1/-1"}}',
      error: BsonCompilersRuntimeError
    },
    {
      input: '{$sort: {x: 1, y: {}}}',
      error: BsonCompilersRuntimeError
    },
    {
      input: '{$sort: {x: 1, y: {$meta: 1}}}',
      error: BsonCompilersRuntimeError
    },
    {
      input: '{$project: {}}',
      error: BsonCompilersRuntimeError
    },
    {
      input: '{$project: 1}',
      error: BsonCompilersRuntimeError
    },
    {
      input: '{x: {$sample: {}}}',
      error: BsonCompilersRuntimeError
    },
    {
      input: '{x: {$sample: {notSize: 1}}}',
      error: BsonCompilersRuntimeError
    },
    {
      input: '{x: {$sample: {size: 10, other: 1}}}',
      error: BsonCompilersRuntimeError
    },
    {
      input: '{x: {$replaceRoot: {}}}',
      error: BsonCompilersRuntimeError
    },
    {
      input: '{x: {$replaceRoot: {notNewRoot: 1}}}',
      error: BsonCompilersRuntimeError
    },
    {
      input: '{x: {$replaceRoot: {newRoot: 10, other: 1}}}',
      error: BsonCompilersRuntimeError
    },
    {
      input: '{$graphLookup: {}}',
      error: BsonCompilersRuntimeError
    },
    {
      input: '{$graphLookup: 1}',
      error: BsonCompilersRuntimeError
    },
    {
      input: '{$graphLookup: {from: "x"}}',
      error: BsonCompilersRuntimeError
    },
    {
      input: '{ $graphLookup: {from: "collection", startWith: "$expr", connectFromField: "fromF", connectToField: "toF", as: "asF", extra: 1} }',
      error: BsonCompilersRuntimeError
    },
    {
      input: '{$lookup: {}}',
      error: BsonCompilersRuntimeError
    },
    {
      input: '{$lookup: {from: "x"}}',
      error: BsonCompilersRuntimeError
    },
    {
      input: '{ $lookup: { from: "fromColl", localField: "localF", foreignField: "foreignF", as: "outputF", extra: 1} }',
      error: BsonCompilersRuntimeError
    },
    {
      input: '{$bucket: {}}',
      error: BsonCompilersRuntimeError
    },
    {
      input: '{$bucket: {groupBy: "x"}}',
      error: BsonCompilersRuntimeError
    },
    {
      input: '{$bucket: {groupBy: "x", boundaries: 1, extra: 1}}',
      error: BsonCompilersRuntimeError
    },
    {
      input: '{$bucketAuto: {}}',
      error: BsonCompilersRuntimeError
    },
    {
      input: '{$bucketAuto: {groupBy: "x"}}',
      error: BsonCompilersRuntimeError
    },
    {
      input: '{$bucketAuto: {groupBy: "x", buckets: 1, extra: 1}}',
      error: BsonCompilersRuntimeError
    },
    {
      input: '{$text: {}}',
      error: BsonCompilersRuntimeError
    },
    {
      input: '{$text: {$search: "x", extra: 1}}',
      error: BsonCompilersRuntimeError
    },
    {
      input: '{$unwind: {}}',
      error: BsonCompilersRuntimeError
    },
    {
      input: '{$unwind: 1}',
      error: BsonCompilersRuntimeError
    },
    {
      input: '{$unwind: {path: "x", extra: 1}}',
      error: BsonCompilersRuntimeError
    },
    {
      input: '{$group: {x: 1}}',
      error: BsonCompilersRuntimeError
    },
    {
      input: '{$group: {}}',
      error: BsonCompilersRuntimeError
    },
    {
      input: '{$group: 1}',
      error: BsonCompilersRuntimeError
    },
    {
      input: '{$facet: {}}',
      error: BsonCompilersRuntimeError
    },
    {
      input: '{$facet: 1}',
      error: BsonCompilersRuntimeError
    },
    {
      input: '{$addFields: {}}',
      error: BsonCompilersRuntimeError
    },
    {
      input: '{$addFields: 1}',
      error: BsonCompilersRuntimeError
    }
  ],
  shape_error: [
    {
      input: '{$sum: 1}',
      error: BsonCompilersRuntimeError
    }
  ]
};


describe('Java Builders', () => {
  describe('handles errors', () => {
    for (const key of Object.keys(errors)) {
      describe(`${key}`, () => {
        for (const test of errors[key]) {
          it(`${test.input} throws expected error`, () => {
            expect(() => {
              compiler.javascript.java.compile(test.input, true);
            }).to.throw(test.error);
          });
        }
      });
    }
  });
});
