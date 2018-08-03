const chai = require('chai');
const expect = chai.expect;
const transpiler = require('..');
const {
  BsonTranspilersRuntimeError
} = require('../helper/error');

const errors = {
  type_error: [
    {
      input: '{$project: "invalid"}',
      error: BsonTranspilersRuntimeError
    },
    {
      input: '{$project: {}}',
      error: BsonTranspilersRuntimeError
    },
    {
      input: '{x: {$not: "1"}}',
      error: BsonTranspilersRuntimeError
    },
    {
      input: '{x: {$mod: 1}}',
      error: BsonTranspilersRuntimeError
    },
    {
      input: '{x: {$mod: [1]}}',
      error: BsonTranspilersRuntimeError
    },
    {
      input: '{x: {$mod: {}}}',
      error: BsonTranspilersRuntimeError
    },
    {
      input: '{$sort: {}}',
      error: BsonTranspilersRuntimeError
    },
    {
      input: '{$sort: 1}',
      error: BsonTranspilersRuntimeError
    },
    {
      input: '{$sort: {x: 1, y: "not 1/-1"}}',
      error: BsonTranspilersRuntimeError
    },
    {
      input: '{$sort: {x: 1, y: {}}}',
      error: BsonTranspilersRuntimeError
    },
    {
      input: '{$sort: {x: 1, y: {$meta: 1}}}',
      error: BsonTranspilersRuntimeError
    },
    {
      input: '{$project: {}}',
      error: BsonTranspilersRuntimeError
    },
    {
      input: '{$project: 1}',
      error: BsonTranspilersRuntimeError
    },
    {
      input: '{x: {$sample: {}}}',
      error: BsonTranspilersRuntimeError
    },
    {
      input: '{x: {$sample: {notSize: 1}}}',
      error: BsonTranspilersRuntimeError
    },
    {
      input: '{x: {$sample: {size: 10, other: 1}}}',
      error: BsonTranspilersRuntimeError
    },
    {
      input: '{x: {$replaceRoot: {}}}',
      error: BsonTranspilersRuntimeError
    },
    {
      input: '{x: {$replaceRoot: {notNewRoot: 1}}}',
      error: BsonTranspilersRuntimeError
    },
    {
      input: '{x: {$replaceRoot: {newRoot: 10, other: 1}}}',
      error: BsonTranspilersRuntimeError
    },
    {
      input: '{$graphLookup: {}}',
      error: BsonTranspilersRuntimeError
    },
    {
      input: '{$graphLookup: 1}',
      error: BsonTranspilersRuntimeError
    },
    {
      input: '{$graphLookup: {from: "x"}}',
      error: BsonTranspilersRuntimeError
    },
    {
      input: '{ $graphLookup: {from: "collection", startWith: "$expr", connectFromField: "fromF", connectToField: "toF", as: "asF", extra: 1} }',
      error: BsonTranspilersRuntimeError
    },
    {
      input: '{$lookup: {}}',
      error: BsonTranspilersRuntimeError
    },
    {
      input: '{$lookup: {from: "x"}}',
      error: BsonTranspilersRuntimeError
    },
    {
      input: '{ $lookup: { from: "fromColl", localField: "localF", foreignField: "foreignF", as: "outputF", extra: 1} }',
      error: BsonTranspilersRuntimeError
    },
    {
      input: '{$bucket: {}}',
      error: BsonTranspilersRuntimeError
    },
    {
      input: '{$bucket: {groupBy: "x"}}',
      error: BsonTranspilersRuntimeError
    },
    {
      input: '{$bucket: {groupBy: "x", boundaries: 1, extra: 1}}',
      error: BsonTranspilersRuntimeError
    },
    {
      input: '{$bucketAuto: {}}',
      error: BsonTranspilersRuntimeError
    },
    {
      input: '{$bucketAuto: {groupBy: "x"}}',
      error: BsonTranspilersRuntimeError
    },
    {
      input: '{$bucketAuto: {groupBy: "x", buckets: 1, extra: 1}}',
      error: BsonTranspilersRuntimeError
    },
    {
      input: '{$text: {}}',
      error: BsonTranspilersRuntimeError
    },
    {
      input: '{$text: {$search: "x", extra: 1}}',
      error: BsonTranspilersRuntimeError
    },
    {
      input: '{$unwind: {}}',
      error: BsonTranspilersRuntimeError
    },
    {
      input: '{$unwind: 1}',
      error: BsonTranspilersRuntimeError
    },
    {
      input: '{$unwind: {path: "x", extra: 1}}',
      error: BsonTranspilersRuntimeError
    },
    {
      input: '{$group: {x: 1}}',
      error: BsonTranspilersRuntimeError
    },
    {
      input: '{$group: {}}',
      error: BsonTranspilersRuntimeError
    },
    {
      input: '{$group: 1}',
      error: BsonTranspilersRuntimeError
    },
    {
      input: '{$facet: {}}',
      error: BsonTranspilersRuntimeError
    },
    {
      input: '{$facet: 1}',
      error: BsonTranspilersRuntimeError
    },
    {
      input: '{$addFields: {}}',
      error: BsonTranspilersRuntimeError
    },
    {
      input: '{$addFields: 1}',
      error: BsonTranspilersRuntimeError
    }
  ],
  shape_error: [
    {
      input: '{$sum: 1}',
      error: BsonTranspilersRuntimeError
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
              transpiler.javascript.java.compile(test.input, true);
            }).to.throw(test.error);
          });
        }
      });
    }
  });
});
