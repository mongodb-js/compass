const chai = require('chai');
const expect = chai.expect;
const compiler = require('..');

const filterOperators = {
  unknown_op: [
    {
      input: '{$notAnOp: {x: 1}}',
      output: 'eq("$notAnOp", eq("x", 1L))'
    }
  ],
  eq: [
    {
      input: '{x: {y: {z: 1}}}',
      output: 'eq("x", eq("y", eq("z", 1L)))'
    },
    {
      input: '{x: {$eq: {y: {z: 1}}}}',
      output: 'eq("x", eq("y", eq("z", 1L)))'
    }
  ],
  gt: [
    {
      input: '{x: {$gt: 1}}',
      output: 'gt("x", 1L)'
    }
  ],
  lt: [
    {
      input: '{x: {$lt: 1}}',
      output: 'lt("x", 1L)'
    }
  ],
  gte: [
    {
      input: '{x: {$gte: 1}}',
      output: 'gte("x", 1L)'
    }
  ],
  lte: [
    {
      input: '{x: {$lte: 1}}',
      output: 'lte("x", 1L)'
    }
  ],
  ne: [
    {
      input: '{x: {$ne: 1}}',
      output: 'ne("x", 1L)'
    }
  ],
  in: [
    {
      input: '{x: {$in: [1]}}',
      output: 'in("x", Arrays.asList(1L))'
    },
    {
      input: '{x: {$in: [1, 2]}}',
      output: 'in("x", Arrays.asList(1L, 2L))'
    }
  ],
  nin: [
    {
      input: '{x: {$nin: [1]}}',
      output: 'nin("x", Arrays.asList(1L))'
    },
    {
      input: '{x: {$nin: [1, 2]}}',
      output: 'nin("x", Arrays.asList(1L, 2L))'
    }
  ],
  and: [
    {
      input: '{x: 1, y: 2}',
      output: 'and(eq("x", 1L), eq("y", 2L))'
    }
  ],
  or: [
    {
      input: '{$or: [{x: 1}, {z: 2}, {e: 1}]}',
      output: 'or(Arrays.asList(eq("x", 1L), eq("z", 2L), eq("e", 1L)))'
    }
  ],
  not: [
    {
      input: '{x: {$not: {$eq: 1}}}',
      output: 'not(eq("x", 1L))'
    },
    {
      input: '{x: {$not: {$exists: [1, 2]} }  }',
      output: 'not(exists("x", Arrays.asList(1L, 2L)))'
    }
  ],
  nor: [
    {
      input: '{$nor: [{x: 1}, {z: 2}, {e: 1}]}',
      output: 'nor(Arrays.asList(eq("x", 1L), eq("z", 2L), eq("e", 1L)))'
    }
  ],
  all: [
    {
      input: '{x: {$all: ["v1", "v2", "v3"]}}',
      output: 'all("x", Arrays.asList("v1", "v2", "v3"))'
    }
  ],
  bitsAllSet: [
    {
      input: '{x: {$bitsAllSet: 100}}',
      output: 'bitsAllSet("x", 100L)'
    }
  ],
  bitsAllClear: [
    {
      input: '{x: {$bitsAllClear: 100}}',
      output: 'bitsAllClear("x", 100L)'
    }
  ],
  bitsAnySet: [
    {
      input: '{x: {$bitsAnySet: 100}}',
      output: 'bitsAnySet("x", 100L)'
    }
  ],
  bitsAnyClear: [
    {
      input: '{x: {$bitsAnyClear: 100}}',
      output: 'bitsAnyClear("x", 100L)'
    }
  ],
  elemMatch: [
    {
      input: '{x: {$elemMatch: {x: 1, y: 2}}}',
      output: 'elemMatch("x", and(eq("x", 1L), eq("y", 2L)))'
    }
  ],
  size: [
    {
      input: '{x: {$size: 1}}',
      output: 'size("x", 1L)'
    }
  ],
  exists: [
    {
      input: '{x: {$exists: true}}',
      output: 'exists("x", true)'
    },
    {
      input: '{x: {$exists: false}}',
      output: 'exists("x", false)'
    }
  ],
  type: [
    {
      input: '{x: {$type: "number"} }',
      output: 'type("x", "number")'
    }
  ],
  mod: [
    {
      input: '{x: {$mod: [10, 2]}}',
      output: 'mod("x", 10L, 2L)'
    }
  ],
  regex: [
    {
      input: '{x: {$regex: "abc"}}',
      output: 'regex("x", "abc")'
    },
    {
      input: '{x: {$regex: "abc", $options: "g"}}',
      output: 'regex("x", "abc", "g")'
    }
  ],
  text: [
    {
      input: '{x: {$text: {$search: "searchstring"}}}',
      output: 'eq("x", text("searchstring"))'
    },
    {
      input: `{x: {$text: {
        $search: "searchstring",
        $language: "lang",
        $caseSensitive: true,
        $diacriticSensitive: true}}}`,
      output: 'eq("x", text("searchstring", new TextSearchOptions().language("lang").caseSensitive(true).diacriticSensitive(true)))'
    }
  ],
  where: [
    {
      input: '{x: {$where: function() { $x === true }}}',
      output: 'eq("x", where("function(){$x===true}"))'
    }
  ],
  geometry: [
    {
      input: '{$geometry: {type: "Point", coordinates: [1, 2]}}', // 1 position
      output: 'new Point(new Position(1L, 2L))'
    },
    {
      input: `{$geometry: {type: "MultiPoint", coordinates: [
        [1, 2],
        [3, 4],
        [5, 6]
      ]}}`, // Array of 1+ positions
      output: 'new MultiPoint(Arrays.asList(new Position(1L, 2L), new Position(3L, 4L), new Position(5L, 6L)))'
    },
    {
      input: `{$geometry: {type: "LineString", coordinates: [
        [1, 2],
        [3, 4],
        [5, 6]
      ]}}`, // Array of 2+ positions
      output: 'new LineString(Arrays.asList(new Position(1L, 2L), new Position(3L, 4L), new Position(5L, 6L)))'
    },
    {
      input: `{$geometry: {type: "MultiLineString", coordinates: [
        [ [1, 2], [3, 4], [5, 6] ],
        [ [7, 8], [9, 10 ] ],
      ]}}`, // Array of 1+ arrays of 2+ positions
      output: 'new MultiLineString(Arrays.asList(' +
          'Arrays.asList(new Position(1L, 2L), new Position(3L, 4L), new Position(5L, 6L)), ' +
          'Arrays.asList(new Position(7L, 8L), new Position(9L, 10L))' +
        '))'
    },
    {
      input: `{$geometry: {type: "Polygon", coordinates: [
        [ [1, 2], [3, 4], [5, 6], [1, 2] ],
        [ [7, 8], [9, 10], [9, 11], [7, 8] ],
        [ [9, 10], [11, 12], [11, 10], [9, 10] ]
      ]}}`, // 1 outer ring (array of 4+ positions), plus 0+ inner rings (array of 4+ positions)
      output: 'new Polygon(new PolygonCoordinates(' +
      'Arrays.asList(new Position(1L, 2L), new Position(3L, 4L), new Position(5L, 6L), new Position(1L, 2L)), ' +
      'Arrays.asList(new Position(7L, 8L), new Position(9L, 10L), new Position(9L, 11L), new Position(7L, 8L)), ' +
      'Arrays.asList(new Position(9L, 10L), new Position(11L, 12L), new Position(11L, 10L), new Position(9L, 10L))' +
      '))'
    },
    {
      input: `{$geometry: {type: "Polygon", coordinates: [
        [ [1, 2], [3, 4], [5, 6], [1, 2] ]
      ]}}`, // 1 outer ring (array of 3+ positions) without any inner rings
      output: 'new Polygon(new PolygonCoordinates(' +
        'Arrays.asList(new Position(1L, 2L), new Position(3L, 4L), new Position(5L, 6L), new Position(1L, 2L))' +
      '))'
    },
    {
      input: `{$geometry: {type: "MultiPolygon", coordinates: [
        [
          [ [1, 2],  [3, 4],   [5, 6],   [1, 2] ]
        ],
        [
          [ [1, 2],  [3, 4],   [5, 6],   [1, 2] ],
          [ [7, 8],  [9, 10],  [9, 11],  [7, 8] ],
          [ [9, 10], [11, 12], [11, 10], [9, 10] ]
        ]
      ]}}`, // Array of Polygons

      output: 'new MultiPolygon(' +
        'Arrays.asList(' +
          'new PolygonCoordinates(' +
            'Arrays.asList(new Position(1L, 2L), new Position(3L, 4L), new Position(5L, 6L), new Position(1L, 2L))' +
          '), ' +
          'new PolygonCoordinates(' +
            'Arrays.asList(new Position(1L, 2L), new Position(3L, 4L), new Position(5L, 6L), new Position(1L, 2L)), ' +
            'Arrays.asList(new Position(7L, 8L), new Position(9L, 10L), new Position(9L, 11L), new Position(7L, 8L)), ' +
            'Arrays.asList(new Position(9L, 10L), new Position(11L, 12L), new Position(11L, 10L), new Position(9L, 10L))' +
          ')' +
         ')' +
      ')'
    },
    {
      input: `{$geometry: {type: "GeometryCollection", coordinates: [
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
        ]]}]}}`,
      output: 'new GeometryCollection(Arrays.asList(' +
      'new Point(new Position(1L, 2L)), ' +
      'new MultiPoint(Arrays.asList(new Position(1L, 2L), new Position(3L, 4L), new Position(5L, 6L))), ' +
      'new LineString(Arrays.asList(new Position(1L, 2L), new Position(3L, 4L), new Position(5L, 6L))), ' +
      'new MultiLineString(Arrays.asList(' +
        'Arrays.asList(new Position(1L, 2L), new Position(3L, 4L), new Position(5L, 6L)), ' +
        'Arrays.asList(new Position(7L, 8L), new Position(9L, 10L)))), ' +
      'new Polygon(new PolygonCoordinates(Arrays.asList(new Position(1L, 2L), new Position(3L, 4L), new Position(5L, 6L), new Position(1L, 2L)))), ' +
      'new MultiPolygon(Arrays.asList(' +
        'new PolygonCoordinates(Arrays.asList(new Position(1L, 2L), new Position(3L, 4L), new Position(5L, 6L), new Position(1L, 2L))), ' +
        'new PolygonCoordinates(' +
          'Arrays.asList(new Position(1L, 2L), new Position(3L, 4L), new Position(5L, 6L), new Position(1L, 2L)), ' +
          'Arrays.asList(new Position(7L, 8L), new Position(9L, 10L), new Position(9L, 11L), new Position(7L, 8L)), ' +
          'Arrays.asList(new Position(9L, 10L), new Position(11L, 12L), new Position(11L, 10L), new Position(9L, 10L))' +
      ')))))'
    }
  ],
  geoWithin: [
    {
      input: '{x: {$geoWithin: {$geometry: {type: "Point", coordinates: [1, 2]}}}}',
      output: 'geoWithin("x", new Point(new Position(1L, 2L)))'
    }
  ],
  geoWithinBox: [
    {
      input: '{x: {$geoWithin: {$box: [ [1, 2], [3, 4] ]}}}',
      output: 'geoWithinBox("x", 1L, 2L, 3L, 4L)'
    }
  ],
  geoWithinPolygon: [
    {
      input: '{x: {$geoWithin: {$polygon: [ [1, 2], [3, 4], [5, 6], [1, 2] ]}}}',
      output: 'geoWithinPolygon("x", Arrays.asList(Arrays.asList(1L, 2L), Arrays.asList(3L, 4L), Arrays.asList(5L, 6L), Arrays.asList(1L, 2L)))'
    }
  ],
  geoWithinCenter: [
    {
      input: '{x: {$geoWithin: {$center: [ [1, 2], 5 ]}}}',
      output: 'geoWithinCenter("x", 1L, 2L, 5L)'
    }
  ],
  geoWithinCenterSphere: [
    {
      input: '{x: {$geoWithin: {$centerSphere: [ [1, 2], 5 ]}}}',
      output: 'geoWithinCenterSphere("x", 1L, 2L, 5L)'
    }
  ],
  geoIntersects: [
    {
      input: '{x: {$geoIntersects: {$geometry: {type: "Point", coordinates: [1, 2]}}}}',
      output: 'geoIntersects("x", new Point(new Position(1L, 2L)))'
    }
  ],
  near: [
    {
      input: '{x: {$near: {$geometry: {type: "Point", coordinates: [1, 2]}, $minDistance: 10, $maxDistance: 100}}}',
      output: 'near("x", new Point(new Position(1L, 2L)), 100L, 10L)'
    }
  ],
  nearSphere: [
    {
      input: '{x: {$nearSphere: {$geometry: {type: "Point", coordinates: [1, 2]}, $minDistance: 10, $maxDistance: 100}}}',
      output: 'nearSphere("x", new Point(new Position(1L, 2L)), 100L, 10L)'
    }
  ]
};

