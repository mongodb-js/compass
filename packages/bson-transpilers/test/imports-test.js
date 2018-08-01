const chai = require('chai');
const expect = chai.expect;
const compiler = require('..');

const imports = [
  {
    description: 'Single import Code',
    input: '{x: Code("code")}',
    output: {
      java: `import org.bson.types.Code;
import static com.mongodb.client.model.Filters.eq;`,
      csharp: `using MongoDB.Bson;
using MongoDB.Driver;`,
      python: 'from bson import Code',
      javascript: `const {
  Code
} = require('mongo');`
    }
  },
  {
    description: 'Single import Code with scope',
    input: '{x: Code("code", {x: 1})}',
    output: {
      java: `import org.bson.Document;
import org.bson.types.Code;
import org.bson.types.CodeWithScope;
import static com.mongodb.client.model.Filters.eq;`,
      csharp: `using MongoDB.Bson;
using MongoDB.Driver;`,
      python: 'from bson import Code',
      javascript: `const {
  Code
} = require('mongo');`
    }
  },
  {
    description: 'Single import ObjectId',
    input: '{x: ObjectId()}',
    output: {
      java: `import org.bson.types.ObjectId;
import static com.mongodb.client.model.Filters.eq;`,
      csharp: `using MongoDB.Bson;
using MongoDB.Driver;`,
      python: 'from bson import ObjectId',
      javascript: `const {
  ObjectId
} = require('mongo');`
    }
  },
  {
    description: 'Single import Timestamp',
    input: '{x: Timestamp(1, 2)}',
    output: {
      java: `import org.bson.types.BSONTimestamp;
import static com.mongodb.client.model.Filters.eq;`,
      csharp: `using MongoDB.Bson;
using MongoDB.Driver;`,
      python: 'from bson import Timestamp',
      javascript: `const {
  Timestamp
} = require('mongo');`
    }
  },
  {
    description: 'Single import DBRef',
    input: '{x: DBRef("db", ObjectId())}',
    output: {
      java: `import org.bson.types.ObjectId;
import com.mongodb.DBRef;
import static com.mongodb.client.model.Filters.eq;`,
      csharp: `using MongoDB.Bson;
using MongoDB.Driver;`,
      python: 'from bson import ObjectId, DBRef',
      javascript: `const {
  ObjectId,
  DBRef
} = require('mongo');`
    }
  },
  {
    description: 'Single import Double',
    input: '{x: 1}',
    js_input: '{x: Double(1)}',
    output: {
      java: 'import static com.mongodb.client.model.Filters.eq;',
      csharp: `using MongoDB.Bson;
using MongoDB.Driver;`,
      python: '',
      javascript: ''
    }
  },
  {
    description: 'Single import NumberInt',
    input: '{x: NumberInt(1)}',
    js_input: '{x: Int32(1)}',
    output: {
      java: 'import static com.mongodb.client.model.Filters.eq;',
      csharp: `using MongoDB.Bson;
using MongoDB.Driver;`,
      python: '',
      javascript: `const {
  Int32
} = require('mongo');`
    }
  },
  {
    description: 'Single import NumberLong',
    input: '{x: NumberLong(1)}',
    js_input: '{x: Long(1, 100)}',
    output: {
      java: 'import static com.mongodb.client.model.Filters.eq;',
      csharp: `using MongoDB.Bson;
using MongoDB.Driver;`,
      python: 'from bson import Int64',
      javascript: `const {
  Long
} = require('mongo');`
    }
  },
  {
    description: 'Single import MinKey',
    input: '{x: MinKey()}',
    output: {
      java: `import org.bson.types.MinKey;
import static com.mongodb.client.model.Filters.eq;`,
      csharp: `using MongoDB.Bson;
using MongoDB.Driver;`,
      python: 'from bson import MinKey',
      javascript: `const {
  MinKey
} = require('mongo');`
    }
  },
  {
    description: 'Single import MaxKey',
    input: '{x: MaxKey()}',
    output: {
      java: `import org.bson.types.MaxKey;
import static com.mongodb.client.model.Filters.eq;`,
      csharp: `using MongoDB.Bson;
using MongoDB.Driver;`,
      python: 'from bson import MaxKey',
      javascript: `const {
  MaxKey
} = require('mongo');`
    }
  },
  {
    description: 'Single import RegExp',
    input: '{x: RegExp("abc")}',
    output: {
      java: `import java.util.regex.Pattern;
import static com.mongodb.client.model.Filters.eq;`,
      csharp: `using MongoDB.Bson;
using MongoDB.Driver;
using System.Text.RegularExpressions;`,
      python: '',
      javascript: ''
    }
  },
  {
    description: 'Single import BSONRegExp',
    js_input: '{x: BSONRegExp("abc")}',
    output: {
      java: `import org.bson.BsonRegularExpression;
import static com.mongodb.client.model.Filters.eq;`,
      csharp: `using MongoDB.Bson;
using MongoDB.Driver;`,
      python: ''
    }
  },
  {
    description: 'Single import literal regex',
    input: '{x: /abc/g}',
    output: {
      java: `import java.util.regex.Pattern;
import static com.mongodb.client.model.Filters.eq;`,
      csharp: `using MongoDB.Bson;
using MongoDB.Driver;
using System.Text.RegularExpressions;`,
      python: '',
      javascript: ''
    }
  },
  {
    description: 'Single import Timestamp',
    input: '{x: Timestamp(1, 2)}',
    output: {
      java: `import org.bson.types.BSONTimestamp;
import static com.mongodb.client.model.Filters.eq;`,
      csharp: `using MongoDB.Bson;
using MongoDB.Driver;`,
      python: 'from bson import Timestamp',
      javascript: `const {
  Timestamp
} = require('mongo');`
    }
  },
  {
    description: 'Single import Symbol',
    input: '{x: Symbol("a")}',
    output: {
      java: `import org.bson.types.Symbol;
import static com.mongodb.client.model.Filters.eq;`,
      csharp: `using MongoDB.Bson;
using MongoDB.Driver;`,
      python: '',
      javascript: `const {
  Symbol
} = require('mongo');`
    }
  },
  {
    description: 'Single import NumberDecimal',
    input: '{x: NumberDecimal(1)}',
    js_input: '{x: Decimal128(1)}',
    output: {
      java: `import org.bson.types.Decimal128;
import static com.mongodb.client.model.Filters.eq;`,
      csharp: `using MongoDB.Bson;
using MongoDB.Driver;`,
      python: 'from bson import Decimal128',
      javascript: `const {
  Decimal128
} = require('mongo');`
    }
  },
  {
    description: 'Single import Date',
    input: '{x: Date()}',
    output: {
      java: `import java.text.SimpleDateFormat;
import static com.mongodb.client.model.Filters.eq;`,
      csharp: `using MongoDB.Bson;
using MongoDB.Driver;
using System;`,
      python: 'import datetime',
      javascript: ''
    }
  },
  {
    description: 'Single import new Date',
    input: '{x: new Date()}',
    output: {
      java: 'import static com.mongodb.client.model.Filters.eq;',
      csharp: `using MongoDB.Bson;
using MongoDB.Driver;
using System;`,
      python: 'import datetime',
      javascript: ''
    }
  },
  {
    description: 'Single import ISODate',
    input: '{x: ISODate()}',
    js_input: '{x: new Date(1)}',
    output: {
      java: 'import static com.mongodb.client.model.Filters.eq;',
      csharp: `using MongoDB.Bson;
using MongoDB.Driver;
using System;`,
      python: 'import datetime',
      javascript: ''
    }
  },
  {
    description: 'Multiple imports',
    input: `{
      0: true, 1: 1, 2: NumberLong(100), 3: 0.001, 4: 0x1243, 5: 0o123,
      6: 10, 7: "str", 8: RegExp('10'), '8a': /abc/, 9: [1,2], 10: {x: 1}, 11: null,
      12: undefined, 100: Code("1", {x: 1}), '100a': Code("!"), 101: ObjectId(),
      103: DBRef("c", ObjectId()), 104: 1, 105: NumberInt(1), 106: NumberLong(1),
      107: MinKey(), 108: MaxKey(), 110: Timestamp(1, 100),
      111: Symbol('1'), 112: NumberDecimal(1), 200: Date(), '201a': new Date(),
      '201b': ISODate(), '201c': new ISODate()
    }`,
    js_input: `{
      0: true, 1: 1, 2: Long(1, 100), 3: 0.001, 4: 0x1243, 5: 0o123,
      6: 10, 7: "str", 8: RegExp('10'), '8a': /abc/, 9: [1,2], 10: {x: 1}, 11: null,
      12: undefined, 100: Code("1", {x: 1}), '100a': Code("!"), 101: ObjectId(),
      103: DBRef("c", ObjectId()), 104: Double(1), 105: Int32(1), 106: Long(1, 100),
      107: MinKey(), 108: MaxKey(), 110: Timestamp(1, 100),
      111: Symbol('1'), 112: Decimal128([1]), 200: Date(), '201a': new Date()
    }`,
    output: {
      java: `import java.util.regex.Pattern;
import java.util.Arrays;
import org.bson.Document;
import org.bson.BsonNull;
import org.bson.BsonUndefined;
import org.bson.types.Code;
import org.bson.types.ObjectId;
import com.mongodb.DBRef;
import org.bson.types.MinKey;
import org.bson.types.MaxKey;
import org.bson.types.BSONTimestamp;
import org.bson.types.Symbol;
import org.bson.types.Decimal128;
import org.bson.types.CodeWithScope;
import java.text.SimpleDateFormat;
import static com.mongodb.client.model.Filters.and;
import static com.mongodb.client.model.Filters.eq;`,
      csharp: `using MongoDB.Bson;
using MongoDB.Driver;
using System.Text.RegularExpressions;
using System;`,
      python: `import datetime
from bson import Code, ObjectId, DBRef, Int64, MinKey, MaxKey, Timestamp, Decimal128`,
      javascript: `const {
  Code,
  ObjectId,
  DBRef,
  Int32,
  Long,
  MinKey,
  MaxKey,
  Timestamp,
  Symbol,
  Decimal128
} = require('mongo');`
    }
  },
  {
    description: 'All filter builder imports',
    input: `[
  {
    $and: [{x: 1}],
    $expr: 1,
    all: {$all: [1,2]}, bitsAllClear: {$bitsAllClear: [1, 1]},
    bitsAllSet: {$bitsAllSet: [1, 1]}, bitsAnyClear: {$bitsAnyClear: [1, 1]},
    bitsAnySet: {$bitsAnySet: [1, 1]}, elemMatch: {$elemMatch: {x: 1}},
    eq: {$eq: 1}, exists: {$exists: true},
    gt: {$gt: 1}, gte: {$gte: 1}, lt: {$lt: 1}, lte: {$lte: 1}, in: {$in: [1, 2]},
    mod: {$mod: [1,2]}, ne: {$ne: 1}, nin: {$nin: [1, 2]},
    $nor: [{x: 1}, {y: 1}], not: {$not: {$eq: 1}}, $or: [{x: 1}, {y: 2}],
    regex: {$regex: 'abc', $options: 'c'}, size: {$size: 1},
    type: {$type: 'string'}, $where: '1',
    $text: {$search: '1'},
    x1: {$geoWithin: {$geometry: {type: "Point", coordinates: [1, 2]}}},
    x2: {$geoWithin: {$box: [ [1, 2], [3, 4] ]}},
    x3: {$geoWithin: {$polygon: [ [1, 2], [3, 4], [5, 6], [1, 2] ]}},
    x4: {$geoWithin: {$center: [ [1, 2], 5 ]}},
    x5: {$geoWithin: {$centerSphere: [ [1, 2], 5 ]}},
    x6: {$geoIntersects: {$geometry: {type: "Point", coordinates: [1, 2]}}},
    x7: {$near: {$geometry: {type: "Point", coordinates: [1, 2]}, $minDistance: 10, $maxDistance: 100}},
    x8: {$nearSphere: {$geometry: {type: "Point", coordinates: [1, 2]}, $minDistance: 10, $maxDistance: 100}}
  }
]`,
    output: {
      java: `import java.util.Arrays;
import static com.mongodb.client.model.Filters.all;
import static com.mongodb.client.model.Filters.and;
import static com.mongodb.client.model.Filters.bitsAllClear;
import static com.mongodb.client.model.Filters.bitsAllSet;
import static com.mongodb.client.model.Filters.bitsAnyClear;
import static com.mongodb.client.model.Filters.bitsAnySet;
import static com.mongodb.client.model.Filters.elemMatch;
import static com.mongodb.client.model.Filters.eq;
import static com.mongodb.client.model.Filters.exists;
import static com.mongodb.client.model.Filters.expr;
import static com.mongodb.client.model.Filters.geoIntersects;
import static com.mongodb.client.model.Filters.geoWithin;
import static com.mongodb.client.model.Filters.geoWithinBox;
import static com.mongodb.client.model.Filters.geoWithinCenter;
import static com.mongodb.client.model.Filters.geoWithinCenterSphere;
import static com.mongodb.client.model.Filters.geoWithinPolygon;
import static com.mongodb.client.model.Filters.gt;
import static com.mongodb.client.model.Filters.gte;
import static com.mongodb.client.model.Filters.in;
import static com.mongodb.client.model.Filters.lt;
import static com.mongodb.client.model.Filters.lte;
import static com.mongodb.client.model.Filters.mod;
import static com.mongodb.client.model.Filters.ne;
import static com.mongodb.client.model.Filters.near;
import static com.mongodb.client.model.Filters.nearSphere;
import static com.mongodb.client.model.Filters.nin;
import static com.mongodb.client.model.Filters.nor;
import static com.mongodb.client.model.Filters.not;
import static com.mongodb.client.model.Filters.or;
import static com.mongodb.client.model.Filters.regex;
import static com.mongodb.client.model.Filters.size;
import static com.mongodb.client.model.Filters.text;
import static com.mongodb.client.model.Filters.type;
import static com.mongodb.client.model.Filters.where;
import com.mongodb.client.model.geojson.Point;
import com.mongodb.client.model.geojson.Position;`
    }
  },
  {
    description: 'All agg builder imports',
    input: `[
  { $count: "field" },
  { $facet: { output1: [{ $match: {x: 1} }] } },
  { $graphLookup: {
      from: "collection",
      startWith: "$expr",
      connectFromField: "fromF",
      connectToField: "toF",
      as: "asF",
      maxDepth: 10,
      depthField: "depthF",
      restrictSearchWithMatch: { x: 1 } } },
  { $group: { _id: "idField" } },
  { $limit: 1 },
  { $lookup: {
       from: 'fromColl',
       localField: 'localF',
       foreignField: 'foreignF',
       as: 'outputF'
     } },
  { $match: {x: 1} },
  { $out: "coll" },
  { $project: { x: true, y: true, _id: 0 } },
  { $replaceRoot: { newRoot: { x: "newDoc" } } },
  { $sample: { size: 1 } },
  { $skip: 10 },
  { $sort: { x: 1, y: -1, z: { $meta: 'textScore' } } },
  { $sortByCount: "$expr" },
  { $unwind: "$field" }
]`,
    output: {
      java: `import java.util.Arrays;
import org.bson.Document;
import static com.mongodb.client.model.Filters.eq;
import static com.mongodb.client.model.Aggregates.count;
import static com.mongodb.client.model.Aggregates.facet;
import static com.mongodb.client.model.Aggregates.graphLookup;
import static com.mongodb.client.model.Aggregates.group;
import static com.mongodb.client.model.Aggregates.limit;
import static com.mongodb.client.model.Aggregates.lookup;
import static com.mongodb.client.model.Aggregates.match;
import static com.mongodb.client.model.Aggregates.out;
import static com.mongodb.client.model.Aggregates.project;
import static com.mongodb.client.model.Aggregates.replaceRoot;
import static com.mongodb.client.model.Aggregates.sample;
import static com.mongodb.client.model.Aggregates.skip;
import static com.mongodb.client.model.Aggregates.sort;
import static com.mongodb.client.model.Aggregates.sortByCount;
import static com.mongodb.client.model.Aggregates.unwind;
import static com.mongodb.client.model.Projections.excludeId;
import static com.mongodb.client.model.Projections.fields;
import static com.mongodb.client.model.Projections.include;
import static com.mongodb.client.model.Sorts.ascending;
import static com.mongodb.client.model.Sorts.descending;
import static com.mongodb.client.model.Sorts.metaTextScore;
import static com.mongodb.client.model.Sorts.orderBy;
import com.mongodb.client.model.Facet;
import com.mongodb.client.model.GraphLookupOptions;`
    }
  },
  {
    description: 'all geometry builder imports',
    input: `[
    {$geometry: {type: "Point", coordinates: [1, 2]}},
    {$geometry: {type: "MultiPoint", coordinates: [
        [1, 2],
        [3, 4],
        [5, 6]
      ]}},
    {$geometry: {type: "LineString", coordinates: [
        [1, 2],
        [3, 4],
        [5, 6]
      ]}},
    {$geometry: {type: "MultiLineString", coordinates: [
        [ [1, 2], [3, 4], [5, 6] ],
        [ [7, 8], [9, 10 ] ],
      ]}},
    {$geometry: {type: "Polygon", coordinates: [
        [ [1, 2], [3, 4], [5, 6], [1, 2] ],
        [ [7, 8], [9, 10], [9, 11], [7, 8] ],
        [ [9, 10], [11, 12], [11, 10], [9, 10] ]
      ]}},
    {$geometry: {type: "MultiPolygon", coordinates: [
        [
          [ [1, 2],  [3, 4],   [5, 6],   [1, 2] ]
        ],
        [
          [ [1, 2],  [3, 4],   [5, 6],   [1, 2] ],
          [ [7, 8],  [9, 10],  [9, 11],  [7, 8] ],
          [ [9, 10], [11, 12], [11, 10], [9, 10] ]
        ]
      ]}},
    {$geometry: {type: "GeometryCollection", coordinates: [
        {type: "Point", coordinates: [1, 2]},
        {type: "MultiPoint", coordinates: [[1, 2], [3, 4], [5, 6]]},
        {type: "LineString", coordinates: [[1, 2], [3, 4], [5, 6]]},
        {type: "MultiLineString", coordinates: [ [[1, 2], [3, 4], [5, 6]], [[7, 8], [9, 10]] ]},
        {type: "Polygon", coordinates: [[ [1, 2], [3, 4], [5, 6], [1, 2] ]]},
        {type: "MultiPolygon", coordinates: [
        [[ [1, 2],  [3, 4],   [5, 6],   [1, 2] ]],
        [
          [ [1, 2],  [3, 4],   [5, 6],   [1, 2] ],
          [ [7, 8],  [9, 10],  [9, 11],  [7, 8] ],
          [ [9, 10], [11, 12], [11, 10], [9, 10] ]
        ]]}]}}
]`,
    output: {
      java: `import java.util.Arrays;
import com.mongodb.client.model.geojson.GeometryCollection;
import com.mongodb.client.model.geojson.LineString;
import com.mongodb.client.model.geojson.MultiLineString;
import com.mongodb.client.model.geojson.MultiPoint;
import com.mongodb.client.model.geojson.MultiPolygon;
import com.mongodb.client.model.geojson.Point;
import com.mongodb.client.model.geojson.Polygon;
import com.mongodb.client.model.geojson.PolygonCoordinates;
import com.mongodb.client.model.geojson.Position;`
    }
  },
  {
    description: 'all accumulator builder imports',
    input: `[
  {x: {$sum: 1}},
  {x: {$avg: 1}},
  {x: {$first: 1}},
  {x: {$last: 1}},
  {x: {$max: 1}},
  {x: {$min: 1}},
  {x: {$push: 1}},
  {x: {$addToSet: 1}},
  {x: {$stdDevPop: 1}},
  {x: {$stdDevSamp: 1}}
]`,
    output: {
      java: `import java.util.Arrays;
import static com.mongodb.client.model.Accumulators.addToSet;
import static com.mongodb.client.model.Accumulators.avg;
import static com.mongodb.client.model.Accumulators.first;
import static com.mongodb.client.model.Accumulators.last;
import static com.mongodb.client.model.Accumulators.max;
import static com.mongodb.client.model.Accumulators.min;
import static com.mongodb.client.model.Accumulators.push;
import static com.mongodb.client.model.Accumulators.stdDevPop;
import static com.mongodb.client.model.Accumulators.stdDevSamp;
import static com.mongodb.client.model.Accumulators.sum;`
    }
  }
];

describe('imports', () => {
  for (const test of imports) {
    describe(`${test.description}`, () => {
      for (const lang of Object.keys(test.output)) {
        if (test.input) {
          it(`correct ${lang} imports from shell`, () => {
            compiler.shell[lang].compile(test.input);
            expect(
              compiler.shell[lang].getImports()
            ).to.equal(test.output[lang]);
          });
        }
        if (test.js_input && lang !== 'javascript') {
          it(`correct ${lang} imports from js`, () => {
            compiler.javascript[lang].compile(test.js_input);
            expect(
              compiler.javascript[lang].getImports()
            ).to.equal(test.output[lang]);
          });
        }
      }
    });
  }
});
