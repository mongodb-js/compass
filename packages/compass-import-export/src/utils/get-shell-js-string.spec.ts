import { ObjectId } from 'bson';
import { expect } from 'chai';

import {
  queryAsShellJSString,
  aggregationAsShellJSString,
} from './get-shell-js-string';

describe('#queryAsShellJSString', function () {
  it('supports simple query', function () {
    const ret = queryAsShellJSString({
      ns: 'lucas.pets',
      query: {
        filter: { name: 'Arlo' },
      },
    });
    const expected = `db.getCollection('pets').find({ name: 'Arlo' });`;
    expect(ret).to.equal(expected);
  });

  it('supports simple ObjectId', function () {
    const ret = queryAsShellJSString({
      ns: 'lucas.pets',
      query: {
        filter: { _id: new ObjectId('deadbeefdeadbeefdeadbeef') },
      },
    });
    const expected = `db.getCollection('pets').find({
  _id: ObjectId('deadbeefdeadbeefdeadbeef')
});`;
    expect(ret).to.equal(expected);
  });

  it('supports a projection', function () {
    const ret = queryAsShellJSString({
      ns: 'lucas.pets',
      query: {
        filter: { name: 'Arlo' },
        projection: { name: 1 },
      },
    });
    const expected = `db.getCollection('pets').find(
  { name: 'Arlo' },
  { name: 1 }
);`;
    expect(ret).to.equal(expected);
  });

  it('supports a skip', function () {
    const ret = queryAsShellJSString({
      ns: 'lucas.pets',
      query: {
        filter: { name: 'Arlo' },
        projection: { name: 1 },
        limit: 100,
      },
    });
    const expected = `db.getCollection('pets')
  .find({ name: 'Arlo' }, { name: 1 })
  .limit(100);`;

    expect(ret).to.equal(expected);
  });

  it('supports a limit', function () {
    const ret = queryAsShellJSString({
      ns: 'lucas.pets',
      query: {
        filter: { name: 'Arlo' },
        projection: { name: 1 },
        limit: 100,
        skip: 1,
      },
    });
    const expected = `db.getCollection('pets')
  .find({ name: 'Arlo' }, { name: 1 })
  .limit(100)
  .skip(1);`;

    expect(ret).to.equal(expected);
  });

  it('supports collation', function () {
    const ret = queryAsShellJSString({
      ns: 'lucas.pets',
      query: {
        filter: { name: 'Arlo' },
        collation: { locale: 'simple' },
        projection: { name: 1 },
        limit: 100,
        skip: 1,
      },
    });
    const expected = `db.getCollection('pets')
  .find({ name: 'Arlo' }, { name: 1 })
  .collation({ locale: 'simple' })
  .limit(100)
  .skip(1);`;

    expect(ret).to.equal(expected);
  });
});