const accumulatorOperators = {
  sum: [
    {
      input: '{x: {$sum: 1}}',
      output: 'sum("x", 1L)'
    }
  ],
  avg: [
    {
      input: '{x: {$avg: 1}}',
      output: 'avg("x", 1L)'
    }
  ],
  first: [
    {
      input: '{x: {$first: 1}}',
      output: 'first("x", 1L)'
    }
  ],
  last: [
    {
      input: '{x: {$last: 1}}',
      output: 'last("x", 1L)'
    }
  ],
  max: [
    {
      input: '{x: {$max: 1}}',
      output: 'max("x", 1L)'
    }
  ],
  min: [
    {
      input: '{x: {$min: 1}}',
      output: 'min("x", 1L)'
    }
  ],
  push: [
    {
      input: '{x: {$push: 1}}',
      output: 'push("x", 1L)'
    }
  ],
  addToSet: [
    {
      input: '{x: {$addToSet: 1}}',
      output: 'addToSet("x", 1L)'
    }
  ],
  stdDevPop: [
    {
      input: '{x: {$stdDevPop: 1}}',
      output: 'stdDevPop("x", 1L)'
    }
  ],
  stdDevSamp: [
    {
      input: '{x: {$stdDevSamp: 1}}',
      output: 'stdDevSamp("x", 1L)'
    }
  ]
};