// eslint-disable-next-line mocha/max-top-level-suites
describe('#aggregationAsShellJSString', function () {
  it('supports a simple aggregation', function () {
    const ret = aggregationAsShellJSString({
      ns: 'best.fruits',
      aggregation: {
        stages: [
          {
            $match: { name: 'Pineapple' },
          },
        ],
      },
    });
    const expected = `db.getCollection('fruits').aggregate([
  { $match: { name: 'Pineapple' } }
]);`;
    expect(ret).to.equal(expected);
  });

  it('supports ObjectId', function () {
    const ret = aggregationAsShellJSString({
      ns: 'best.fruits',
      aggregation: {
        stages: [
          {
            $match: { _id: new ObjectId('123412322123123123123123') },
          },
        ],
      },
    });
    const expected = `db.getCollection('fruits').aggregate([
  {
    $match: {
      _id: ObjectId('123412322123123123123123')
    }
  }
]);`;
    expect(ret).to.equal(expected);
  });

  it('supports a complex pipeline', function () {
    const ret = aggregationAsShellJSString({
      ns: 'best.fruits',
      aggregation: {
        stages: [
          {
            $collStats: {
              storageStats: {},
            },
          },
          {
            $addFields: {
              'storageStats.unscaledCollSize': {
                $multiply: [
                  {
                    $ifNull: ['$storageStats.avgObjSize', 0],
                  },
                  {
                    $ifNull: ['$storageStats.count', 0],
                  },
                ],
              },
              'storageStats.shard': '$shard',
            },
          },
          {
            $group: {
              _id: null,
              firstResult: {
                // Populate the root stats from the first shard's stats.
                $first: '$$ROOT',
              },
              shards: {
                $push: '$storageStats',
              },
              // Sum together the values from each shard.
              size: {
                $sum: '$storageStats.size',
              },
              count: {
                $sum: '$storageStats.count',
              },
              storageSize: {
                $sum: '$storageStats.storageSize',
              },
              totalIndexSize: {
                $sum: '$storageStats.totalIndexSize',
              },
              totalSize: {
                $sum: '$storageStats.totalSize',
              },
              maxSize: {
                $max: '$storageStats.maxSize',
              },
              // Add up the average object sizes so we can compute one.
              totalUnscaledCollSize: {
                $sum: '$storageStats.unscaledCollSize',
              },
              // Add up each indexes' size.
              allIndexSizes: {
                $push: '$storageStats.indexSizes',
              },
            },
          },
          {
            $replaceRoot: {
              newRoot: {
                stats: {
                  $mergeObjects: [
                    '$firstResult',
                    '$firstResult.storageStats',
                    {
                      // Override the first shard's values for
                      // stats with the summed stats.
                      shards: '$shards',
                      size: '$size',
                      count: '$count',
                      storageSize: '$storageSize',
                      totalIndexSize: '$totalIndexSize',
                      totalSize: '$totalSize',
                      maxSize: {
                        $ifNull: ['$maxSize', 0],
                      },
                      avgObjSize: {
                        $cond: [
                          {
                            $gt: ['$count', 0],
                          },
                          {
                            $divide: ['$totalUnscaledCollSize', '$count'],
                          },
                          0,
                        ],
                      },
                    },
                  ],
                },
                allIndexSizes: '$allIndexSizes',
              },
            },
          },
          {
            $unwind: {
              // Create an individual document for each index size.
              path: '$allIndexSizes',
            },
          },
          {
            $addFields: {
              indexSize: {
                $objectToArray: '$allIndexSizes',
              },
            },
          },
          {
            $unwind: {
              path: '$indexSize',
              // Some collections like `local.oplog.rs`
              // don't have indexes.
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $group: {
              _id: {
                indexName: '$indexSize.k',
              },
              indexSizeAmount: {
                $sum: '$indexSize.v',
              },
              stats: {
                $first: '$stats',
              },
            },
          },
          {
            $project: {
              _id: 0,
              indexSize: {
                $cond: {
                  if: {
                    $eq: ['$_id.indexName', null],
                  },
                  // Remove indexSize when there aren't any.
                  then: '$$REMOVE',
                  else: {
                    k: '$_id.indexName',
                    v: '$indexSizeAmount',
                  },
                },
              },
              stats: 1,
            },
          },
          {
            $group: {
              _id: null,
              indexSizesArray: {
                $addToSet: '$indexSize',
              },
              stats: {
                $first: '$stats',
              },
            },
          },
          {
            $replaceRoot: {
              newRoot: {
                $mergeObjects: [
                  '$stats',
                  {
                    indexSizes: {
                      $arrayToObject: '$indexSizesArray',
                    },
                    sharded: {
                      $ne: [
                        {
                          $ifNull: ['$stats.shard', false],
                        },
                        false,
                      ],
                    },
                    shardsArray: {
                      $map: {
                        input: '$stats.shards',
                        as: 'shardStats',
                        in: {
                          k: '$$shardStats.shard',
                          v: '$$shardStats',
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
          {
            $project: {
              // Remove temporary fields used in this pipeline.
              'shardsArray.v.shard': 0,
              'shardsArray.v.unscaledCollSize': 0,
            },
          },
          {
            $addFields: {
              shards: {
                $cond: {
                  if: {
                    $eq: ['$sharded', false],
                  },
                  // Remove shards when not sharded.
                  then: '$$REMOVE',
                  else: {
                    $arrayToObject: '$shardsArray',
                  },
                },
              },
            },
          },
          {
            $project: {
              storageStats: 0,
              shardsArray: 0,
              // Hide fields specific to the first shard.
              shard: 0,
              localTime: 0,
              host: 0,
              // Used to compute the scaled `avgObjSize`.
              unscaledCollSize: 0,
            },
          },
        ],
      },
    });
    const expected = `db.getCollection('fruits').aggregate([
  { $collStats: { storageStats: {} } },
  {
    $addFields: {
      'storageStats.unscaledCollSize': {
        $multiply: [
          {
            $ifNull: [
              '$storageStats.avgObjSize',
              0
            ]
          },
          { $ifNull: ['$storageStats.count', 0] }
        ]
      },
      'storageStats.shard': '$shard'
    }
  },
  {
    $group: {
      _id: null,
      firstResult: { $first: '$$ROOT' },
      shards: { $push: '$storageStats' },
      size: { $sum: '$storageStats.size' },
      count: { $sum: '$storageStats.count' },
      storageSize: {
        $sum: '$storageStats.storageSize'
      },
      totalIndexSize: {
        $sum: '$storageStats.totalIndexSize'
      },
      totalSize: {
        $sum: '$storageStats.totalSize'
      },
      maxSize: { $max: '$storageStats.maxSize' },
      totalUnscaledCollSize: {
        $sum: '$storageStats.unscaledCollSize'
      },
      allIndexSizes: {
        $push: '$storageStats.indexSizes'
      }
    }
  },
  {
    $replaceRoot: {
      newRoot: {
        stats: {
          $mergeObjects: [
            '$firstResult',
            '$firstResult.storageStats',
            {
              shards: '$shards',
              size: '$size',
              count: '$count',
              storageSize: '$storageSize',
              totalIndexSize: '$totalIndexSize',
              totalSize: '$totalSize',
              maxSize: {
                $ifNull: ['$maxSize', 0]
              },
              avgObjSize: {
                $cond: [
                  { $gt: ['$count', 0] },
                  {
                    $divide: [
                      '$totalUnscaledCollSize',
                      '$count'
                    ]
                  },
                  0
                ]
              }
            }
          ]
        },
        allIndexSizes: '$allIndexSizes'
      }
    }
  },
  { $unwind: { path: '$allIndexSizes' } },
  {
    $addFields: {
      indexSize: {
        $objectToArray: '$allIndexSizes'
      }
    }
  },
  {
    $unwind: {
      path: '$indexSize',
      preserveNullAndEmptyArrays: true
    }
  },
  {
    $group: {
      _id: { indexName: '$indexSize.k' },
      indexSizeAmount: { $sum: '$indexSize.v' },
      stats: { $first: '$stats' }
    }
  },
  {
    $project: {
      _id: 0,
      indexSize: {
        $cond: {
          if: { $eq: ['$_id.indexName', null] },
          then: '$$REMOVE',
          else: {
            k: '$_id.indexName',
            v: '$indexSizeAmount'
          }
        }
      },
      stats: 1
    }
  },
  {
    $group: {
      _id: null,
      indexSizesArray: {
        $addToSet: '$indexSize'
      },
      stats: { $first: '$stats' }
    }
  },
  {
    $replaceRoot: {
      newRoot: {
        $mergeObjects: [
          '$stats',
          {
            indexSizes: {
              $arrayToObject: '$indexSizesArray'
            },
            sharded: {
              $ne: [
                {
                  $ifNull: ['$stats.shard', false]
                },
                false
              ]
            },
            shardsArray: {
              $map: {
                input: '$stats.shards',
                as: 'shardStats',
                in: {
                  k: '$$shardStats.shard',
                  v: '$$shardStats'
                }
              }
            }
          }
        ]
      }
    }
  },
  {
    $project: {
      'shardsArray.v.shard': 0,
      'shardsArray.v.unscaledCollSize': 0
    }
  },
  {
    $addFields: {
      shards: {
        $cond: {
          if: { $eq: ['$sharded', false] },
          then: '$$REMOVE',
          else: { $arrayToObject: '$shardsArray' }
        }
      }
    }
  },
  {
    $project: {
      storageStats: 0,
      shardsArray: 0,
      shard: 0,
      localTime: 0,
      host: 0,
      unscaledCollSize: 0
    }
  }
]);`;
    expect(ret).to.equal(expected);
  });

  it('displays aggregation options', function () {
    const ret = aggregationAsShellJSString({
      ns: 'best.fruits',
      aggregation: {
        stages: [
          {
            $match: { _id: new ObjectId('123412322123123123123123') },
          },
        ],
        options: {
          maxTimeMS: 2000,
          allowDiskUse: true,
        },
      },
    });
    const expected = `db.getCollection('fruits').aggregate(
  [
    {
      $match: {
        _id: ObjectId('123412322123123123123123')
      }
    }
  ],
  { maxTimeMS: 2000, allowDiskUse: true }
);`;
    expect(ret).to.equal(expected);
  });
});