const aggOperators = {
  match: [
    {
      input: '{ $match: {x: 1} }',
      output: 'match(eq("x", 1L))'
    },
    {
      input: '{ $match: {x: 1, y: 2} }',
      output: 'match(and(eq("x", 1L), eq("y", 2L)))'
    }
  ],
  project: [
    {
      input: '{ $project: { z: 1 } }',
      output: 'project(include("z"))'
    },
    {
      input: '{ $project: { z: 1 , y: true} }',
      output: 'project(include("z", "y"))'
    },
    {
      input: '{ $project: { z: false } }',
      output: 'project(exclude("z"))'
    },
    {
      input: '{ $project: { z: 1, y: false } }',
      output: 'project(fields(include("z"), exclude("y")))'
    },
    {
      input: '{ $project: { _id: 0 } }',
      output: 'project(excludeId())'
    },
    {
      input: '{ $project: { x: true, y: false, _id: 0 } }',
      output: 'project(fields(include("x"), exclude("y"), excludeId()))'
    },
    {
      input: '{ $project: { z: { a: 9 } } }',
      output: 'project(computed("z", eq("a", 9L)))'
    },
    {
      input: '{ $project: { z: "$z"} }',
      output: 'project(computed("z", "$z"))'
    }
    // TODO: ElemMatch + Slice
  ],
  sample: [
    {
      input: '{ $sample: { size: 1 } }',
      output: 'sample(1L)'
    }
  ],
  sort: [
    {
      input: '{ $sort: { x: 1, y: -1 } }',
      output: 'sort(orderBy(ascending("x"), descending("y")))'
    },
    {
      input: '{ $sort: { x: 1, y: -1, z: { $meta: "textScore" } } }',
      output: 'sort(orderBy(ascending("x"), descending("y"), metaTextScore("z")))'
    },
    {
      input: '{ $sort: { x: 1, y: -1, z: { \'$meta\': "textScore" } } }',
      output: 'sort(orderBy(ascending("x"), descending("y"), metaTextScore("z")))'
    },
    {
      input: '{ $sort: { x: 1, y: -1, z: { \"$meta\": "textScore" } } }',
      output: 'sort(orderBy(ascending("x"), descending("y"), metaTextScore("z")))'
    },
    {
      input: '{ $sort: { x: 1, y: -1, z: { $meta: \'textScore\' } } }',
      output: 'sort(orderBy(ascending("x"), descending("y"), metaTextScore("z")))'
    }
  ],
  skip: [
    {
      input: '{ $skip: 10 }',
      output: 'skip(10L)'
    }
  ],
  limit: [
    {
      input: '{ $limit: 1 }',
      output: 'limit(1L)'
    }
  ],
  lookup: [
    {
      input: `{ $lookup: {
       from: 'fromColl',
       localField: 'localF',
       foreignField: 'foreignF',
       as: 'outputF'
     } }`,
      output: 'lookup("fromColl", "localF", "foreignF", "outputF")'
    }
  ],
  group: [
    {
      input: '{ $group: { _id: "idField" } }',
      output: 'group("idField")'
    },
    {
      input: '{ $group: { _id: "idField", total: { $sum: "$idField" }, average: { $avg: "$idField" } } }',
      output: 'group("idField", sum("total", "$idField"), avg("average", "$idField"))'
    }
  ],
  unwind: [
    {
      input: '{ $unwind: "$field" }',
      output: 'unwind("$field")'
    },
    {
      input: '{ $unwind: { path: "$field"} }',
      output: 'unwind("$field")'
    },
    {
      input: '{ $unwind: { path: "$field", includeArrayIndex: "element" } }',
      output: 'unwind("$field", new UnwindOptions().includeArrayIndex("element"))'
    },
    {
      input: '{ $unwind: { path: "$field", includeArrayIndex: "element", preserveNullAndEmptyArrays: true } }',
      output: 'unwind("$field", new UnwindOptions().includeArrayIndex("element").preserveNullAndEmptyArrays(true))'
    }
  ],
  out: [
    {
      input: '{ $out: "coll" }',
      output: 'out("coll")'
    }
  ],
  graphLookup: [
    {
      input: `{ $graphLookup: {
      from: "collection",
      startWith: "$expr",
      connectFromField: "fromF",
      connectToField: "toF",
      as: "asF" } }`,
      output: 'graphLookup("collection", "$expr", "fromF", "toF", "asF")'
    },
    {
      input: `{ $graphLookup: {
      from: "collection",
      startWith: "$expr",
      connectFromField: "fromF",
      connectToField: "toF",
      as: "asF",
      maxDepth: 10,
      depthField: "depthF",
      restrictSearchWithMatch: { x: 1 } } }`,
      output: 'graphLookup("collection", "$expr", "fromF", "toF", "asF", new GraphLookupOptions().maxDepth(10L).depthField("depthF").restrictSearchWithMatch(eq("x", 1L)))'
    }
  ],
  sortByCount: [
    {
      input: '{ $sortByCount: "$expr" }',
      output: 'sortByCount("$expr")'
    },
    {
      input: '{ $sortByCount: { "$floor": "$x" } }',
      output: 'sortByCount(eq("$floor", "$x"))'
    }
  ],
  replaceRoot: [
    {
      input: '{ $replaceRoot: { newRoot: { x: "newDoc" } } }',
      output: 'replaceRoot(new Document("x", "newDoc"))'
    }
  ],
  addFields: [
    {
      input: '{ $addFields: { x: 1, y: {z: 2} } }',
      output: 'addFields(new Field("x", 1L), new Field("y", new Document("z", 2L)))'
    }
  ],
  count: [
    {
      input: '{ $count: "field" }',
      output: 'count("field")'
    }
  ],
  bucket: [
    {
      input: `{ $bucket: {
      groupBy: '$expr',
      boundaries: [ 0, 10, 20 ],
      } }`,
      output: 'bucket("$expr", Arrays.asList(0L, 10L, 20L))'
    },
    {
      input: `{ $bucket: {
      groupBy: '$expr',
      boundaries: [ 0, 10, 20 ],
      output: {
         "output1": { $sum: 1 },
      } } }`,
      output: 'bucket("$expr", Arrays.asList(0L, 10L, 20L), new BucketOptions().output(sum("output1", 1L)))'
    },
    {
      input: `{ $bucket: {
      groupBy: '$expr',
      boundaries: [ 0, 10, 20 ],
      default: "default",
      output: {
         "output1": { $sum: 1 },
      } } }`,
      output: 'bucket("$expr", Arrays.asList(0L, 10L, 20L), new BucketOptions().defaultBucket("default").output(sum("output1", 1L)))'
    }
  ],
  bucketAuto: [
    {
      input: `{ $bucketAuto: {
      groupBy: "$expr",
      buckets: 88 } }`,
      output: 'bucketAuto("$expr", 88L)'
    },
    {
      input: `{ $bucketAuto: {
      groupBy: "$expr",
      buckets: 88,
      output: {
         "output1": { $sum: 1 },
      },
      granularity: "POWERSOF2" }}`,
      output: 'bucketAuto("$expr", 88L, new BucketAutoOptions().output(sum("output1", 1L)).granularity(BucketGranularity.fromString("POWERSOF2")))'
    }
  ],
  facet: [
    {
      input: '{ $facet: { output1: [{ $match: {x: 1} }] } }',
      output: 'facet(new Facet("output1", Arrays.asList(match(eq("x", 1L)))))'
    },
    {
      input: '{ $facet: { output1: [{ $match: {x: 1} }], output2: [{$sample: {size: 10} }] } }',
      output: 'facet(new Facet("output1", Arrays.asList(match(eq("x", 1L)))), new Facet("output2", Arrays.asList(sample(10L))))'
    }
  ],
  // These agg ops don't have builders
  collStats: [
    {
      input: '{ $collStats: { latencyStats: { histograms: true } } }',
      output: 'eq("$collStats", eq("latencyStats", eq("histograms", true)))'
    }
  ],
  currentOp: [
    {
      input: '{ $currentOp : { allUsers: true, idleSessions: true } }',
      output: 'eq("$currentOp", and(eq("allUsers", true), eq("idleSessions", true)))'
    }
  ],
  geoNear: [
    {
      input: '',
      output: ''
    }
  ],
  indexStats: [
    {
      input: '{ $indexStats: { } }',
      output: 'eq("$indexStats", new Document())'
    }
  ],
  listLocalSessions: [
    {
      input: '{ $listLocalSessions: { allUsers: true } }',
      output: 'eq("$listLocalSessions", eq("allUsers", true))'
    }
  ],
  listSessions: [
    {
      input: '{ $listSessions: { allUsers: true } }',
      output: 'eq("$listSessions", eq("allUsers", true))'
    }
  ],
  redact: [
    {
      input: '{\n' +
      '      $redact: {\n' +
      '        $cond: {\n' +
      '          if: { $eq: [ "$level", 5 ] },\n' +
      '          then: "$$PRUNE",\n' +
      '          else: "$$DESCEND"\n' +
      '        }\n' +
      '      }\n' +
      '    }',
      output: 'eq("$redact", eq("$cond", and(eq("if", Arrays.asList("$level", 5L)), eq("then", "$$PRUNE"), eq("else", "$$DESCEND"))))'
    }
  ]
};

describe('Java Builders', () => {
  describe('The default', () => {
    it('is non-idiomatic', () => {
      expect(compiler.javascript.java('{x: 1}')).to.equal(
        'new Document("x", 1L)'
      );
    });
  });
  describe('non-operator fields', () => {
    it('single non-operator field', () => {
      expect(compiler.javascript.java('{x: 1}', true)).to.equal('eq("x", 1L)');
    });
    it('two non-operator fields uses and(...)', () => {
      expect(compiler.javascript.java('{x: 1, y: 2}', true)).to.equal(
        'and(eq("x", 1L), eq("y", 2L))');
    });
    it('five non-operator fields uses and(...)', () => {
      expect(compiler.javascript.java('{x: 1, y: 2, z: 3, q: 4, r: 5}', true)).to.equal(
        'and(eq("x", 1L), eq("y", 2L), eq("z", 3L), eq("q", 4L), eq("r", 5L))'
      );
    });
  });
  describe('non-operator nested fields', () => {
    it('single nested document', () => {
      expect(compiler.javascript.java('{x: {y: 2}}', true)).to.equal(
        'eq("x", eq("y", 2L))'
      );
    });
    it('multiple nested documents', () => {
      expect(compiler.javascript.java('{x: {y: 2}, z: {q: {r: 5}}}', true)).to.equal(
        'and(eq("x", eq("y", 2L)), eq("z", eq("q", eq("r", 5L))))'
      );
    });
  });
  describe('agg operators', () => {
    for (const key of Object.keys(aggOperators)) {
      describe(`${key}`, () => {
        for (const test of aggOperators[key]) {
          it(`${test.input} equals expected`, () => {
            expect(compiler.javascript.java(test.input, true)).to.equal(test.output);
          });
        }
      });
    }
  });
  describe('filter operators', () => {
    for (const key of Object.keys(filterOperators)) {
      describe(`${key}`, () => {
        for (const test of filterOperators[key]) {
          it(`${test.input} equals expected`, () => {
            expect(compiler.javascript.java(test.input, true)).to.equal(test.output);
          });
        }
      });
    }
  });
  describe('accumulator operators', () => {
    for (const key of Object.keys(accumulatorOperators)) {
      describe(`${key}`, () => {
        for (const test of accumulatorOperators[key]) {
          it(`${test.input} equals expected`, () => {
            expect(compiler.javascript.java(test.input, true)).to.equal(test.output);
          });
        }
      });
    }
  });
});
