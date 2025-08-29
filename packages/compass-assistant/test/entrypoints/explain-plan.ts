import { buildExplainPlanPrompt } from '../../src/prompts';
import type { SimpleEvalCase } from '../assistant.eval';

type ExplainCase = {
  name: string;
  // Note that most of these are optional for now. They are handy in case you
  // want to test to see how much difference it makes.
  indexes?: string;
  query?: string;
  aggregation?: string;
  schema?: string;
  explainPlan: string;
  expected: string;
  expectedsources: string[];
};

const explainCases: ExplainCase[] = [
  {
    name: 'E1',
    indexes: `
// Required index
{
  "mappings": {
    "dynamic": false,
    "fields": {
      "name": {
        "type": "string"
      },
      "description": {
        "type": "string"
      },
      "amenities": {
        "type": "string"
      }
    }
  }
}
    `,
    aggregation: `
// Pipeline
db.listingsAndReviews.aggregate([
  {
    $search: {
      "index": "airbnb_search_index",
      "text": {
        "query": "pool wifi kitchen",
        "path": ["name", "description", "amenities"]
      }
    }
  },
  {
    $match: {
      "price": { $gte: 50, $lte: 300 },
      "accommodates": { $gte: 2 }
    }
  },
  {
    $group: {
      "_id": "$property_type",
      "avg_price": { $avg: "$price" },
      "count": { $sum: 1 },
      "max_accommodates": { $max: "$accommodates" }
    }
  },
  {
    $sort: { "avg_price": -1 }
  },
  {
    $project: {
      "_id": 0,
      "name": 1,
    }
  }
])
    `,
    explainPlan: `
{
  "explainVersion": "1",
  "stages": [
    {
      "$_internalSearchMongotRemote": {
        "mongotQuery": {
          "index": "airbnb_search_index",
          "text": {
            "query": "pool wifi kitchen",
            "path": [
              "name",
              "description",
              "amenities"
            ]
          }
        },
        "explain": {
          "query": {
            "type": "BooleanQuery",
            "args": {
              "must": [],
              "mustNot": [],
              "should": [
                {
                  "type": "TermQuery",
                  "args": {
                    "path": "amenities",
                    "value": "wifi"
                  },
                  "stats": {
                    "context": {
                      "millisElapsed": 0.037061,
                      "invocationCounts": {
                        "createWeight": 1,
                        "createScorer": 6
                      }
                    },
                    "match": {
                      "millisElapsed": 1.296923,
                      "invocationCounts": {
                        "nextDoc": 5310
                      }
                    },
                    "score": {
                      "millisElapsed": 1.169994,
                      "invocationCounts": {
                        "score": 5308
                      }
                    }
                  }
                },
                {
                  "type": "TermQuery",
                  "args": {
                    "path": "amenities",
                    "value": "pool"
                  },
                  "stats": {
                    "context": {
                      "millisElapsed": 0.034862,
                      "invocationCounts": {
                        "createWeight": 1,
                        "createScorer": 6
                      }
                    },
                    "match": {
                      "millisElapsed": 0.195526,
                      "invocationCounts": {
                        "nextDoc": 822
                      }
                    },
                    "score": {
                      "millisElapsed": 0.192705,
                      "invocationCounts": {
                        "score": 820
                      }
                    }
                  }
                },
                {
                  "type": "TermQuery",
                  "args": {
                    "path": "name",
                    "value": "pool"
                  },
                  "stats": {
                    "context": {
                      "millisElapsed": 0.149667,
                      "invocationCounts": {
                        "createWeight": 1,
                        "createScorer": 6
                      }
                    },
                    "match": {
                      "millisElapsed": 0.05332,
                      "invocationCounts": {
                        "nextDoc": 68
                      }
                    },
                    "score": {
                      "millisElapsed": 0.025424,
                      "invocationCounts": {
                        "score": 66
                      }
                    }
                  }
                },
                {
                  "type": "TermQuery",
                  "args": {
                    "path": "description",
                    "value": "wifi"
                  },
                  "stats": {
                    "context": {
                      "millisElapsed": 0.040017,
                      "invocationCounts": {
                        "createWeight": 1,
                        "createScorer": 6
                      }
                    },
                    "match": {
                      "millisElapsed": 0.218163,
                      "invocationCounts": {
                        "nextDoc": 911
                      }
                    },
                    "score": {
                      "millisElapsed": 0.207362,
                      "invocationCounts": {
                        "score": 909
                      }
                    }
                  }
                },
                {
                  "type": "TermQuery",
                  "args": {
                    "path": "name",
                    "value": "kitchen"
                  },
                  "stats": {
                    "context": {
                      "millisElapsed": 0.037941,
                      "invocationCounts": {
                        "createWeight": 1,
                        "createScorer": 6
                      }
                    },
                    "match": {
                      "millisElapsed": 0.012717,
                      "invocationCounts": {
                        "nextDoc": 37
                      }
                    },
                    "score": {
                      "millisElapsed": 0.025813,
                      "invocationCounts": {
                        "score": 35
                      }
                    }
                  }
                },
                {
                  "type": "TermQuery",
                  "args": {
                    "path": "description",
                    "value": "pool"
                  },
                  "stats": {
                    "context": {
                      "millisElapsed": 0.049854,
                      "invocationCounts": {
                        "createWeight": 1,
                        "createScorer": 6
                      }
                    },
                    "match": {
                      "millisElapsed": 0.134539,
                      "invocationCounts": {
                        "nextDoc": 486
                      }
                    },
                    "score": {
                      "millisElapsed": 0.112059,
                      "invocationCounts": {
                        "score": 484
                      }
                    }
                  }
                },
                {
                  "type": "TermQuery",
                  "args": {
                    "path": "description",
                    "value": "kitchen"
                  },
                  "stats": {
                    "context": {
                      "millisElapsed": 0.040328,
                      "invocationCounts": {
                        "createWeight": 1,
                        "createScorer": 6
                      }
                    },
                    "match": {
                      "millisElapsed": 0.450222,
                      "invocationCounts": {
                        "nextDoc": 2203
                      }
                    },
                    "score": {
                      "millisElapsed": 0.504127,
                      "invocationCounts": {
                        "score": 2201
                      }
                    }
                  }
                },
                {
                  "type": "TermQuery",
                  "args": {
                    "path": "name",
                    "value": "wifi"
                  },
                  "stats": {
                    "context": {
                      "millisElapsed": 0.037407,
                      "invocationCounts": {
                        "createWeight": 1,
                        "createScorer": 6
                      }
                    },
                    "match": {
                      "millisElapsed": 0.024487,
                      "invocationCounts": {
                        "nextDoc": 60
                      }
                    },
                    "score": {
                      "millisElapsed": 0.022355,
                      "invocationCounts": {
                        "score": 58
                      }
                    }
                  }
                },
                {
                  "type": "TermQuery",
                  "args": {
                    "path": "amenities",
                    "value": "kitchen"
                  },
                  "stats": {
                    "context": {
                      "millisElapsed": 0.040155,
                      "invocationCounts": {
                        "createWeight": 1,
                        "createScorer": 6
                      }
                    },
                    "match": {
                      "millisElapsed": 1.037137,
                      "invocationCounts": {
                        "nextDoc": 4955
                      }
                    },
                    "score": {
                      "millisElapsed": 1.124072,
                      "invocationCounts": {
                        "score": 4953
                      }
                    }
                  }
                }
              ],
              "filter": [],
              "minimumShouldMatch": 0
            },
            "stats": {
              "context": {
                "millisElapsed": 1.019089,
                "invocationCounts": {
                  "createWeight": 1,
                  "createScorer": 4
                }
              },
              "match": {
                "millisElapsed": 9.97031,
                "invocationCounts": {
                  "nextDoc": 5504
                }
              },
              "score": {
                "millisElapsed": 9.856842,
                "invocationCounts": {
                  "score": 5502,
                  "setMinCompetitiveScore": 171
                }
              }
            }
          },
          "collectors": {
            "allCollectorStats": {
              "millisElapsed": 14.289227,
              "invocationCounts": {
                "collect": 5502,
                "competitiveIterator": 2,
                "setScorer": 2
              }
            }
          },
          "resultMaterialization": {
            "stats": {
              "millisElapsed": 1.733665,
              "invocationCounts": {
                "retrieveAndSerialize": 1
              }
            }
          },
          "metadata": {
            "mongotVersion": "1.49.5",
            "mongotHostName": "cluster1-shard-00-search-yj3pmj.lia43.mongodb.net",
            "indexName": "airbnb_search_index",
            "lucene": {
              "totalSegments": 2,
              "totalDocs": 5555
            }
          },
          "resourceUsage": {
            "majorFaults": 0,
            "minorFaults": 44,
            "userTimeMs": 10,
            "systemTimeMs": 0,
            "maxReportingThreads": 1,
            "numBatches": 1
          }
        }
      },
      "nReturned": 0,
      "executionTimeMillisEstimate": 59
    },
    {
      "$_internalSearchIdLookup": {},
      "nReturned": 0,
      "executionTimeMillisEstimate": 59
    },
    {
      "$match": {
        "$and": [
          { "price": { "$gte": 50 } },
          { "price": { "$lte": 300 } },
          { "accommodates": { "$gte": 2 } }
        ]
      },
      "nReturned": 0,
      "executionTimeMillisEstimate": 59
    },
    {
      "$group": {
        "_id": "$property_type",
        "avg_price": { "$avg": "$price" },
        "count": { "$sum": { "$const": 1 } },
        "max_accommodates": {
          "$max": "$accommodates"
        }
      },
      "maxAccumulatorMemoryUsageBytes": {
        "avg_price": 0,
        "count": 0,
        "max_accommodates": 0
      },
      "totalOutputDataSizeBytes": 0,
      "usedDisk": false,
      "spills": 0,
      "nReturned": 0,
      "executionTimeMillisEstimate": 59
    },
    {
      "$sort": { "sortKey": { "avg_price": -1 } },
      "totalDataSizeSortedBytesEstimate": 0,
      "usedDisk": false,
      "spills": 0,
      "nReturned": 0,
      "executionTimeMillisEstimate": 59
    }
  ],
  "serverInfo": {
    "host": "atlas-vjsqol-shard-00-02.lia43.mongodb.net",
    "port": 27017,
    "version": "6.0.24",
    "gitVersion": "1b052b94a23863fd12be97aaa4e4b1d96456e5cc"
  },
  "serverParameters": {
    "internalQueryFacetBufferSizeBytes": 104857600,
    "internalQueryFacetMaxOutputDocSizeBytes": 104857600,
    "internalLookupStageIntermediateDocumentMaxSizeBytes": 104857600,
    "internalDocumentSourceGroupMaxMemoryBytes": 104857600,
    "internalQueryMaxBlockingSortMemoryUsageBytes": 104857600,
    "internalQueryProhibitBlockingMergeOnMongoS": 0,
    "internalQueryMaxAddToSetBytes": 104857600,
    "internalDocumentSourceSetWindowFieldsMaxMemoryBytes": 104857600
  },
  "command": {
    "aggregate": "listingsAndReviews",
    "pipeline": [
      {
        "$search": {
          "index": "airbnb_search_index",
          "text": {
            "query": "pool wifi kitchen",
            "path": [
              "name",
              "description",
              "amenities"
            ]
          }
        }
      },
      {
        "$match": {
          "price": { "$gte": 50, "$lte": 300 },
          "accommodates": { "$gte": 2 }
        }
      },
      {
        "$group": {
          "_id": "$property_type",
          "avg_price": { "$avg": "$price" },
          "count": { "$sum": 1 },
          "max_accommodates": {
            "$max": "$accommodates"
          }
        }
      },
      { "$sort": { "avg_price": -1 } }
    ],
    "cursor": {},
    "maxTimeMS": 60000,
    "$db": "sample_airbnb"
  },
  "ok": 1,
  "$clusterTime": {
    "clusterTime": {
      "$timestamp": "7529915553582940161"
    },
    "signature": {
      "hash": "2NHep+I81l6V74t6XXMHMWecDWI=",
      "keyId": {
        "low": 1,
        "high": 1744823306,
        "unsigned": false
      }
    }
  },
  "operationTime": {
    "$timestamp": "7529915553582940161"
  }
}
    `,
    expected: ``,
    expectedsources: [],
  },
  {
    name: 'E2',
    indexes: `
// Required index with synonym mapping
{
  "mappings": {
    "dynamic": true
  },
  "synonyms": [
    {
      "name": "synonym_mapping",
      "analyzer": "lucene.standard",
      "source": {
        "collection": "synonyms"
      }
    }
  ]
}
    `,
    aggregation: `
   // Pipeline with synonyms
db.listingsAndReviews.aggregate([
  {
    $search: {
      "index": "airbnb_synonym_index",
      "text": {
        "query": "apartment",
        "path": ["property_type", "room_type", "description"],
        "synonyms": "synonym_mapping"
      }
    }
  },
  {
    $addFields: {
      "search_score": { $meta: "searchScore" }
    }
  },
  {
    $match: {
      "number_of_reviews": { $gte: 5 },
      "review_scores.review_scores_rating": { $gte: 80 }
    }
  },
  {
    $project: {
      "name": 1,
      "property_type": 1,
      "price": 1,
      "search_score": 1,
      "address.market": 1,
      "review_scores.review_scores_rating": 1
    }
  },
  {
    $sort: { "search_score": -1 }
  },
  {
    $limit: 20
  }
])
    `,
    explainPlan: `
{
  "explainVersion": "1",
  "stages": [
    {
      "$_internalSearchMongotRemote": {
        "mongotQuery": {
          "index": "airbnb_synonym_index",
          "text": {
            "query": "apartment",
            "path": [
              "property_type",
              "room_type",
              "description"
            ],
            "synonyms": "synonym_mapping"
          }
        },
        "explain": {
          "query": {
            "type": "BooleanQuery",
            "args": {
              "must": [],
              "mustNot": [],
              "should": [
                {
                  "type": "TermQuery",
                  "args": {
                    "path": "description",
                    "value": "apartment"
                  },
                  "stats": {
                    "context": {
                      "millisElapsed": 0.140485,
                      "invocationCounts": {
                        "createWeight": 1,
                        "createScorer": 18
                      }
                    },
                    "match": {
                      "millisElapsed": 0.137059,
                      "invocationCounts": {
                        "nextDoc": 2167
                      }
                    },
                    "score": {
                      "millisElapsed": 0.165448,
                      "invocationCounts": {
                        "score": 2161
                      }
                    }
                  }
                },
                {
                  "type": "TermQuery",
                  "args": {
                    "path": "room_type",
                    "value": "apartment"
                  },
                  "stats": {
                    "context": {
                      "millisElapsed": 0.022072,
                      "invocationCounts": {
                        "createWeight": 1,
                        "createScorer": 6
                      }
                    },
                    "match": {
                      "millisElapsed": 0
                    },
                    "score": {
                      "millisElapsed": 0
                    }
                  }
                },
                {
                  "type": "TermQuery",
                  "args": {
                    "path": "property_type",
                    "value": "apartment"
                  },
                  "stats": {
                    "context": {
                      "millisElapsed": 0.316218,
                      "invocationCounts": {
                        "createWeight": 1,
                        "createScorer": 18
                      }
                    },
                    "match": {
                      "millisElapsed": 0.246534,
                      "invocationCounts": {
                        "nextDoc": 3817
                      }
                    },
                    "score": {
                      "millisElapsed": 0.275275,
                      "invocationCounts": {
                        "score": 3811
                      }
                    }
                  }
                }
              ],
              "filter": [],
              "minimumShouldMatch": 0
            },
            "stats": {
              "context": {
                "millisElapsed": 0.971037,
                "invocationCounts": {
                  "createWeight": 1,
                  "createScorer": 12
                }
              },
              "match": {
                "millisElapsed": 1.215512,
                "invocationCounts": {
                  "nextDoc": 4039
                }
              },
              "score": {
                "millisElapsed": 2.268559,
                "invocationCounts": {
                  "score": 4033,
                  "setMinCompetitiveScore": 35
                }
              }
            }
          },
          "collectors": {
            "allCollectorStats": {
              "millisElapsed": 3.638979,
              "invocationCounts": {
                "collect": 4033,
                "competitiveIterator": 6,
                "setScorer": 6
              }
            }
          },
          "resultMaterialization": {
            "stats": {
              "millisElapsed": 9.728095,
              "invocationCounts": {
                "retrieveAndSerialize": 1
              }
            }
          },
          "metadata": {
            "mongotVersion": "1.49.5",
            "mongotHostName": "cluster1-shard-00-search-d93vdd.lia43.mongodb.net",
            "indexName": "airbnb_synonym_index",
            "lucene": {
              "totalSegments": 6,
              "totalDocs": 5555
            }
          },
          "resourceUsage": {
            "majorFaults": 0,
            "minorFaults": 17,
            "userTimeMs": 10,
            "systemTimeMs": 0,
            "maxReportingThreads": 1,
            "numBatches": 1
          }
        }
      },
      "nReturned": 0,
      "executionTimeMillisEstimate": 44
    },
    {
      "$_internalSearchIdLookup": {},
      "nReturned": 0,
      "executionTimeMillisEstimate": 44
    },
    {
      "$match": {
        "$and": [
          { "number_of_reviews": { "$gte": 5 } },
          {
            "review_scores.review_scores_rating": {
              "$gte": 80
            }
          }
        ]
      },
      "nReturned": 0,
      "executionTimeMillisEstimate": 44
    },
    {
      "$addFields": {
        "search_score": { "$meta": "searchScore" }
      },
      "nReturned": 0,
      "executionTimeMillisEstimate": 44
    },
    {
      "$project": {
        "_id": true,
        "name": true,
        "property_type": true,
        "price": true,
        "search_score": true,
        "address": { "market": true },
        "review_scores": {
          "review_scores_rating": true
        }
      },
      "nReturned": 0,
      "executionTimeMillisEstimate": 44
    },
    {
      "$sort": {
        "sortKey": { "search_score": -1 },
        "limit": 20
      },
      "totalDataSizeSortedBytesEstimate": 0,
      "usedDisk": false,
      "spills": 0,
      "nReturned": 0,
      "executionTimeMillisEstimate": 44
    }
  ],
  "serverInfo": {
    "host": "atlas-vjsqol-shard-00-02.lia43.mongodb.net",
    "port": 27017,
    "version": "6.0.24",
    "gitVersion": "1b052b94a23863fd12be97aaa4e4b1d96456e5cc"
  },
  "serverParameters": {
    "internalQueryFacetBufferSizeBytes": 104857600,
    "internalQueryFacetMaxOutputDocSizeBytes": 104857600,
    "internalLookupStageIntermediateDocumentMaxSizeBytes": 104857600,
    "internalDocumentSourceGroupMaxMemoryBytes": 104857600,
    "internalQueryMaxBlockingSortMemoryUsageBytes": 104857600,
    "internalQueryProhibitBlockingMergeOnMongoS": 0,
    "internalQueryMaxAddToSetBytes": 104857600,
    "internalDocumentSourceSetWindowFieldsMaxMemoryBytes": 104857600
  },
  "command": {
    "aggregate": "listingsAndReviews",
    "pipeline": [
      {
        "$search": {
          "index": "airbnb_synonym_index",
          "text": {
            "query": "apartment",
            "path": [
              "property_type",
              "room_type",
              "description"
            ],
            "synonyms": "synonym_mapping"
          }
        }
      },
      {
        "$addFields": {
          "search_score": {
            "$meta": "searchScore"
          }
        }
      },
      {
        "$match": {
          "number_of_reviews": { "$gte": 5 },
          "review_scores.review_scores_rating": {
            "$gte": 80
          }
        }
      },
      {
        "$project": {
          "name": 1,
          "property_type": 1,
          "price": 1,
          "search_score": 1,
          "address.market": 1,
          "review_scores.review_scores_rating": 1
        }
      },
      { "$sort": { "search_score": -1 } },
      { "$limit": 20 }
    ],
    "cursor": {},
    "maxTimeMS": 60000,
    "$db": "sample_airbnb"
  },
  "ok": 1,
  "$clusterTime": {
    "clusterTime": {
      "$timestamp": "7529916713224110081"
    },
    "signature": {
      "hash": "KPzY+NlMriGUAfO7jpPB8LPv4qU=",
      "keyId": {
        "low": 1,
        "high": 1744823306,
        "unsigned": false
      }
    }
  },
  "operationTime": {
    "$timestamp": "7529916713224110081"
  }
}

    `,
    expected: ``,
    expectedsources: [],
  },
  {
    name: 'E3',
    indexes: `
// Required text search index  
db.embedded_movies.createSearchIndex({
  "name": "movies_text_index",
  "definition": {
    "mappings": {
      "dynamic": false,
      "fields": {
        "plot": {"type": "string"},
        "title": {"type": "string"},
        "genres": {"type": "string"}
      }
    }
  }
})


// Required vector search index
db.embedded_movies.createSearchIndex({
  "name": "movies_vector_index",
  "type": "vectorSearch", 
  "definition": {
  "fields": [
    {
      "type": "vector",
      "path": "plot_embedding_voyage_3_large",
      "numDimensions": 2048,
      "similarity": "cosine"
    }
  ]
}
})

    `,
    aggregation: `
// Pipeline with rank fusion
[{
    $rankFusion: {
      input: {
        pipelines: {
          fullTextPipeline: [
            {
              $search: {
                index: "movies_text_index",
                text: {
                  query: "space adventure alien",
                  path: [
                    "plot",
                    "title",
                    "genres"
                  ]
                }
              }
            }
          ],
          vectorPipeline: [
            {
              $vectorSearch: {
                index: "movies_vector_index",
                path: "plot_embedding_voyage_3_large",
                queryVector: [
                  -0.025189938, 0.014741838,
                  -0.013024342, -0.0197512,
                  0.011235285, 0.004651551,
                  0.043509893, 0.003112961,
                  0.013310592, -0.033348043,
                  0.037212405, -0.021039322,
                  -0.026048684, 0.012809656,
                  0.029483676, 0.003578116,
                  -0.044654887, 0.032632418,
                  0.014312465, -0.058967352,
                  0.025333062, -0.055246111,
                  0.02189807, -0.017604331,
                  -0.002880384, 0.045227386,
                  0.004794675, 0.017604331,
                  0.023186192, -0.054673612,
                  -0.011306847, -0.012523406,
                  -0.012380281, 0.002540462,
                  0.015958399, -0.042364895,
                  -0.001467028, -0.020180576,
                  -0.058108605, -0.035065539,
                  0.010090288, -0.033348043,
                  0.058394853, -0.013883091,
                  0.002048471, -0.020753073,
                  -0.029769925, 0.031916797,
                  -0.014741838, -0.040933646,
                  -0.004096943, 0.020753073,
                  -0.002540462, 0.028052431,
                  -0.02404494, 0.006547953,
                  -0.003578116, 0.003757022,
                  0.019178702, -0.037784904,
                  -0.02833868, 0.01753277,
                  0.029769925, 0.017747456,
                  -0.031344298, 0.022899942,
                  0.006333265, 0.010376536,
                  -0.024474313, -0.012094032,
                  -0.004651551, 0.007764512,
                  0.017962143, 0.013811528,
                  0.037212405, -0.03148742,
                  0.000666424, 0.024474313,
                  -0.021325571, 0.041219898,
                  0.011235285, 0.046658635,
                  0.019035578, 0.020753073,
                  0.010662786, -0.001726441,
                  -0.012738093, -0.027193682,
                  -0.014598713, -0.013167467,
                  0.013596841, 0.001932183,
                  -0.010304974, -0.007478263,
                  0.005689205, 0.002987727,
                  0.005724986, 0.002325775,
                  0.002415228, -0.003828584,
                  -0.029340552, -0.017318081,
                  -0.070417322, 0.003810694,
                  -0.013453716, -0.001628043,
                  -0.027909305, 0.014026215,
                  0.009589351, 0.004902019,
                  0.028768053, -0.005259831,
                  -0.010448099, 0.025189938,
                  0.038357403, 0.048662379,
                  0.039788652, 0.010448099,
                  0.001574371, 0.020323699,
                  0.005510299, 0.026907433,
                  0.043223642, -0.001153942,
                  -0.010233412, 0.048376128,
                  -0.056104861, 0.006691077,
                  0.015672149, -0.015028087,
                  0.036210533, -0.009231539,
                  0.010519661, 0.022899942,
                  0.025762435, -0.009052633,
                  -0.0301993, 0.032203045,
                  -0.00522405, 0.029626802,
                  -0.02433119, -0.025619311,
                  0.016674021, 0.02404494,
                  -0.009589351, -0.026334934,
                  -0.04436864, -0.014455589,
                  0.02619181, 0.017604331,
                  0.02189807, -0.007728731,
                  -0.021611821, -0.03363429,
                  0.008480135, -0.027479932,
                  0.025046812, -0.006047016,
                  0.020753073, 0.01016185,
                  -0.034063663, 0.029483676,
                  -0.019035578, 0.041506145,
                  0.013453716, -0.009159978,
                  0.007549825, 0.025189938,
                  0.005152487, -0.009446226,
                  -0.009016853, 0.021325571,
                  0.030771798, -0.046944883,
                  0.001314958, 0.021182448,
                  0.047231134, -0.007048889,
                  -0.030771798, -0.025905561,
                  -0.000612752, -0.023186192,
                  0.011378409, 0.035065539,
                  0.007979199, 0.023901815,
                  -0.004973582, 0.005188268,
                  -0.046944883, 0.009374664,
                  0.047231134, 0.058967352,
                  0.043509893, 0.011449971,
                  0.017174957, -0.024188064,
                  -0.025476186, -0.02833868,
                  0.033061791, 0.015314337,
                  -0.018749328, 0.013382155,
                  0.007048889, 0.005975454,
                  0.005295612, -0.013310592,
                  -0.022756819, -0.012523406,
                  -0.03363429, -0.014527151,
                  0.011449971, 0.01202247,
                  0.044941138, -0.012594969,
                  0.002862493, 0.000572499,
                  0.030628674, -0.0098756,
                  0.020466823, 0.059539851,
                  -0.00370335, 0.007335138,
                  0.023901815, 0.023758691,
                  -0.005903892, 0.003918037,
                  0.013310592, 0.010090288,
                  -0.012809656, -0.010376536,
                  -0.01109216, -0.008086543,
                  0.012809656, -0.019894326,
                  0.012738093, 0.056391109,
                  0.029340552, -0.04436864,
                  -0.001619098, 0.042364895,
                  -0.027623056, 0.011593096,
                  -0.031916797, -0.0301993,
                  0.032203045, -0.003757022,
                  0.017174957, 0.033491168,
                  0.003900147, 0.002325775,
                  0.006726858, 0.020180576,
                  0.017389644, 0.009088415,
                  0.018319955, -0.003631788,
                  0.00586811, -0.006691077,
                  -0.014240902, -0.009052633,
                  0.031630546, 0.04436864,
                  -0.022899942, -0.003327648,
                  -0.006691077, 0.013310592,
                  -0.035924286, -0.008158104,
                  -0.005116706, -0.040647399,
                  0.002397338, 0.014455589,
                  -0.030342424, 0.028624929,
                  -0.031773672, 0.043509893,
                  -0.001833785, -0.025619311,
                  0.032775544, -0.046944883,
                  0.013739966, -0.030485548,
                  0.018319955, 0.016745584,
                  -0.020323699, -0.015815273,
                  -0.020896198, -0.015171212,
                  0.026334934, 0.035638034,
                  0.008873728, 0.003291867,
                  -0.02647806, 0.003649678,
                  0.003613897, 0.009804038,
                  -0.013525278, 0.005367174,
                  0.007657168, -0.017103394,
                  -0.015815273, -0.000398065,
                  0.013310592, 0.014240902,
                  0.003935928, 0.001735386,
                  -0.018606203, 0.008265448,
                  -0.068127327, 0.012165595,
                  -0.007836075, 0.02189807,
                  -0.000983982, 0.019178702,
                  -0.009589351, -0.013739966,
                  -0.007800293, 0.040361151,
                  0.027623056, -0.002540462,
                  -0.03663991, 0.011163722,
                  -0.016316209, -0.006333265,
                  -0.010877473, -0.023329318,
                  -0.021468697, 0.013596841,
                  0.032059919, 0.007442481,
                  0.02433119, -0.003613897,
                  -0.013596841, 0.010448099,
                  0.010877473, -0.0098756,
                  0.033920541, -0.006691077,
                  -0.039502401, -0.010877473,
                  -0.016960271, 0.014097777,
                  -0.008122323, 0.007478263,
                  0.010018725, -0.030485548,
                  -0.011020597, 0.000317558,
                  0.00461577, 0.020466823,
                  0.070703574, -0.024617439,
                  0.002111088, -0.024617439,
                  -0.004204286, -0.048662379,
                  -0.006834202, 0.027766181,
                  -0.002504681, 0.025189938,
                  0.033920541, -0.02833868,
                  -0.000773768, -0.03578116,
                  0.015958399, 0.006369046,
                  0.033204917, -0.006762639,
                  0.02003745, -0.020180576,
                  0.015886836, -0.015385899,
                  -0.029340552, -0.009446226,
                  0.015529023, -0.010376536,
                  -0.012881218, -0.000715623,
                  0.014312465, -0.029197427,
                  -0.000684315, 0.000360048,
                  0.015815273, -0.027050557,
                  0.006655296, 0.018892452,
                  -0.021182448, 0.031201173,
                  0.014240902, -0.022756819,
                  0.004365302, -0.020609949,
                  0.008515916, -0.016244646,
                  0.001162888, 0.000084421,
                  0.003273976, -0.017819017,
                  0.000576971, 0.020753073,
                  -0.004794675, 0.018105267,
                  -0.013095905, -0.028052431,
                  0.004114834, 0.02833868,
                  -0.027193682, -0.010877473,
                  -0.002576244, 0.011879345,
                  -0.017819017, 0.006726858,
                  -0.021754947, -0.031773672,
                  -0.013382155, 0.024903689,
                  0.013167467, 0.000033964,
                  0.034063663, 0.022613693,
                  -0.038357403, -0.010018725,
                  -0.017174957, -0.004418973,
                  0.02189807, -0.003166633,
                  -0.009589351, 0.009303101,
                  -0.036496785, -0.005760767,
                  -0.006583733, -0.003596007,
                  0.014026215, -0.003828584,
                  -0.02833868, -0.020896198,
                  0.001449137, 0.039502401,
                  0.012881218, 0.025476186,
                  0.000961619, -0.025762435,
                  0.002808821, 0.034922414,
                  0.004687332, -0.046658635,
                  0.030914923, -0.036067411,
                  0.008659041, -0.004025381,
                  -0.0301993, -0.026048684,
                  0.024760563, 0.036496785,
                  -0.029913051, 0.015672149,
                  0.007764512, 0.01509965,
                  0.010304974, -0.004490536,
                  -0.007585606, -0.019464951,
                  0.016602458, -0.007048889,
                  -0.005510299, 0.011163722,
                  0.013739966, -0.034636162,
                  0.020609949, -0.004418973,
                  0.034636162, 0.040933646,
                  0.031773672, 0.023758691,
                  0.031344298, -0.006798421,
                  0.026048684, -0.011521534,
                  0.020753073, 0.014384027,
                  0.026334934, -0.034206789,
                  -0.036067411, 0.014598713,
                  0.023758691, -0.039216153,
                  0.003363429, 0.002880384,
                  -0.006726858, -0.000916892,
                  -0.001395465, -0.009660914,
                  0.032059919, 0.008086543,
                  0.029054303, -0.011593096,
                  0.065551087, 0.031058047,
                  -0.041219898, -0.014097777,
                  -0.017103394, 0.016244646,
                  -0.028911177, 0.044654887,
                  -0.030771798, 0.024760563,
                  0.02833868, 0.018248392,
                  0.026907433, -0.002227377,
                  0.034063663, 0.000167724,
                  0.021039322, -0.018892452,
                  0.012738093, -0.001395465,
                  0.005760767, -0.024760563,
                  -0.002683587, 0.000230341,
                  -0.0197512, 0.009088415,
                  -0.00400749, -0.026764309,
                  -0.012881218, 0.016101522,
                  -0.009303101, 0.015529023,
                  -0.016817145, 0.014312465,
                  -0.030914923, -0.018463079,
                  0.020323699, -0.023472441,
                  -0.023758691, -0.005009362,
                  0.018176829, 0.012738093,
                  0.009374664, -0.031916797,
                  0.016387772, 0.027479932,
                  0.015529023, -0.021325571,
                  0.020323699, -0.025476186,
                  0.008515916, -0.039788652,
                  -0.007979199, -0.009947163,
                  -0.006869983, 0.004758894,
                  0.022613693, -0.013668403,
                  -0.015171212, 0.035351787,
                  -0.022327444, 0.019178702,
                  0.000404774, -0.003524444,
                  -0.012094032, 0.023901815,
                  -0.0400749, -0.004579989,
                  0.00245101, 0.013024342,
                  0.015958399, 0.009517789,
                  0.034779288, 0.021468697,
                  0.00062617, 0.007728731,
                  -0.028195554, 0.0301993,
                  -0.002504681, 0.008909509,
                  0.004651551, -0.007013108,
                  0.03148742, 0.019608077,
                  0.002540462, 0.043509893,
                  -0.006190141, 0.024903689,
                  0.010519661, 0.018319955,
                  0.010519661, 0.009660914,
                  0.000966091, -0.004454754,
                  0.000299667, 0.007907636,
                  -0.018463079, 0.004758894,
                  -0.001851675, -0.002415228,
                  0.010233412, -0.024617439,
                  -0.030771798, 0.018749328,
                  0.003023508, 0.005474518,
                  -0.011521534, -0.008551697,
                  0.007979199, 0.03363429,
                  0.000275068, 0.007800293,
                  0.0039896, 0.00522405,
                  -0.035924286, -0.01416934,
                  0.02619181, -0.025476186,
                  -0.033777416, 0.021325571,
                  -0.02218432, 0.001833785,
                  0.027766181, -0.006118578,
                  0.032059919, 0.038929902,
                  0.003613897, 0.031344298,
                  -0.002737259, 0.057536107,
                  0.009732476, 0.020753073,
                  0.005402955, -0.047803629,
                  -0.040933646, 0.009052633,
                  -0.030485548, 0.018319955,
                  0.025046812, -0.002361557,
                  0.045513637, 0.008766385,
                  -0.031058047, 0.014312465,
                  0.002737259, -0.004186396,
                  0.032059919, 0.024617439,
                  -0.012666531, 0.006798421,
                  0.02619181, -0.012523406,
                  0.009947163, 0.005617642,
                  0.039216153, 0.008766385,
                  0.009517789, 0.042651143,
                  -0.012881218, 0.007263576,
                  -0.000514354, 0.016817145,
                  -0.048948627, 0.018176829,
                  0.034922414, 0.005331393,
                  0.000391356, -0.017604331,
                  0.026048684, -0.011807784,
                  0.017461207, 0.012809656,
                  0.029483676, -0.017174957,
                  0.023472441, 0.005188268,
                  0.007585606, -0.034922414,
                  0.069558576, 0.023472441,
                  -0.010304974, 0.020180576,
                  0.025046812, 0.016459335,
                  0.000317558, -0.018606203,
                  0.066696085, 0.011664659,
                  0.025762435, -0.016888708,
                  0.015314337, -0.009231539,
                  0.016459335, -0.021325571,
                  0.009303101, 0.000840857,
                  -0.014455589, 0.00170855,
                  0.014741838, -0.004168505,
                  -0.009088415, -0.0074067,
                  -0.004472645, 0.002665696,
                  0.023615567, 0.038929902,
                  -0.016960271, -0.027193682,
                  0.03663991, -0.016530896,
                  0.003256086, 0.015171212,
                  0.036926158, 0.02433119,
                  0.047231134, -0.049234878,
                  0.009947163, -0.01109216,
                  -0.014097777, -0.007585606,
                  0.00338132, -0.008086543,
                  0.018176829, -0.014527151,
                  -0.000205742, -0.041219898,
                  0.012666531, 0.046086136,
                  0.004025381, -0.0074067,
                  0.033348043, -0.020896198,
                  -0.000514354, 0.033491168,
                  0.004257958, 0.02404494,
                  -0.008372792, -0.021754947,
                  0.037784904, 0.013453716,
                  0.013024342, -0.026334934,
                  0.023758691, 0.012094032,
                  0.006297485, 0.045227386,
                  0.021039322, -0.020323699,
                  0.005975454, 0.008802165,
                  0.00370335, 0.006941545,
                  -0.029340552, -0.008551697,
                  -0.004454754, 0.003488663,
                  0.010662786, 0.00801498,
                  0.010090288, 0.015600586,
                  0.018105267, -0.020180576,
                  -0.00307718, 0.031630546,
                  0.000644061, 0.011950907,
                  -0.023472441, 0.01509965,
                  -0.035924286, 0.016459335,
                  -0.027766181, -0.014598713,
                  -0.021611821, -0.013310592,
                  -0.021039322, -0.02189807,
                  0.018606203, -0.007979199,
                  0.018176829, 0.022041194,
                  -0.002916165, 0.009088415,
                  -0.00522405, -0.018176829,
                  -0.031916797, -0.017318081,
                  -0.025476186, -0.014527151,
                  -0.017675893, -0.026621183,
                  0.000362284, 0.02619181,
                  0.016101522, -0.013310592,
                  0.021325571, 0.027909305,
                  0.016316209, 0.006011235,
                  0.008551697, 0.030914923,
                  -0.070703574, 0.004794675,
                  -0.019321827, -0.011163722,
                  -0.014598713, -0.0197512,
                  -0.005438737, -0.025189938,
                  -0.037212405, 0.004168505,
                  -0.021754947, 0.018033706,
                  0.035065539, 0.022756819,
                  0.005581861, -0.007764512,
                  -0.003005618, -0.003524444,
                  0.006655296, -0.00170855,
                  -0.046086136, -0.009374664,
                  0.001744332, 0.030056175,
                  0.016674021, 0.014312465,
                  0.029054303, -0.009052633,
                  0.005832329, -0.029197427,
                  -0.004723113, 0.032489292,
                  0.022899942, -0.044941138,
                  0.014026215, -0.007227794,
                  -0.035494912, 0.001261286,
                  0.079004802, 0.008122323,
                  0.022041194, 0.016602458,
                  0.046658635, -0.016888708,
                  -0.006547953, -0.016316209,
                  0.002021636, -0.016745584,
                  0.003792803, 0.005116706,
                  -0.037784904, -0.028481804,
                  -0.014670276, -0.005259831,
                  0.018892452, 0.001252341,
                  -0.068699829, -0.021611821,
                  -0.015242774, -0.027050557,
                  -0.032059919, 0.026048684,
                  -0.014240902, -0.007013108,
                  0.014598713, -0.005474518,
                  -0.007192013, -0.016817145,
                  0.00400749, 0.010519661,
                  0.007657168, 0.005295612,
                  0.009124196, 0.024474313,
                  -0.019894326, -0.044941138,
                  -0.022756819, -0.022327444,
                  -0.041792396, 0.027479932,
                  -0.013668403, -0.036210533,
                  0.001225505, 0.009947163,
                  -0.044654887, -0.02003745,
                  0.031344298, -0.004186396,
                  -0.009517789, 0.000720096,
                  -0.023901815, 0.000670897,
                  0.022899942, 0.006619515,
                  0.006512171, 0.022327444,
                  0.021468697, 0.021611821,
                  0.039216153, -0.019608077,
                  0.028052431, -0.020466823,
                  -0.0197512, 0.004454754,
                  0.026048684, -0.024617439,
                  -0.000333212, 0.002200541,
                  -0.002629915, 0.021611821,
                  0.009374664, 0.00894529,
                  -0.057822354, -0.009660914,
                  -0.002844602, 0.020323699,
                  0.000603807, 0.018033706,
                  -0.027050557, -0.004186396,
                  -0.019608077, -0.021754947,
                  0.009732476, 0.01602996,
                  -0.016960271, -0.001520699,
                  -0.023615567, 0.004383192,
                  0.000925838, 0.023043068,
                  0.032775544, 0.006404828,
                  -0.010304974, 0.019321827,
                  0.017604331, -0.01230872,
                  0.007657168, 0.005402955,
                  -0.03148742, -0.000550135,
                  -0.002111088, -0.029626802,
                  0.01323903, -0.033777416,
                  0.006655296, 0.035065539,
                  -0.003256086, 0.000907947,
                  0.004025381, 0.011020597,
                  -0.04808988, 0.02619181,
                  0.015171212, 0.023758691,
                  0.014741838, -0.001359684,
                  -0.041506145, -0.009088415,
                  -0.012738093, 0.000176669,
                  0.033777416, 0.024188064,
                  -0.002307885, 0.023901815,
                  0.00034663, -0.024474313,
                  -0.031773672, -0.023758691,
                  -0.024474313, -0.011163722,
                  0.000447265, 0.005080925,
                  -0.00123445, 0.006297485,
                  -0.031058047, -0.012738093,
                  -0.003059289, -0.026907433,
                  -0.015672149, -0.005760767,
                  0.023043068, 0.023043068,
                  -0.015028087, 0.017747456,
                  0.013883091, -0.011807784,
                  0.038357403, -0.016817145,
                  0.014884963, 0.017389644,
                  -0.000599334, 0.016602458,
                  0.008086543, -0.039502401,
                  0.050379876, -0.024474313,
                  0.035351787, -0.023758691,
                  0.002039526, 0.004061162,
                  -0.012165595, -0.020180576,
                  0.001636988, -0.013883091,
                  0.017389644, 0.006225922,
                  -0.03578116, -0.016817145,
                  -0.001332848, -0.005617642,
                  -0.008730603, -0.039216153,
                  0.02433119, 0.028052431,
                  0.02833868, 0.039502401,
                  0.010233412, -0.006869983,
                  0.021468697, 0.002039526,
                  -0.0197512, 0.020753073,
                  0.027050557, 0.009517789,
                  0.011449971, 0.038929902,
                  0.008873728, 0.009374664,
                  0.007871855, -0.006082797,
                  -0.007156232, -0.014670276,
                  -0.000447265, 0.046944883,
                  -0.015242774, -0.019894326,
                  0.008158104, 0.016173085,
                  -0.018463079, 0.034922414,
                  -0.005009362, -0.000092248,
                  0.005760767, 0.006190141,
                  -0.022613693, 0.034206789,
                  0.012523406, 0.000992927,
                  0.038071156, -0.048376128,
                  -0.017747456, 0.014384027,
                  0.000751404, 0.015314337,
                  -0.010519661, 0.058681104,
                  0.013954652, 0.022899942,
                  -0.003757022, 0.01416934,
                  -0.000469628, -0.008337011,
                  -0.001153942, 0.02189807,
                  -0.024760563, 0.01416934,
                  -0.012738093, -0.025046812,
                  0.030771798, -0.046658635,
                  -0.002137924, 0.053242367,
                  0.010090288, -0.046086136,
                  0.016316209, -0.005295612,
                  0.023043068, -0.023043068,
                  0.010233412, -0.018319955,
                  -0.017389644, 0.030485548,
                  0.009660914, 0.017174957,
                  0.050379876, -0.010304974,
                  0.017819017, -0.000364521,
                  0.011163722, 0.001753277,
                  0.010448099, 0.013095905,
                  0.008372792, -0.01109216,
                  0.036926158, -0.015672149,
                  -0.014598713, 0.008981071,
                  -0.011879345, -0.036926158,
                  -0.01789058, -0.008694822,
                  -0.028911177, -0.017103394,
                  -0.028768053, -0.030914923,
                  0.001033181, 0.00431163,
                  -0.024474313, -0.031058047,
                  0.010018725, 0.00647639,
                  -0.027336806, 0.025046812,
                  0.003148742, -0.010018725,
                  0.03663991, 0.033348043,
                  -0.001162888, -0.01016185,
                  0.010376536, 0.010519661,
                  0.019178702, 0.016101522,
                  0.007943418, -0.013739966,
                  -0.013525278, -0.027193682,
                  0.006655296, 0.027050557,
                  -0.017389644, -0.027479932,
                  0.041792396, 0.045513637,
                  -0.014741838, 0.012451844,
                  0.018319955, -0.00153859,
                  0.010519661, 0.017962143,
                  -0.012594969, 0.018606203,
                  0.023472441, -0.034063663,
                  -0.004061162, 0.015600586,
                  0.019178702, 0.002361557,
                  -0.025619311, -0.00586811,
                  -0.02003745, 0.013739966,
                  0.017675893, -0.025189938,
                  -0.002415228, 0.001547535,
                  0.019608077, 0.039502401,
                  -0.00184273, 0.025189938,
                  0.00277304, 0.020323699,
                  0.007227794, 0.012165595,
                  -0.00370335, 0.02433119,
                  -0.00586811, 0.016459335,
                  0.034206789, 0.001051072,
                  -0.010519661, -0.004096943,
                  0.00153859, 0.01574371,
                  0.01230872, -0.007692949,
                  -0.019464951, 0.005116706,
                  0.017389644, 0.024903689,
                  0.046658635, -0.010519661,
                  0.020609949, 0.060684849,
                  -0.045227386, -0.008551697,
                  -0.004293739, -0.001502809,
                  -0.015815273, -0.005975454,
                  0.000290722, 0.027050557,
                  -0.002245268, -0.016888708,
                  -0.027193682, -0.001288122,
                  -0.021182448, -0.041219898,
                  0.031916797, 0.030628674,
                  -0.03234617, 0.006655296,
                  0.008372792, -0.009016853,
                  -0.033348043, 0.010877473,
                  -0.05238362, -0.004490536,
                  -0.028911177, 0.006905764,
                  -0.003506554, 0.039788652,
                  -0.036496785, -0.015886836,
                  0.015314337, -0.015672149,
                  0.006225922, -0.021182448,
                  -0.034349915, -0.043223642,
                  -0.025476186, 0.002558353,
                  0.007048889, -0.037784904,
                  -0.014026215, -0.044654887,
                  -0.036926158, 0.008229667,
                  0.007728731, 0.039216153,
                  -0.00027954, 0.026907433,
                  0.027193682, -0.017174957,
                  -0.011378409, 0.017174957,
                  -0.015815273, 0.009446226,
                  0.033777416, -0.014384027,
                  0.003721241, -0.024760563,
                  -0.000229223, 0.008802165,
                  -0.000377939, -0.007692949,
                  0.016173085, 0.018248392,
                  -0.02218432, -0.003202414,
                  -0.033204917, -0.002969836,
                  -0.023186192, 0.030056175,
                  -0.015457462, -0.015314337,
                  -0.008981071, 0.022613693,
                  -0.014026215, -0.025476186,
                  0.025333062, 0.034206789,
                  0.010662786, 0.016387772,
                  0.030342424, -0.008086543,
                  0.007120451, 0.000221396,
                  0.025619311, 0.01789058,
                  -0.008086543, 0.011807784,
                  -0.016101522, 0.002719368,
                  0.005653423, 0.017962143,
                  -0.001941128, 0.06297484,
                  0.016244646, 0.003524444,
                  0.018749328, -0.001815894,
                  0.006082797, 0.069558576,
                  -0.011020597, 0.018033706,
                  0.026621183, 0.007692949,
                  -0.008694822, 0.035924286,
                  -0.001878511, -0.005975454,
                  -0.028911177, -0.007871855,
                  0.014741838, 0.008587479,
                  0.026621183, 0.005259831,
                  -0.023186192, 0.000368993,
                  -0.01323903, 0.002683587,
                  -0.011306847, 0.007478263,
                  -0.000621698, 0.022756819,
                  -0.018892452, -0.013167467,
                  0.007764512, -0.010877473,
                  -0.017461207, -0.013525278,
                  0.014240902, -0.019464951,
                  -0.009016853, 0.016173085,
                  -0.027479932, 0.002934055,
                  0.042937394, -0.004830457,
                  -0.031201173, -0.024188064,
                  0.00245101, 0.017318081,
                  0.001824839, -0.022756819,
                  0.021325571, -0.027479932,
                  -0.008659041, 0.008337011,
                  -0.016674021, -0.003452882,
                  0.000711151, -0.045799885,
                  0.013739966, -0.029340552,
                  -0.035208661, 0.000554608,
                  -0.007800293, 0.018892452,
                  0.028481804, -0.011593096,
                  -0.00894529, 0.024474313,
                  -0.008050761, 0.025476186,
                  -0.001306012, -0.00214687,
                  -0.008050761, -0.018606203,
                  -0.006047016, -0.028768053,
                  0.029197427, -0.021468697,
                  0.005402955, -0.021039322,
                  -0.014312465, -0.002325775,
                  -0.020896198, 0.000706678,
                  0.035638034, -0.008480135,
                  -0.035351787, 0.014312465,
                  0.012523406, 0.011807784,
                  0.003041399, -0.010018725,
                  -0.022613693, -0.021182448,
                  -0.005474518, -0.007120451,
                  0.025476186, 0.036926158,
                  -0.007907636, -0.014097777,
                  0.010519661, 0.005617642,
                  0.014670276, -0.011664659,
                  0.011879345, -0.012738093,
                  -0.007871855, -0.012666531,
                  0.032918669, -0.010018725,
                  0.007943418, 0.024188064,
                  0.005760767, -0.003918037,
                  0.022613693, 0.017318081,
                  0.036496785, 0.037784904,
                  0.008694822, 0.016674021,
                  0.000106225, 0.003685459,
                  -0.031201173, -0.01016185,
                  -0.02404494, -0.019035578,
                  0.031773672, 0.000975037,
                  -0.032489292, -0.033920541,
                  0.015385899, -0.023186192,
                  0.012523406, -0.011163722,
                  -0.005116706, 0.015314337,
                  -0.006834202, -0.038357403,
                  -0.023472441, 0.015529023,
                  0.017747456, 0.005653423,
                  -0.002325775, 0.009088415,
                  -0.022899942, 0.02433119,
                  0.000849803, -0.042078644,
                  -0.004257958, 0.018176829,
                  -0.0049378, -0.002415228,
                  -0.016173085, 0.012594969,
                  0.013596841, -0.017031832,
                  -0.001806949, -0.003810694,
                  0.003005618, 0.046944883,
                  -0.025476186, 0.012738093,
                  0.009016853, -0.009660914,
                  0.012666531, 0.014026215,
                  -0.010519661, 0.022327444,
                  0.00400749, -0.007478263,
                  -0.03578116, 0.009804038,
                  -0.028911177, -0.018248392,
                  0.004758894, 0.005939673,
                  0.033920541, -0.011378409,
                  -0.005474518, 0.012451844,
                  0.018176829, 0.033920541,
                  0.025905561, -0.014670276,
                  0.001798003, 0.031344298,
                  0.00431163, 0.027193682,
                  -0.006798421, 0.011449971,
                  0.00894529, 0.013883091,
                  0.023758691, -0.007692949,
                  0.031344298, -0.014384027,
                  -0.007514044, -0.026621183,
                  -0.001645933, -0.010090288,
                  -0.009589351, 0.008193886,
                  -0.007871855, -0.031773672,
                  0.013525278, 0.006583733,
                  0.010949035, -0.004794675,
                  -0.004061162, -0.021468697,
                  0.011020597, -0.020609949,
                  0.010018725, 0.010662786,
                  0.008158104, 0.00370335,
                  0.007800293, -0.029626802,
                  0.029197427, -0.017174957,
                  -0.00586811, -0.003112961,
                  -0.018749328, -0.042364895,
                  0.027050557, 0.028624929,
                  0.008837947, 0.026334934,
                  0.018248392, -0.004758894,
                  0.009446226, -0.033061791,
                  -0.022041194, -0.021039322,
                  0.008086543, -0.009088415,
                  -0.031630546, 0.020896198,
                  -0.018749328, 0.022613693,
                  -0.014097777, 0.004347411,
                  0.014813401, -0.013525278,
                  -0.001726441, 0.010448099,
                  0.036067411, -0.026048684,
                  -0.020753073, -0.005045144,
                  0.033348043, -0.002576244,
                  0.02404494, 0.022041194,
                  0.017031832, -0.000297431,
                  -0.003184523, -0.012738093,
                  0.022756819, -0.016888708,
                  0.021039322, -0.000313085,
                  0.032203045, -0.011235285,
                  0.001583316, -0.00461577,
                  -0.026334934, -0.002934055,
                  -0.005939673, 0.001458082,
                  0.007156232, -0.005689205,
                  -0.042937394, 0.011378409,
                  0.007156232, 0.00554608,
                  0.026621183, -0.014455589,
                  -0.017604331, -0.02647806,
                  -0.03578116, -0.009804038,
                  0.006905764, -0.0197512,
                  -0.035494912, -0.027623056,
                  -0.00461577, 0.011521534,
                  0.006905764, 0.009517789,
                  0.003112961, 0.033920541,
                  -0.004687332, -0.005045144,
                  -0.009231539, 0.000126911,
                  0.008694822, -0.029340552,
                  0.011163722, 0.047517382,
                  -0.039788652, -0.033348043,
                  -0.003041399, -0.007657168,
                  -0.035065539, -0.012165595,
                  -0.024617439, 0.0049378,
                  0.017461207, 0.029626802,
                  -0.004723113, -0.000366757,
                  -0.041792396, 0.041219898,
                  -0.009446226, 0.016960271,
                  -0.017747456, -0.036067411,
                  0.025046812, 0.027336806,
                  0.025905561, 0.049234878,
                  0.016602458, -0.005796548,
                  0.021325571, -0.003524444,
                  -0.000872166, 0.014670276,
                  0.020323699, 0.002737259,
                  0.009660914, -0.006440609,
                  -0.062402345, -0.062688597,
                  -0.008158104, -0.018749328,
                  0.005438737, -0.002066362,
                  0.000205742, -0.018749328,
                  0.017103394, -0.03578116,
                  0.000265004, -0.03663991,
                  -0.024760563, 0.054101113,
                  -0.00647639, -0.026334934,
                  0.034779288, 0.022756819,
                  -0.033348043, -0.02433119,
                  -0.041792396, -0.014455589,
                  -0.023329318, -0.004687332,
                  -0.013453716, -0.018319955,
                  -0.014455589, 0.043509893,
                  0.013453716, -0.014813401,
                  0.009052633, -0.034349915,
                  0.052097369, -0.003774913,
                  0.016316209, -0.027050557,
                  0.028195554, -0.007549825,
                  -0.020466823, 0.014598713,
                  -0.005939673, 0.003273976,
                  -0.052097369, 0.002701478,
                  -0.02404494, -0.005903892,
                  0.009947163, -0.00043161,
                  0.02189807, 0.042078644,
                  -0.020609949, 0.007836075,
                  0.018892452, 0.001207614,
                  0.009159978, -0.029197427,
                  -0.023329318, 0.004347411,
                  -0.019464951, 0.020180576,
                  0.019894326, 0.00615436,
                  0.021468697, -0.017461207,
                  -0.011879345, -0.002307885,
                  0.016101522, -0.029626802,
                  -0.014455589, 0.020323699,
                  0.020753073, 0.018176829,
                  -0.006082797, 0.027766181,
                  0.016530896, -0.008444354,
                  0.001806949, 0.029626802,
                  -0.012451844, 0.023186192,
                  0.006869983, -0.034063663,
                  -0.012094032, -0.021611821,
                  -0.008050761, 0.05581861,
                  -0.004257958, -0.025333062,
                  -0.004526317, 0.018033706,
                  0.027479932, 0.025476186,
                  0.008802165, -0.009589351,
                  0.012809656, 0.012523406,
                  0.0400749, 0.018033706,
                  0.011020597, 0.014956526,
                  0.013883091, -0.006655296,
                  0.019608077, -0.03234617,
                  0.007585606, -0.036067411,
                  -0.024617439, -0.001628043,
                  0.022041194, 0.026764309,
                  -0.038643654, -0.009124196,
                  -0.020323699, -0.013883091,
                  0.02404494, 0.002361557,
                  -0.03234617, -0.0049378,
                  0.018606203, 0.022327444,
                  0.043509893, -0.030485548,
                  -0.003560225, 0.007442481,
                  0.00370335, 0.011449971,
                  0.023472441, 0.000197915,
                  -0.011950907, 0.023329318,
                  -0.009804038, -0.025619311,
                  0.0074067, -0.003953818,
                  0.014312465, 0.048662379,
                  -0.027193682, 0.019894326,
                  -0.042364895, 0.003327648,
                  0.042937394, -0.040933646,
                  -0.020466823, 0.056104861,
                  0.020896198, -0.014527151,
                  -0.036210533, -0.022470569,
                  0.035924286, -0.013167467,
                  -0.055532362, -0.006190141,
                  -0.027909305, 0.012881218,
                  0.003005618, 0.005689205,
                  0.01109216, -0.016387772,
                  -0.021468697, 0.018176829,
                  -0.021611821, 0.032918669,
                  0.002951946, -0.008837947,
                  -0.031773672, -0.029913051,
                  0.017318081, 0.017461207,
                  -0.02833868, -0.027479932,
                  -0.023615567, 0.037212405,
                  -0.023615567, -0.02404494,
                  0.029626802, 0.002951946,
                  0.004043271, -0.001377575,
                  0.007800293, 0.024188064,
                  -0.027336806, -0.002361557,
                  -0.00307718, -0.025189938,
                  0.007192013, -0.000207978,
                  0.040933646, 0.010877473,
                  -0.000720096, -0.006941545,
                  0.003059289, 0.032775544,
                  -0.007657168, 0.019321827,
                  -0.012094032, 0.042078644,
                  -0.010591224, 0.011807784,
                  -0.016173085, -0.015529023,
                  -0.023615567, 0.016173085,
                  -0.018606203, 0.007192013,
                  -0.008587479, 0.000257177,
                  0.002245268, -0.011879345,
                  0.044082388, -0.005939673,
                  -0.003059289, -0.013954652,
                  -0.026621183, 0.039502401,
                  -0.006440609, 0.014384027,
                  0.012094032, -0.034779288,
                  -0.002379447, 0.023329318,
                  0.029483676, -0.002325775,
                  -0.001565426, 0.025619311,
                  0.018606203, -0.016101522,
                  -0.0301993, 0.002576244,
                  0.035208661, 0.002325775,
                  -0.011664659, -0.022470569,
                  -0.047231134, -0.016888708,
                  -0.017747456, 0.05152487,
                  0.009374664, -0.010591224,
                  0.009303101, -0.005009362,
                  -0.029197427, 0.001726441,
                  -0.023758691, -0.002934055,
                  -0.017461207, 0.018606203,
                  -0.002665696, -0.003578116,
                  -0.018606203, -0.004651551,
                  -0.021325571, 0.005367174,
                  -0.009124196, 0.016888708,
                  -0.01295278, 0.002048471,
                  -0.011593096, 0.017604331,
                  -0.008515916, 0.006082797,
                  -0.036067411, -0.027336806,
                  -0.010018725, -0.001306012,
                  0.026334934, -0.019321827,
                  -0.030914923, -0.026764309,
                  -0.0024689, -0.005581861,
                  -0.002755149, 0.019464951,
                  -0.01295278, 0.011163722,
                  0.000639588, 0.025476186,
                  0.029483676, 0.042651143,
                  -0.011306847, 0.002737259,
                  0.010090288, -0.015600586,
                  0.038357403, 0.029197427,
                  -0.008193886, 0.044082388,
                  0.032489292, -0.00123445,
                  -0.008372792, 0.009124196,
                  -0.00309507, -0.041792396,
                  0.007764512, -0.009947163,
                  0.044941138, 0.030056175,
                  -0.013024342, -0.019321827,
                  0.019321827, 0.008551697,
                  -0.053814866, 0.038071156,
                  -0.037784904, 0.012165595,
                  -0.008444354, -0.029626802,
                  -0.006905764, -0.028195554,
                  -0.01080591, -0.0098756,
                  -0.032203045, 0.040361151,
                  -0.033920541, 0.004454754,
                  -0.036067411, 0.011879345,
                  -0.011235285, 0.020609949,
                  -0.004579989, 0.0074067,
                  -0.017103394, 0.01789058,
                  0.011449971, -0.007836075,
                  0.000427138, -0.007120451,
                  0.008337011, 0.00123445,
                  -0.003273976, -0.007263576,
                  -0.011449971, 0.022756819,
                  0.002576244, -0.013310592,
                  -0.013382155, -0.011664659,
                  -0.013453716, -0.005152487,
                  -0.050379876, -0.034636162,
                  -0.011306847, 0.015028087,
                  0.008480135, -0.047517382,
                  -0.00586811, -0.008301229,
                  -0.01416934, 0.000876638,
                  0.000326503, 0.01080591,
                  0.004150615, 0.005259831,
                  -0.008837947, 0.017031832,
                  -0.016316209, -0.036210533,
                  -0.013883091, -0.000295195,
                  0.014240902, 0.020753073,
                  -0.022899942, -0.038929902,
                  0.00586811, -0.008050761,
                  0.00016437, -0.001932183,
                  0.001789058, 0.017031832,
                  0.045227386, -0.016745584,
                  -0.005689205, 0.008372792,
                  0.008301229, -0.016674021,
                  -0.004222177, 0.005832329,
                  0.016173085, -0.009374664,
                  -0.006869983, -0.052669868,
                  0.035065539, 0.000123557,
                  0.007478263, 0.033491168,
                  0.054387365, 0.002254213,
                  -0.007836075, -0.020323699,
                  -0.019178702, -0.010376536,
                  -0.039788652, -0.032632418,
                  -0.012380281, -0.002540462,
                  -0.016602458, -0.022756819,
                  0.019608077, 0.001887456,
                  0.032918669, 0.008050761,
                  -0.013739966, 0.006547953,
                  -0.016674021, 0.001574371,
                  0.019321827, -0.016960271,
                  -0.031201173, 0.027766181,
                  0.006655296, 0.020753073,
                  0.009804038, 0.024903689,
                  -0.043509893, 0.015815273,
                  -0.017962143, -0.043223642,
                  0.033920541, -0.007764512,
                  -0.006762639, 0.017819017,
                  -0.026621183, 0.046658635,
                  -0.004490536, 0.024188064,
                  -0.010304974, 0.004651551,
                  0.047231134, -0.038071156,
                  0.009589351, -0.033920541,
                  -0.027050557, 0.050093625,
                  0.008515916, -0.025189938,
                  -0.008050761, 0.011950907,
                  0.004973582, 0.014527151,
                  -0.009374664, -0.003721241,
                  0.019608077, 0.049807377,
                  0.016602458, 0.02404494
                ],
                numCandidates: 100,
                limit: 50
              }
            }
          ]
        }
      },
      combination: {
        weights: {
          vectorPipeline: 0.5,
          fullTextPipeline: 0.5
        }
      },
      scoreDetails: true
    }
  },
  {
    $group: {
      _id: "$decade",
      top_movie: {
        $first: "$$ROOT"
      },
      avg_rating: {
        $avg: "$imdb.rating"
      },
      count: {
        $sum: 1
      }
    }
  }
]

    `,
    explainPlan: `
{
  "explainVersion": "1",
  "stages": [
    {
      "$_internalSearchMongotRemote": {
        "mongotQuery": {
          "index": "movies_text_index",
          "text": {
            "query": "space adventure alien",
            "path": ["plot", "title", "genres"]
          }
        },
        "explain": {
          "query": {
            "type": "BooleanQuery",
            "args": {
              "must": [],
              "mustNot": [],
              "should": [
                {
                  "type": "TermQuery",
                  "args": {
                    "path": "plot",
                    "value": "space"
                  },
                  "stats": {
                    "context": {
                      "millisElapsed": 1.193695,
                      "invocationCounts": {
                        "createWeight": 5,
                        "createScorer": 15
                      }
                    },
                    "match": {
                      "millisElapsed": 0.131159,
                      "invocationCounts": {
                        "nextDoc": 160
                      }
                    },
                    "score": {
                      "millisElapsed": 0.119138,
                      "invocationCounts": {
                        "score": 155
                      }
                    }
                  }
                },
                {
                  "type": "TermQuery",
                  "args": {
                    "path": "genres",
                    "value": "alien"
                  },
                  "stats": {
                    "context": {
                      "millisElapsed": 0.182493,
                      "invocationCounts": {
                        "createWeight": 5,
                        "createScorer": 5
                      }
                    },
                    "match": {
                      "millisElapsed": 0
                    },
                    "score": {
                      "millisElapsed": 0
                    }
                  }
                },
                {
                  "type": "TermQuery",
                  "args": {
                    "path": "plot",
                    "value": "adventure"
                  },
                  "stats": {
                    "context": {
                      "millisElapsed": 0.668684,
                      "invocationCounts": {
                        "createWeight": 5,
                        "createScorer": 15
                      }
                    },
                    "match": {
                      "millisElapsed": 0.080215,
                      "invocationCounts": {
                        "nextDoc": 225
                      }
                    },
                    "score": {
                      "millisElapsed": 0.116348,
                      "invocationCounts": {
                        "score": 220
                      }
                    }
                  }
                },
                {
                  "type": "TermQuery",
                  "args": {
                    "path": "title",
                    "value": "alien"
                  },
                  "stats": {
                    "context": {
                      "millisElapsed": 0.576561,
                      "invocationCounts": {
                        "createWeight": 5,
                        "createScorer": 15
                      }
                    },
                    "match": {
                      "millisElapsed": 0.008795,
                      "invocationCounts": {
                        "nextDoc": 25
                      }
                    },
                    "score": {
                      "millisElapsed": 0.004889,
                      "invocationCounts": {
                        "score": 20
                      }
                    }
                  }
                },
                {
                  "type": "TermQuery",
                  "args": {
                    "path": "plot",
                    "value": "alien"
                  },
                  "stats": {
                    "context": {
                      "millisElapsed": 0.475493,
                      "invocationCounts": {
                        "createWeight": 5,
                        "createScorer": 15
                      }
                    },
                    "match": {
                      "millisElapsed": 0.068629,
                      "invocationCounts": {
                        "nextDoc": 220
                      }
                    },
                    "score": {
                      "millisElapsed": 0.12279,
                      "invocationCounts": {
                        "score": 215
                      }
                    }
                  }
                },
                {
                  "type": "TermQuery",
                  "args": {
                    "path": "title",
                    "value": "space"
                  },
                  "stats": {
                    "context": {
                      "millisElapsed": 0.405559,
                      "invocationCounts": {
                        "createWeight": 5,
                        "createScorer": 15
                      }
                    },
                    "match": {
                      "millisElapsed": 0.017018,
                      "invocationCounts": {
                        "nextDoc": 40
                      }
                    },
                    "score": {
                      "millisElapsed": 0.006347,
                      "invocationCounts": {
                        "score": 35
                      }
                    }
                  }
                },
                {
                  "type": "TermQuery",
                  "args": {
                    "path": "genres",
                    "value": "adventure"
                  },
                  "stats": {
                    "context": {
                      "millisElapsed": 0.461156,
                      "invocationCounts": {
                        "createWeight": 5,
                        "createScorer": 15
                      }
                    },
                    "match": {
                      "millisElapsed": 1.112313,
                      "invocationCounts": {
                        "nextDoc": 4620
                      }
                    },
                    "score": {
                      "millisElapsed": 0.33311,
                      "invocationCounts": {
                        "score": 4615
                      }
                    }
                  }
                },
                {
                  "type": "TermQuery",
                  "args": {
                    "path": "title",
                    "value": "adventure"
                  },
                  "stats": {
                    "context": {
                      "millisElapsed": 2.338158,
                      "invocationCounts": {
                        "createWeight": 5,
                        "createScorer": 15
                      }
                    },
                    "match": {
                      "millisElapsed": 0.030198,
                      "invocationCounts": {
                        "nextDoc": 55
                      }
                    },
                    "score": {
                      "millisElapsed": 0.008313,
                      "invocationCounts": {
                        "score": 50
                      }
                    }
                  }
                },
                {
                  "type": "TermQuery",
                  "args": {
                    "path": "genres",
                    "value": "space"
                  },
                  "stats": {
                    "context": {
                      "millisElapsed": 0.209677,
                      "invocationCounts": {
                        "createWeight": 5,
                        "createScorer": 5
                      }
                    },
                    "match": {
                      "millisElapsed": 0
                    },
                    "score": {
                      "millisElapsed": 0
                    }
                  }
                }
              ],
              "filter": [],
              "minimumShouldMatch": 0
            },
            "stats": {
              "context": {
                "millisElapsed": 7.405105,
                "invocationCounts": {
                  "createWeight": 5,
                  "createScorer": 10
                }
              },
              "match": {
                "millisElapsed": 2.222915,
                "invocationCounts": {
                  "nextDoc": 4895
                }
              },
              "score": {
                "millisElapsed": 2.493474,
                "invocationCounts": {
                  "score": 4890
                }
              }
            }
          },
          "collectors": {
            "allCollectorStats": {
              "millisElapsed": 3.685343,
              "invocationCounts": {
                "collect": 4890,
                "competitiveIterator": 5,
                "setScorer": 5
              }
            }
          },
          "resultMaterialization": {
            "stats": {
              "millisElapsed": 29.375847,
              "invocationCounts": {
                "retrieveAndSerialize": 5
              }
            }
          },
          "metadata": {
            "mongotVersion": "1.49.5",
            "mongotHostName": "atlas-a8gkn0-shard-00-02.lia43.mongodb.net",
            "indexName": "movies_text_index",
            "cursorOptions": {
              "batchSize": 108,
              "requiresSearchSequenceToken": false
            },
            "lucene": {
              "totalSegments": 1,
              "totalDocs": 3483
            }
          },
          "resourceUsage": {
            "majorFaults": 0,
            "minorFaults": 32,
            "userTimeMs": 40,
            "systemTimeMs": 10,
            "maxReportingThreads": 1,
            "numBatches": 5
          }
        },
        "requiresSearchMetaCursor": false,
        "internalMongotBatchSizeHistory": [
          108, 162, 243, 365, 548
        ]
      },
      "nReturned": 978,
      "executionTimeMillisEstimate": 95
    },
    {
      "$_internalSearchIdLookup": {
        "subPipeline": [
          {
            "$match": {
              "_id": { "$eq": "_id placeholder" }
            }
          }
        ],
        "totalDocsExamined": 978,
        "totalKeysExamined": 978,
        "numDocsFilteredByIdLookup": 0
      },
      "nReturned": 978,
      "executionTimeMillisEstimate": 166
    },
    {
      "$replaceRoot": {
        "newRoot": { "docs": "$$ROOT" }
      },
      "nReturned": 978,
      "executionTimeMillisEstimate": 167
    },
    {
      "$_internalSetWindowFields": {
        "sortBy": { "order": 1 },
        "output": {
          "fullTextPipeline_rank": { "$rank": {} }
        }
      },
      "maxFunctionMemoryUsageBytes": {
        "fullTextPipeline_rank": 344
      },
      "maxTotalMemoryUsageBytes": 37892,
      "usedDisk": false,
      "nReturned": 978,
      "executionTimeMillisEstimate": 167
    },
    {
      "$addFields": {
        "fullTextPipeline_score": {
          "$multiply": [
            {
              "$divide": [
                { "$const": 1 },
                {
                  "$add": [
                    "$fullTextPipeline_rank",
                    { "$const": 60 }
                  ]
                }
              ]
            },
            { "$const": 0.5 }
          ]
        }
      },
      "nReturned": 978,
      "executionTimeMillisEstimate": 167
    },
    {
      "$addFields": {
        "fullTextPipeline_scoreDetails": {
          "value": { "$meta": "score" },
          "details": { "$const": [] }
        }
      },
      "nReturned": 978,
      "executionTimeMillisEstimate": 167
    },
    {
      "$unionWith": {
        "coll": "embedded_movies",
        "pipeline": [
          {
            "$vectorSearch": {
              "index": "movies_vector_index",
              "path": "plot_embedding_voyage_3_large",
              "queryVector": "redacted",
              "numCandidates": 100,
              "limit": 50,
              "explain": {
                "query": {
                  "type": "WrappedKnnQuery",
                  "args": {
                    "query": [
                      {
                        "type": "InstrumentableKnnFloatVectorQuery",
                        "args": {
                          "field": "$type:knnVector/plot_embedding_voyage_3_large",
                          "k": 100
                        },
                        "stats": {
                          "context": {
                            "millisElapsed": 0
                          },
                          "match": {
                            "millisElapsed": 0
                          },
                          "score": {
                            "millisElapsed": 0
                          }
                        }
                      },
                      {
                        "type": "DocAndScoreQuery",
                        "args": {},
                        "stats": {
                          "context": {
                            "millisElapsed": 0.01138,
                            "invocationCounts": {
                              "createWeight": 1,
                              "createScorer": 4
                            }
                          },
                          "match": {
                            "millisElapsed": 0.006359,
                            "invocationCounts": {
                              "nextDoc": 102
                            }
                          },
                          "score": {
                            "millisElapsed": 0.009441,
                            "invocationCounts": {
                              "score": 100,
                              "setMinCompetitiveScore": 32
                            }
                          }
                        }
                      }
                    ]
                  },
                  "stats": {
                    "context": {
                      "millisElapsed": 2.936576,
                      "invocationCounts": {
                        "vectorExecution": 1,
                        "createWeight": 1,
                        "createScorer": 4
                      }
                    },
                    "match": {
                      "millisElapsed": 0.006359,
                      "invocationCounts": {
                        "nextDoc": 102
                      }
                    },
                    "score": {
                      "millisElapsed": 0.009441,
                      "invocationCounts": {
                        "score": 100,
                        "setMinCompetitiveScore": 32
                      }
                    }
                  }
                },
                "collectors": {
                  "allCollectorStats": {
                    "millisElapsed": 0.076853,
                    "invocationCounts": {
                      "collect": 100,
                      "competitiveIterator": 2,
                      "setScorer": 2
                    }
                  }
                },
                "metadata": {
                  "mongotVersion": "1.49.5",
                  "mongotHostName": "atlas-a8gkn0-shard-00-02.lia43.mongodb.net",
                  "indexName": "movies_vector_index",
                  "lucene": {
                    "totalSegments": 2,
                    "totalDocs": 3483
                  }
                },
                "resourceUsage": {
                  "majorFaults": 0,
                  "minorFaults": 0,
                  "userTimeMs": 0,
                  "systemTimeMs": 0,
                  "maxReportingThreads": 1,
                  "numBatches": 1
                },
                "luceneVectorSegmentStats": [
                  {
                    "executionType": "Approximate",
                    "docCount": 2479,
                    "approximateStage": {
                      "millisElapsed": 1.485543
                    }
                  },
                  {
                    "executionType": "Approximate",
                    "docCount": 1004,
                    "approximateStage": {
                      "millisElapsed": 1.06125
                    }
                  }
                ]
              }
            },
            "nReturned": 50,
            "executionTimeMillisEstimate": 25
          },
          {
            "$_internalSearchIdLookup": {
              "limit": 50,
              "subPipeline": [
                {
                  "$match": {
                    "_id": {
                      "$eq": "_id placeholder"
                    }
                  }
                }
              ],
              "totalDocsExamined": 50,
              "totalKeysExamined": 50,
              "numDocsFilteredByIdLookup": 0
            },
            "nReturned": 50,
            "executionTimeMillisEstimate": 27
          },
          {
            "$replaceRoot": {
              "newRoot": { "docs": "$$ROOT" }
            },
            "nReturned": 50,
            "executionTimeMillisEstimate": 27
          },
          {
            "$_internalSetWindowFields": {
              "sortBy": { "order": 1 },
              "output": {
                "vectorPipeline_rank": {
                  "$rank": {}
                }
              }
            },
            "maxFunctionMemoryUsageBytes": {
              "vectorPipeline_rank": 344
            },
            "maxTotalMemoryUsageBytes": 36700,
            "usedDisk": false,
            "nReturned": 50,
            "executionTimeMillisEstimate": 27
          },
          {
            "$addFields": {
              "vectorPipeline_score": {
                "$multiply": [
                  {
                    "$divide": [
                      { "$const": 1 },
                      {
                        "$add": [
                          "$vectorPipeline_rank",
                          { "$const": 60 }
                        ]
                      }
                    ]
                  },
                  { "$const": 0.5 }
                ]
              }
            },
            "nReturned": 50,
            "executionTimeMillisEstimate": 27
          },
          {
            "$addFields": {
              "vectorPipeline_scoreDetails": {
                "value": { "$meta": "score" },
                "details": []
              }
            },
            "nReturned": 50,
            "executionTimeMillisEstimate": 27
          }
        ]
      },
      "nReturned": 1028,
      "executionTimeMillisEstimate": 199
    },
    {
      "$group": {
        "_id": "$docs._id",
        "docs": { "$first": "$docs" },
        "fullTextPipeline_score": {
          "$max": {
            "$ifNull": [
              "$fullTextPipeline_score",
              { "$const": 0 }
            ]
          }
        },
        "fullTextPipeline_rank": {
          "$max": {
            "$ifNull": [
              "$fullTextPipeline_rank",
              { "$const": 0 }
            ]
          }
        },
        "fullTextPipeline_scoreDetails": {
          "$mergeObjects": "$fullTextPipeline_scoreDetails"
        },
        "vectorPipeline_score": {
          "$max": {
            "$ifNull": [
              "$vectorPipeline_score",
              { "$const": 0 }
            ]
          }
        },
        "vectorPipeline_rank": {
          "$max": {
            "$ifNull": [
              "$vectorPipeline_rank",
              { "$const": 0 }
            ]
          }
        },
        "vectorPipeline_scoreDetails": {
          "$mergeObjects": "$vectorPipeline_scoreDetails"
        }
      },
      "maxAccumulatorMemoryUsageBytes": {
        "docs": 16237053,
        "fullTextPipeline_score": 86768,
        "fullTextPipeline_rank": 86768,
        "fullTextPipeline_scoreDetails": 78880,
        "vectorPipeline_score": 86768,
        "vectorPipeline_rank": 86768,
        "vectorPipeline_scoreDetails": 78880
      },
      "totalOutputDataSizeBytes": 17173907,
      "usedDisk": false,
      "spills": 0,
      "spilledDataStorageSize": 0,
      "numBytesSpilledEstimate": 0,
      "spilledRecords": 0,
      "nReturned": 986,
      "executionTimeMillisEstimate": 199
    },
    {
      "$addFields": {
        "score": {
          "$add": [
            "$fullTextPipeline_score",
            "$vectorPipeline_score"
          ]
        }
      },
      "nReturned": 986,
      "executionTimeMillisEstimate": 199
    },
    {
      "$addFields": {
        "calculatedScoreDetails": [
          {
            "$mergeObjects": [
              {
                "inputPipelineName": {
                  "$const": "fullTextPipeline"
                },
                "rank": "$fullTextPipeline_rank",
                "weight": { "$const": 0.5 }
              },
              "$fullTextPipeline_scoreDetails"
            ]
          },
          {
            "$mergeObjects": [
              {
                "inputPipelineName": {
                  "$const": "vectorPipeline"
                },
                "rank": "$vectorPipeline_rank",
                "weight": { "$const": 0.5 }
              },
              "$vectorPipeline_scoreDetails"
            ]
          }
        ]
      },
      "nReturned": 986,
      "executionTimeMillisEstimate": 199
    },
    {
      "$setMetadata": {
        "scoreDetails": {
          "value": "$score",
          "description": {
            "$const": "value output by reciprocal rank fusion algorithm, computed as sum of (weight * (1 / (60 + rank))) across input pipelines from which this document is output, from:"
          },
          "details": "$calculatedScoreDetails"
        }
      },
      "nReturned": 986,
      "executionTimeMillisEstimate": 199
    },
    {
      "$sort": {
        "sortKey": { "score": -1, "_id": 1 }
      },
      "totalDataSizeSortedBytesEstimate": 19920319,
      "usedDisk": false,
      "spills": 0,
      "spilledDataStorageSize": 0,
      "nReturned": 986,
      "executionTimeMillisEstimate": 201
    },
    {
      "$replaceRoot": { "newRoot": "$docs" },
      "nReturned": 986,
      "executionTimeMillisEstimate": 211
    },
    {
      "$group": {
        "_id": "$decade",
        "top_movie": { "$first": "$$ROOT" },
        "avg_rating": { "$avg": "$imdb.rating" },
        "count": { "$sum": { "$const": 1 } }
      },
      "maxAccumulatorMemoryUsageBytes": {
        "top_movie": 18135,
        "avg_rating": 120,
        "count": 144
      },
      "totalOutputDataSizeBytes": 18356,
      "usedDisk": false,
      "spills": 0,
      "spilledDataStorageSize": 0,
      "numBytesSpilledEstimate": 0,
      "spilledRecords": 0,
      "nReturned": 1,
      "executionTimeMillisEstimate": 221
    }
  ],
  "queryShapeHash": "2B07072956F32E42D8D50AC45216488ED894B5EC592C5DB3DA33258FAE5B0CEE",
  "serverInfo": {
    "host": "atlas-a8gkn0-shard-00-02.lia43.mongodb.net",
    "port": 27017,
    "version": "8.1.2",
    "gitVersion": "bcba0709b2665cca6b1b44a1803a6f8249e6ee39"
  },
  "serverParameters": {
    "internalQueryFacetBufferSizeBytes": 104857600,
    "internalQueryFacetMaxOutputDocSizeBytes": 104857600,
    "internalLookupStageIntermediateDocumentMaxSizeBytes": 104857600,
    "internalDocumentSourceGroupMaxMemoryBytes": 104857600,
    "internalQueryMaxBlockingSortMemoryUsageBytes": 104857600,
    "internalQueryProhibitBlockingMergeOnMongoS": 0,
    "internalQueryMaxAddToSetBytes": 104857600,
    "internalDocumentSourceSetWindowFieldsMaxMemoryBytes": 104857600,
    "internalQueryFrameworkControl": "trySbeRestricted",
    "internalQueryPlannerIgnoreIndexWithCollationForRegex": 1
  },
  "command": {
    "aggregate": "embedded_movies",
    "pipeline": [
      {
        "$rankFusion": {
          "input": {
            "pipelines": {
              "fullTextPipeline": [
                {
                  "$search": {
                    "index": "movies_text_index",
                    "text": {
                      "query": "space adventure alien",
                      "path": [
                        "plot",
                        "title",
                        "genres"
                      ]
                    }
                  }
                }
              ],
              "vectorPipeline": [
                {
                  "$vectorSearch": {
                    "index": "movies_vector_index",
                    "path": "plot_embedding_voyage_3_large",
                    "queryVector": [
                      -0.025189938, 0.014741838,
                      -0.013024342, -0.0197512,
                      0.011235285, 0.004651551,
                      0.043509893, 0.003112961,
                      0.013310592, -0.033348043,
                      0.037212405, -0.021039322,
                      -0.026048684, 0.012809656,
                      0.029483676, 0.003578116,
                      -0.044654887, 0.032632418,
                      0.014312465, -0.058967352,
                      0.025333062, -0.055246111,
                      0.02189807, -0.017604331,
                      -0.002880384, 0.045227386,
                      0.004794675, 0.017604331,
                      0.023186192, -0.054673612,
                      -0.011306847, -0.012523406,
                      -0.012380281, 0.002540462,
                      0.015958399, -0.042364895,
                      -0.001467028, -0.020180576,
                      -0.058108605, -0.035065539,
                      0.010090288, -0.033348043,
                      0.058394853, -0.013883091,
                      0.002048471, -0.020753073,
                      -0.029769925, 0.031916797,
                      -0.014741838, -0.040933646,
                      -0.004096943, 0.020753073,
                      -0.002540462, 0.028052431,
                      -0.02404494, 0.006547953,
                      -0.003578116, 0.003757022,
                      0.019178702, -0.037784904,
                      -0.02833868, 0.01753277,
                      0.029769925, 0.017747456,
                      -0.031344298, 0.022899942,
                      0.006333265, 0.010376536,
                      -0.024474313, -0.012094032,
                      -0.004651551, 0.007764512,
                      0.017962143, 0.013811528,
                      0.037212405, -0.03148742,
                      0.000666424, 0.024474313,
                      -0.021325571, 0.041219898,
                      0.011235285, 0.046658635,
                      0.019035578, 0.020753073,
                      0.010662786, -0.001726441,
                      -0.012738093, -0.027193682,
                      -0.014598713, -0.013167467,
                      0.013596841, 0.001932183,
                      -0.010304974, -0.007478263,
                      0.005689205, 0.002987727,
                      0.005724986, 0.002325775,
                      0.002415228, -0.003828584,
                      -0.029340552, -0.017318081,
                      -0.070417322, 0.003810694,
                      -0.013453716, -0.001628043,
                      -0.027909305, 0.014026215,
                      0.009589351, 0.004902019,
                      0.028768053, -0.005259831,
                      -0.010448099, 0.025189938,
                      0.038357403, 0.048662379,
                      0.039788652, 0.010448099,
                      0.001574371, 0.020323699,
                      0.005510299, 0.026907433,
                      0.043223642, -0.001153942,
                      -0.010233412, 0.048376128,
                      -0.056104861, 0.006691077,
                      0.015672149, -0.015028087,
                      0.036210533, -0.009231539,
                      0.010519661, 0.022899942,
                      0.025762435, -0.009052633,
                      -0.0301993, 0.032203045,
                      -0.00522405, 0.029626802,
                      -0.02433119, -0.025619311,
                      0.016674021, 0.02404494,
                      -0.009589351, -0.026334934,
                      -0.04436864, -0.014455589,
                      0.02619181, 0.017604331,
                      0.02189807, -0.007728731,
                      -0.021611821, -0.03363429,
                      0.008480135, -0.027479932,
                      0.025046812, -0.006047016,
                      0.020753073, 0.01016185,
                      -0.034063663, 0.029483676,
                      -0.019035578, 0.041506145,
                      0.013453716, -0.009159978,
                      0.007549825, 0.025189938,
                      0.005152487, -0.009446226,
                      -0.009016853, 0.021325571,
                      0.030771798, -0.046944883,
                      0.001314958, 0.021182448,
                      0.047231134, -0.007048889,
                      -0.030771798, -0.025905561,
                      -0.000612752, -0.023186192,
                      0.011378409, 0.035065539,
                      0.007979199, 0.023901815,
                      -0.004973582, 0.005188268,
                      -0.046944883, 0.009374664,
                      0.047231134, 0.058967352,
                      0.043509893, 0.011449971,
                      0.017174957, -0.024188064,
                      -0.025476186, -0.02833868,
                      0.033061791, 0.015314337,
                      -0.018749328, 0.013382155,
                      0.007048889, 0.005975454,
                      0.005295612, -0.013310592,
                      -0.022756819, -0.012523406,
                      -0.03363429, -0.014527151,
                      0.011449971, 0.01202247,
                      0.044941138, -0.012594969,
                      0.002862493, 0.000572499,
                      0.030628674, -0.0098756,
                      0.020466823, 0.059539851,
                      -0.00370335, 0.007335138,
                      0.023901815, 0.023758691,
                      -0.005903892, 0.003918037,
                      0.013310592, 0.010090288,
                      -0.012809656, -0.010376536,
                      -0.01109216, -0.008086543,
                      0.012809656, -0.019894326,
                      0.012738093, 0.056391109,
                      0.029340552, -0.04436864,
                      -0.001619098, 0.042364895,
                      -0.027623056, 0.011593096,
                      -0.031916797, -0.0301993,
                      0.032203045, -0.003757022,
                      0.017174957, 0.033491168,
                      0.003900147, 0.002325775,
                      0.006726858, 0.020180576,
                      0.017389644, 0.009088415,
                      0.018319955, -0.003631788,
                      0.00586811, -0.006691077,
                      -0.014240902, -0.009052633,
                      0.031630546, 0.04436864,
                      -0.022899942, -0.003327648,
                      -0.006691077, 0.013310592,
                      -0.035924286, -0.008158104,
                      -0.005116706, -0.040647399,
                      0.002397338, 0.014455589,
                      -0.030342424, 0.028624929,
                      -0.031773672, 0.043509893,
                      -0.001833785, -0.025619311,
                      0.032775544, -0.046944883,
                      0.013739966, -0.030485548,
                      0.018319955, 0.016745584,
                      -0.020323699, -0.015815273,
                      -0.020896198, -0.015171212,
                      0.026334934, 0.035638034,
                      0.008873728, 0.003291867,
                      -0.02647806, 0.003649678,
                      0.003613897, 0.009804038,
                      -0.013525278, 0.005367174,
                      0.007657168, -0.017103394,
                      -0.015815273, -0.000398065,
                      0.013310592, 0.014240902,
                      0.003935928, 0.001735386,
                      -0.018606203, 0.008265448,
                      -0.068127327, 0.012165595,
                      -0.007836075, 0.02189807,
                      -0.000983982, 0.019178702,
                      -0.009589351, -0.013739966,
                      -0.007800293, 0.040361151,
                      0.027623056, -0.002540462,
                      -0.03663991, 0.011163722,
                      -0.016316209, -0.006333265,
                      -0.010877473, -0.023329318,
                      -0.021468697, 0.013596841,
                      0.032059919, 0.007442481,
                      0.02433119, -0.003613897,
                      -0.013596841, 0.010448099,
                      0.010877473, -0.0098756,
                      0.033920541, -0.006691077,
                      -0.039502401, -0.010877473,
                      -0.016960271, 0.014097777,
                      -0.008122323, 0.007478263,
                      0.010018725, -0.030485548,
                      -0.011020597, 0.000317558,
                      0.00461577, 0.020466823,
                      0.070703574, -0.024617439,
                      0.002111088, -0.024617439,
                      -0.004204286, -0.048662379,
                      -0.006834202, 0.027766181,
                      -0.002504681, 0.025189938,
                      0.033920541, -0.02833868,
                      -0.000773768, -0.03578116,
                      0.015958399, 0.006369046,
                      0.033204917, -0.006762639,
                      0.02003745, -0.020180576,
                      0.015886836, -0.015385899,
                      -0.029340552, -0.009446226,
                      0.015529023, -0.010376536,
                      -0.012881218, -0.000715623,
                      0.014312465, -0.029197427,
                      -0.000684315, 0.000360048,
                      0.015815273, -0.027050557,
                      0.006655296, 0.018892452,
                      -0.021182448, 0.031201173,
                      0.014240902, -0.022756819,
                      0.004365302, -0.020609949,
                      0.008515916, -0.016244646,
                      0.001162888, 0.000084421,
                      0.003273976, -0.017819017,
                      0.000576971, 0.020753073,
                      -0.004794675, 0.018105267,
                      -0.013095905, -0.028052431,
                      0.004114834, 0.02833868,
                      -0.027193682, -0.010877473,
                      -0.002576244, 0.011879345,
                      -0.017819017, 0.006726858,
                      -0.021754947, -0.031773672,
                      -0.013382155, 0.024903689,
                      0.013167467, 0.000033964,
                      0.034063663, 0.022613693,
                      -0.038357403, -0.010018725,
                      -0.017174957, -0.004418973,
                      0.02189807, -0.003166633,
                      -0.009589351, 0.009303101,
                      -0.036496785, -0.005760767,
                      -0.006583733, -0.003596007,
                      0.014026215, -0.003828584,
                      -0.02833868, -0.020896198,
                      0.001449137, 0.039502401,
                      0.012881218, 0.025476186,
                      0.000961619, -0.025762435,
                      0.002808821, 0.034922414,
                      0.004687332, -0.046658635,
                      0.030914923, -0.036067411,
                      0.008659041, -0.004025381,
                      -0.0301993, -0.026048684,
                      0.024760563, 0.036496785,
                      -0.029913051, 0.015672149,
                      0.007764512, 0.01509965,
                      0.010304974, -0.004490536,
                      -0.007585606, -0.019464951,
                      0.016602458, -0.007048889,
                      -0.005510299, 0.011163722,
                      0.013739966, -0.034636162,
                      0.020609949, -0.004418973,
                      0.034636162, 0.040933646,
                      0.031773672, 0.023758691,
                      0.031344298, -0.006798421,
                      0.026048684, -0.011521534,
                      0.020753073, 0.014384027,
                      0.026334934, -0.034206789,
                      -0.036067411, 0.014598713,
                      0.023758691, -0.039216153,
                      0.003363429, 0.002880384,
                      -0.006726858, -0.000916892,
                      -0.001395465, -0.009660914,
                      0.032059919, 0.008086543,
                      0.029054303, -0.011593096,
                      0.065551087, 0.031058047,
                      -0.041219898, -0.014097777,
                      -0.017103394, 0.016244646,
                      -0.028911177, 0.044654887,
                      -0.030771798, 0.024760563,
                      0.02833868, 0.018248392,
                      0.026907433, -0.002227377,
                      0.034063663, 0.000167724,
                      0.021039322, -0.018892452,
                      0.012738093, -0.001395465,
                      0.005760767, -0.024760563,
                      -0.002683587, 0.000230341,
                      -0.0197512, 0.009088415,
                      -0.00400749, -0.026764309,
                      -0.012881218, 0.016101522,
                      -0.009303101, 0.015529023,
                      -0.016817145, 0.014312465,
                      -0.030914923, -0.018463079,
                      0.020323699, -0.023472441,
                      -0.023758691, -0.005009362,
                      0.018176829, 0.012738093,
                      0.009374664, -0.031916797,
                      0.016387772, 0.027479932,
                      0.015529023, -0.021325571,
                      0.020323699, -0.025476186,
                      0.008515916, -0.039788652,
                      -0.007979199, -0.009947163,
                      -0.006869983, 0.004758894,
                      0.022613693, -0.013668403,
                      -0.015171212, 0.035351787,
                      -0.022327444, 0.019178702,
                      0.000404774, -0.003524444,
                      -0.012094032, 0.023901815,
                      -0.0400749, -0.004579989,
                      0.00245101, 0.013024342,
                      0.015958399, 0.009517789,
                      0.034779288, 0.021468697,
                      0.00062617, 0.007728731,
                      -0.028195554, 0.0301993,
                      -0.002504681, 0.008909509,
                      0.004651551, -0.007013108,
                      0.03148742, 0.019608077,
                      0.002540462, 0.043509893,
                      -0.006190141, 0.024903689,
                      0.010519661, 0.018319955,
                      0.010519661, 0.009660914,
                      0.000966091, -0.004454754,
                      0.000299667, 0.007907636,
                      -0.018463079, 0.004758894,
                      -0.001851675, -0.002415228,
                      0.010233412, -0.024617439,
                      -0.030771798, 0.018749328,
                      0.003023508, 0.005474518,
                      -0.011521534, -0.008551697,
                      0.007979199, 0.03363429,
                      0.000275068, 0.007800293,
                      0.0039896, 0.00522405,
                      -0.035924286, -0.01416934,
                      0.02619181, -0.025476186,
                      -0.033777416, 0.021325571,
                      -0.02218432, 0.001833785,
                      0.027766181, -0.006118578,
                      0.032059919, 0.038929902,
                      0.003613897, 0.031344298,
                      -0.002737259, 0.057536107,
                      0.009732476, 0.020753073,
                      0.005402955, -0.047803629,
                      -0.040933646, 0.009052633,
                      -0.030485548, 0.018319955,
                      0.025046812, -0.002361557,
                      0.045513637, 0.008766385,
                      -0.031058047, 0.014312465,
                      0.002737259, -0.004186396,
                      0.032059919, 0.024617439,
                      -0.012666531, 0.006798421,
                      0.02619181, -0.012523406,
                      0.009947163, 0.005617642,
                      0.039216153, 0.008766385,
                      0.009517789, 0.042651143,
                      -0.012881218, 0.007263576,
                      -0.000514354, 0.016817145,
                      -0.048948627, 0.018176829,
                      0.034922414, 0.005331393,
                      0.000391356, -0.017604331,
                      0.026048684, -0.011807784,
                      0.017461207, 0.012809656,
                      0.029483676, -0.017174957,
                      0.023472441, 0.005188268,
                      0.007585606, -0.034922414,
                      0.069558576, 0.023472441,
                      -0.010304974, 0.020180576,
                      0.025046812, 0.016459335,
                      0.000317558, -0.018606203,
                      0.066696085, 0.011664659,
                      0.025762435, -0.016888708,
                      0.015314337, -0.009231539,
                      0.016459335, -0.021325571,
                      0.009303101, 0.000840857,
                      -0.014455589, 0.00170855,
                      0.014741838, -0.004168505,
                      -0.009088415, -0.0074067,
                      -0.004472645, 0.002665696,
                      0.023615567, 0.038929902,
                      -0.016960271, -0.027193682,
                      0.03663991, -0.016530896,
                      0.003256086, 0.015171212,
                      0.036926158, 0.02433119,
                      0.047231134, -0.049234878,
                      0.009947163, -0.01109216,
                      -0.014097777, -0.007585606,
                      0.00338132, -0.008086543,
                      0.018176829, -0.014527151,
                      -0.000205742, -0.041219898,
                      0.012666531, 0.046086136,
                      0.004025381, -0.0074067,
                      0.033348043, -0.020896198,
                      -0.000514354, 0.033491168,
                      0.004257958, 0.02404494,
                      -0.008372792, -0.021754947,
                      0.037784904, 0.013453716,
                      0.013024342, -0.026334934,
                      0.023758691, 0.012094032,
                      0.006297485, 0.045227386,
                      0.021039322, -0.020323699,
                      0.005975454, 0.008802165,
                      0.00370335, 0.006941545,
                      -0.029340552, -0.008551697,
                      -0.004454754, 0.003488663,
                      0.010662786, 0.00801498,
                      0.010090288, 0.015600586,
                      0.018105267, -0.020180576,
                      -0.00307718, 0.031630546,
                      0.000644061, 0.011950907,
                      -0.023472441, 0.01509965,
                      -0.035924286, 0.016459335,
                      -0.027766181, -0.014598713,
                      -0.021611821, -0.013310592,
                      -0.021039322, -0.02189807,
                      0.018606203, -0.007979199,
                      0.018176829, 0.022041194,
                      -0.002916165, 0.009088415,
                      -0.00522405, -0.018176829,
                      -0.031916797, -0.017318081,
                      -0.025476186, -0.014527151,
                      -0.017675893, -0.026621183,
                      0.000362284, 0.02619181,
                      0.016101522, -0.013310592,
                      0.021325571, 0.027909305,
                      0.016316209, 0.006011235,
                      0.008551697, 0.030914923,
                      -0.070703574, 0.004794675,
                      -0.019321827, -0.011163722,
                      -0.014598713, -0.0197512,
                      -0.005438737, -0.025189938,
                      -0.037212405, 0.004168505,
                      -0.021754947, 0.018033706,
                      0.035065539, 0.022756819,
                      0.005581861, -0.007764512,
                      -0.003005618, -0.003524444,
                      0.006655296, -0.00170855,
                      -0.046086136, -0.009374664,
                      0.001744332, 0.030056175,
                      0.016674021, 0.014312465,
                      0.029054303, -0.009052633,
                      0.005832329, -0.029197427,
                      -0.004723113, 0.032489292,
                      0.022899942, -0.044941138,
                      0.014026215, -0.007227794,
                      -0.035494912, 0.001261286,
                      0.079004802, 0.008122323,
                      0.022041194, 0.016602458,
                      0.046658635, -0.016888708,
                      -0.006547953, -0.016316209,
                      0.002021636, -0.016745584,
                      0.003792803, 0.005116706,
                      -0.037784904, -0.028481804,
                      -0.014670276, -0.005259831,
                      0.018892452, 0.001252341,
                      -0.068699829, -0.021611821,
                      -0.015242774, -0.027050557,
                      -0.032059919, 0.026048684,
                      -0.014240902, -0.007013108,
                      0.014598713, -0.005474518,
                      -0.007192013, -0.016817145,
                      0.00400749, 0.010519661,
                      0.007657168, 0.005295612,
                      0.009124196, 0.024474313,
                      -0.019894326, -0.044941138,
                      -0.022756819, -0.022327444,
                      -0.041792396, 0.027479932,
                      -0.013668403, -0.036210533,
                      0.001225505, 0.009947163,
                      -0.044654887, -0.02003745,
                      0.031344298, -0.004186396,
                      -0.009517789, 0.000720096,
                      -0.023901815, 0.000670897,
                      0.022899942, 0.006619515,
                      0.006512171, 0.022327444,
                      0.021468697, 0.021611821,
                      0.039216153, -0.019608077,
                      0.028052431, -0.020466823,
                      -0.0197512, 0.004454754,
                      0.026048684, -0.024617439,
                      -0.000333212, 0.002200541,
                      -0.002629915, 0.021611821,
                      0.009374664, 0.00894529,
                      -0.057822354, -0.009660914,
                      -0.002844602, 0.020323699,
                      0.000603807, 0.018033706,
                      -0.027050557, -0.004186396,
                      -0.019608077, -0.021754947,
                      0.009732476, 0.01602996,
                      -0.016960271, -0.001520699,
                      -0.023615567, 0.004383192,
                      0.000925838, 0.023043068,
                      0.032775544, 0.006404828,
                      -0.010304974, 0.019321827,
                      0.017604331, -0.01230872,
                      0.007657168, 0.005402955,
                      -0.03148742, -0.000550135,
                      -0.002111088, -0.029626802,
                      0.01323903, -0.033777416,
                      0.006655296, 0.035065539,
                      -0.003256086, 0.000907947,
                      0.004025381, 0.011020597,
                      -0.04808988, 0.02619181,
                      0.015171212, 0.023758691,
                      0.014741838, -0.001359684,
                      -0.041506145, -0.009088415,
                      -0.012738093, 0.000176669,
                      0.033777416, 0.024188064,
                      -0.002307885, 0.023901815,
                      0.00034663, -0.024474313,
                      -0.031773672, -0.023758691,
                      -0.024474313, -0.011163722,
                      0.000447265, 0.005080925,
                      -0.00123445, 0.006297485,
                      -0.031058047, -0.012738093,
                      -0.003059289, -0.026907433,
                      -0.015672149, -0.005760767,
                      0.023043068, 0.023043068,
                      -0.015028087, 0.017747456,
                      0.013883091, -0.011807784,
                      0.038357403, -0.016817145,
                      0.014884963, 0.017389644,
                      -0.000599334, 0.016602458,
                      0.008086543, -0.039502401,
                      0.050379876, -0.024474313,
                      0.035351787, -0.023758691,
                      0.002039526, 0.004061162,
                      -0.012165595, -0.020180576,
                      0.001636988, -0.013883091,
                      0.017389644, 0.006225922,
                      -0.03578116, -0.016817145,
                      -0.001332848, -0.005617642,
                      -0.008730603, -0.039216153,
                      0.02433119, 0.028052431,
                      0.02833868, 0.039502401,
                      0.010233412, -0.006869983,
                      0.021468697, 0.002039526,
                      -0.0197512, 0.020753073,
                      0.027050557, 0.009517789,
                      0.011449971, 0.038929902,
                      0.008873728, 0.009374664,
                      0.007871855, -0.006082797,
                      -0.007156232, -0.014670276,
                      -0.000447265, 0.046944883,
                      -0.015242774, -0.019894326,
                      0.008158104, 0.016173085,
                      -0.018463079, 0.034922414,
                      -0.005009362, -0.000092248,
                      0.005760767, 0.006190141,
                      -0.022613693, 0.034206789,
                      0.012523406, 0.000992927,
                      0.038071156, -0.048376128,
                      -0.017747456, 0.014384027,
                      0.000751404, 0.015314337,
                      -0.010519661, 0.058681104,
                      0.013954652, 0.022899942,
                      -0.003757022, 0.01416934,
                      -0.000469628, -0.008337011,
                      -0.001153942, 0.02189807,
                      -0.024760563, 0.01416934,
                      -0.012738093, -0.025046812,
                      0.030771798, -0.046658635,
                      -0.002137924, 0.053242367,
                      0.010090288, -0.046086136,
                      0.016316209, -0.005295612,
                      0.023043068, -0.023043068,
                      0.010233412, -0.018319955,
                      -0.017389644, 0.030485548,
                      0.009660914, 0.017174957,
                      0.050379876, -0.010304974,
                      0.017819017, -0.000364521,
                      0.011163722, 0.001753277,
                      0.010448099, 0.013095905,
                      0.008372792, -0.01109216,
                      0.036926158, -0.015672149,
                      -0.014598713, 0.008981071,
                      -0.011879345, -0.036926158,
                      -0.01789058, -0.008694822,
                      -0.028911177, -0.017103394,
                      -0.028768053, -0.030914923,
                      0.001033181, 0.00431163,
                      -0.024474313, -0.031058047,
                      0.010018725, 0.00647639,
                      -0.027336806, 0.025046812,
                      0.003148742, -0.010018725,
                      0.03663991, 0.033348043,
                      -0.001162888, -0.01016185,
                      0.010376536, 0.010519661,
                      0.019178702, 0.016101522,
                      0.007943418, -0.013739966,
                      -0.013525278, -0.027193682,
                      0.006655296, 0.027050557,
                      -0.017389644, -0.027479932,
                      0.041792396, 0.045513637,
                      -0.014741838, 0.012451844,
                      0.018319955, -0.00153859,
                      0.010519661, 0.017962143,
                      -0.012594969, 0.018606203,
                      0.023472441, -0.034063663,
                      -0.004061162, 0.015600586,
                      0.019178702, 0.002361557,
                      -0.025619311, -0.00586811,
                      -0.02003745, 0.013739966,
                      0.017675893, -0.025189938,
                      -0.002415228, 0.001547535,
                      0.019608077, 0.039502401,
                      -0.00184273, 0.025189938,
                      0.00277304, 0.020323699,
                      0.007227794, 0.012165595,
                      -0.00370335, 0.02433119,
                      -0.00586811, 0.016459335,
                      0.034206789, 0.001051072,
                      -0.010519661, -0.004096943,
                      0.00153859, 0.01574371,
                      0.01230872, -0.007692949,
                      -0.019464951, 0.005116706,
                      0.017389644, 0.024903689,
                      0.046658635, -0.010519661,
                      0.020609949, 0.060684849,
                      -0.045227386, -0.008551697,
                      -0.004293739, -0.001502809,
                      -0.015815273, -0.005975454,
                      0.000290722, 0.027050557,
                      -0.002245268, -0.016888708,
                      -0.027193682, -0.001288122,
                      -0.021182448, -0.041219898,
                      0.031916797, 0.030628674,
                      -0.03234617, 0.006655296,
                      0.008372792, -0.009016853,
                      -0.033348043, 0.010877473,
                      -0.05238362, -0.004490536,
                      -0.028911177, 0.006905764,
                      -0.003506554, 0.039788652,
                      -0.036496785, -0.015886836,
                      0.015314337, -0.015672149,
                      0.006225922, -0.021182448,
                      -0.034349915, -0.043223642,
                      -0.025476186, 0.002558353,
                      0.007048889, -0.037784904,
                      -0.014026215, -0.044654887,
                      -0.036926158, 0.008229667,
                      0.007728731, 0.039216153,
                      -0.00027954, 0.026907433,
                      0.027193682, -0.017174957,
                      -0.011378409, 0.017174957,
                      -0.015815273, 0.009446226,
                      0.033777416, -0.014384027,
                      0.003721241, -0.024760563,
                      -0.000229223, 0.008802165,
                      -0.000377939, -0.007692949,
                      0.016173085, 0.018248392,
                      -0.02218432, -0.003202414,
                      -0.033204917, -0.002969836,
                      -0.023186192, 0.030056175,
                      -0.015457462, -0.015314337,
                      -0.008981071, 0.022613693,
                      -0.014026215, -0.025476186,
                      0.025333062, 0.034206789,
                      0.010662786, 0.016387772,
                      0.030342424, -0.008086543,
                      0.007120451, 0.000221396,
                      0.025619311, 0.01789058,
                      -0.008086543, 0.011807784,
                      -0.016101522, 0.002719368,
                      0.005653423, 0.017962143,
                      -0.001941128, 0.06297484,
                      0.016244646, 0.003524444,
                      0.018749328, -0.001815894,
                      0.006082797, 0.069558576,
                      -0.011020597, 0.018033706,
                      0.026621183, 0.007692949,
                      -0.008694822, 0.035924286,
                      -0.001878511, -0.005975454,
                      -0.028911177, -0.007871855,
                      0.014741838, 0.008587479,
                      0.026621183, 0.005259831,
                      -0.023186192, 0.000368993,
                      -0.01323903, 0.002683587,
                      -0.011306847, 0.007478263,
                      -0.000621698, 0.022756819,
                      -0.018892452, -0.013167467,
                      0.007764512, -0.010877473,
                      -0.017461207, -0.013525278,
                      0.014240902, -0.019464951,
                      -0.009016853, 0.016173085,
                      -0.027479932, 0.002934055,
                      0.042937394, -0.004830457,
                      -0.031201173, -0.024188064,
                      0.00245101, 0.017318081,
                      0.001824839, -0.022756819,
                      0.021325571, -0.027479932,
                      -0.008659041, 0.008337011,
                      -0.016674021, -0.003452882,
                      0.000711151, -0.045799885,
                      0.013739966, -0.029340552,
                      -0.035208661, 0.000554608,
                      -0.007800293, 0.018892452,
                      0.028481804, -0.011593096,
                      -0.00894529, 0.024474313,
                      -0.008050761, 0.025476186,
                      -0.001306012, -0.00214687,
                      -0.008050761, -0.018606203,
                      -0.006047016, -0.028768053,
                      0.029197427, -0.021468697,
                      0.005402955, -0.021039322,
                      -0.014312465, -0.002325775,
                      -0.020896198, 0.000706678,
                      0.035638034, -0.008480135,
                      -0.035351787, 0.014312465,
                      0.012523406, 0.011807784,
                      0.003041399, -0.010018725,
                      -0.022613693, -0.021182448,
                      -0.005474518, -0.007120451,
                      0.025476186, 0.036926158,
                      -0.007907636, -0.014097777,
                      0.010519661, 0.005617642,
                      0.014670276, -0.011664659,
                      0.011879345, -0.012738093,
                      -0.007871855, -0.012666531,
                      0.032918669, -0.010018725,
                      0.007943418, 0.024188064,
                      0.005760767, -0.003918037,
                      0.022613693, 0.017318081,
                      0.036496785, 0.037784904,
                      0.008694822, 0.016674021,
                      0.000106225, 0.003685459,
                      -0.031201173, -0.01016185,
                      -0.02404494, -0.019035578,
                      0.031773672, 0.000975037,
                      -0.032489292, -0.033920541,
                      0.015385899, -0.023186192,
                      0.012523406, -0.011163722,
                      -0.005116706, 0.015314337,
                      -0.006834202, -0.038357403,
                      -0.023472441, 0.015529023,
                      0.017747456, 0.005653423,
                      -0.002325775, 0.009088415,
                      -0.022899942, 0.02433119,
                      0.000849803, -0.042078644,
                      -0.004257958, 0.018176829,
                      -0.0049378, -0.002415228,
                      -0.016173085, 0.012594969,
                      0.013596841, -0.017031832,
                      -0.001806949, -0.003810694,
                      0.003005618, 0.046944883,
                      -0.025476186, 0.012738093,
                      0.009016853, -0.009660914,
                      0.012666531, 0.014026215,
                      -0.010519661, 0.022327444,
                      0.00400749, -0.007478263,
                      -0.03578116, 0.009804038,
                      -0.028911177, -0.018248392,
                      0.004758894, 0.005939673,
                      0.033920541, -0.011378409,
                      -0.005474518, 0.012451844,
                      0.018176829, 0.033920541,
                      0.025905561, -0.014670276,
                      0.001798003, 0.031344298,
                      0.00431163, 0.027193682,
                      -0.006798421, 0.011449971,
                      0.00894529, 0.013883091,
                      0.023758691, -0.007692949,
                      0.031344298, -0.014384027,
                      -0.007514044, -0.026621183,
                      -0.001645933, -0.010090288,
                      -0.009589351, 0.008193886,
                      -0.007871855, -0.031773672,
                      0.013525278, 0.006583733,
                      0.010949035, -0.004794675,
                      -0.004061162, -0.021468697,
                      0.011020597, -0.020609949,
                      0.010018725, 0.010662786,
                      0.008158104, 0.00370335,
                      0.007800293, -0.029626802,
                      0.029197427, -0.017174957,
                      -0.00586811, -0.003112961,
                      -0.018749328, -0.042364895,
                      0.027050557, 0.028624929,
                      0.008837947, 0.026334934,
                      0.018248392, -0.004758894,
                      0.009446226, -0.033061791,
                      -0.022041194, -0.021039322,
                      0.008086543, -0.009088415,
                      -0.031630546, 0.020896198,
                      -0.018749328, 0.022613693,
                      -0.014097777, 0.004347411,
                      0.014813401, -0.013525278,
                      -0.001726441, 0.010448099,
                      0.036067411, -0.026048684,
                      -0.020753073, -0.005045144,
                      0.033348043, -0.002576244,
                      0.02404494, 0.022041194,
                      0.017031832, -0.000297431,
                      -0.003184523, -0.012738093,
                      0.022756819, -0.016888708,
                      0.021039322, -0.000313085,
                      0.032203045, -0.011235285,
                      0.001583316, -0.00461577,
                      -0.026334934, -0.002934055,
                      -0.005939673, 0.001458082,
                      0.007156232, -0.005689205,
                      -0.042937394, 0.011378409,
                      0.007156232, 0.00554608,
                      0.026621183, -0.014455589,
                      -0.017604331, -0.02647806,
                      -0.03578116, -0.009804038,
                      0.006905764, -0.0197512,
                      -0.035494912, -0.027623056,
                      -0.00461577, 0.011521534,
                      0.006905764, 0.009517789,
                      0.003112961, 0.033920541,
                      -0.004687332, -0.005045144,
                      -0.009231539, 0.000126911,
                      0.008694822, -0.029340552,
                      0.011163722, 0.047517382,
                      -0.039788652, -0.033348043,
                      -0.003041399, -0.007657168,
                      -0.035065539, -0.012165595,
                      -0.024617439, 0.0049378,
                      0.017461207, 0.029626802,
                      -0.004723113, -0.000366757,
                      -0.041792396, 0.041219898,
                      -0.009446226, 0.016960271,
                      -0.017747456, -0.036067411,
                      0.025046812, 0.027336806,
                      0.025905561, 0.049234878,
                      0.016602458, -0.005796548,
                      0.021325571, -0.003524444,
                      -0.000872166, 0.014670276,
                      0.020323699, 0.002737259,
                      0.009660914, -0.006440609,
                      -0.062402345, -0.062688597,
                      -0.008158104, -0.018749328,
                      0.005438737, -0.002066362,
                      0.000205742, -0.018749328,
                      0.017103394, -0.03578116,
                      0.000265004, -0.03663991,
                      -0.024760563, 0.054101113,
                      -0.00647639, -0.026334934,
                      0.034779288, 0.022756819,
                      -0.033348043, -0.02433119,
                      -0.041792396, -0.014455589,
                      -0.023329318, -0.004687332,
                      -0.013453716, -0.018319955,
                      -0.014455589, 0.043509893,
                      0.013453716, -0.014813401,
                      0.009052633, -0.034349915,
                      0.052097369, -0.003774913,
                      0.016316209, -0.027050557,
                      0.028195554, -0.007549825,
                      -0.020466823, 0.014598713,
                      -0.005939673, 0.003273976,
                      -0.052097369, 0.002701478,
                      -0.02404494, -0.005903892,
                      0.009947163, -0.00043161,
                      0.02189807, 0.042078644,
                      -0.020609949, 0.007836075,
                      0.018892452, 0.001207614,
                      0.009159978, -0.029197427,
                      -0.023329318, 0.004347411,
                      -0.019464951, 0.020180576,
                      0.019894326, 0.00615436,
                      0.021468697, -0.017461207,
                      -0.011879345, -0.002307885,
                      0.016101522, -0.029626802,
                      -0.014455589, 0.020323699,
                      0.020753073, 0.018176829,
                      -0.006082797, 0.027766181,
                      0.016530896, -0.008444354,
                      0.001806949, 0.029626802,
                      -0.012451844, 0.023186192,
                      0.006869983, -0.034063663,
                      -0.012094032, -0.021611821,
                      -0.008050761, 0.05581861,
                      -0.004257958, -0.025333062,
                      -0.004526317, 0.018033706,
                      0.027479932, 0.025476186,
                      0.008802165, -0.009589351,
                      0.012809656, 0.012523406,
                      0.0400749, 0.018033706,
                      0.011020597, 0.014956526,
                      0.013883091, -0.006655296,
                      0.019608077, -0.03234617,
                      0.007585606, -0.036067411,
                      -0.024617439, -0.001628043,
                      0.022041194, 0.026764309,
                      -0.038643654, -0.009124196,
                      -0.020323699, -0.013883091,
                      0.02404494, 0.002361557,
                      -0.03234617, -0.0049378,
                      0.018606203, 0.022327444,
                      0.043509893, -0.030485548,
                      -0.003560225, 0.007442481,
                      0.00370335, 0.011449971,
                      0.023472441, 0.000197915,
                      -0.011950907, 0.023329318,
                      -0.009804038, -0.025619311,
                      0.0074067, -0.003953818,
                      0.014312465, 0.048662379,
                      -0.027193682, 0.019894326,
                      -0.042364895, 0.003327648,
                      0.042937394, -0.040933646,
                      -0.020466823, 0.056104861,
                      0.020896198, -0.014527151,
                      -0.036210533, -0.022470569,
                      0.035924286, -0.013167467,
                      -0.055532362, -0.006190141,
                      -0.027909305, 0.012881218,
                      0.003005618, 0.005689205,
                      0.01109216, -0.016387772,
                      -0.021468697, 0.018176829,
                      -0.021611821, 0.032918669,
                      0.002951946, -0.008837947,
                      -0.031773672, -0.029913051,
                      0.017318081, 0.017461207,
                      -0.02833868, -0.027479932,
                      -0.023615567, 0.037212405,
                      -0.023615567, -0.02404494,
                      0.029626802, 0.002951946,
                      0.004043271, -0.001377575,
                      0.007800293, 0.024188064,
                      -0.027336806, -0.002361557,
                      -0.00307718, -0.025189938,
                      0.007192013, -0.000207978,
                      0.040933646, 0.010877473,
                      -0.000720096, -0.006941545,
                      0.003059289, 0.032775544,
                      -0.007657168, 0.019321827,
                      -0.012094032, 0.042078644,
                      -0.010591224, 0.011807784,
                      -0.016173085, -0.015529023,
                      -0.023615567, 0.016173085,
                      -0.018606203, 0.007192013,
                      -0.008587479, 0.000257177,
                      0.002245268, -0.011879345,
                      0.044082388, -0.005939673,
                      -0.003059289, -0.013954652,
                      -0.026621183, 0.039502401,
                      -0.006440609, 0.014384027,
                      0.012094032, -0.034779288,
                      -0.002379447, 0.023329318,
                      0.029483676, -0.002325775,
                      -0.001565426, 0.025619311,
                      0.018606203, -0.016101522,
                      -0.0301993, 0.002576244,
                      0.035208661, 0.002325775,
                      -0.011664659, -0.022470569,
                      -0.047231134, -0.016888708,
                      -0.017747456, 0.05152487,
                      0.009374664, -0.010591224,
                      0.009303101, -0.005009362,
                      -0.029197427, 0.001726441,
                      -0.023758691, -0.002934055,
                      -0.017461207, 0.018606203,
                      -0.002665696, -0.003578116,
                      -0.018606203, -0.004651551,
                      -0.021325571, 0.005367174,
                      -0.009124196, 0.016888708,
                      -0.01295278, 0.002048471,
                      -0.011593096, 0.017604331,
                      -0.008515916, 0.006082797,
                      -0.036067411, -0.027336806,
                      -0.010018725, -0.001306012,
                      0.026334934, -0.019321827,
                      -0.030914923, -0.026764309,
                      -0.0024689, -0.005581861,
                      -0.002755149, 0.019464951,
                      -0.01295278, 0.011163722,
                      0.000639588, 0.025476186,
                      0.029483676, 0.042651143,
                      -0.011306847, 0.002737259,
                      0.010090288, -0.015600586,
                      0.038357403, 0.029197427,
                      -0.008193886, 0.044082388,
                      0.032489292, -0.00123445,
                      -0.008372792, 0.009124196,
                      -0.00309507, -0.041792396,
                      0.007764512, -0.009947163,
                      0.044941138, 0.030056175,
                      -0.013024342, -0.019321827,
                      0.019321827, 0.008551697,
                      -0.053814866, 0.038071156,
                      -0.037784904, 0.012165595,
                      -0.008444354, -0.029626802,
                      -0.006905764, -0.028195554,
                      -0.01080591, -0.0098756,
                      -0.032203045, 0.040361151,
                      -0.033920541, 0.004454754,
                      -0.036067411, 0.011879345,
                      -0.011235285, 0.020609949,
                      -0.004579989, 0.0074067,
                      -0.017103394, 0.01789058,
                      0.011449971, -0.007836075,
                      0.000427138, -0.007120451,
                      0.008337011, 0.00123445,
                      -0.003273976, -0.007263576,
                      -0.011449971, 0.022756819,
                      0.002576244, -0.013310592,
                      -0.013382155, -0.011664659,
                      -0.013453716, -0.005152487,
                      -0.050379876, -0.034636162,
                      -0.011306847, 0.015028087,
                      0.008480135, -0.047517382,
                      -0.00586811, -0.008301229,
                      -0.01416934, 0.000876638,
                      0.000326503, 0.01080591,
                      0.004150615, 0.005259831,
                      -0.008837947, 0.017031832,
                      -0.016316209, -0.036210533,
                      -0.013883091, -0.000295195,
                      0.014240902, 0.020753073,
                      -0.022899942, -0.038929902,
                      0.00586811, -0.008050761,
                      0.00016437, -0.001932183,
                      0.001789058, 0.017031832,
                      0.045227386, -0.016745584,
                      -0.005689205, 0.008372792,
                      0.008301229, -0.016674021,
                      -0.004222177, 0.005832329,
                      0.016173085, -0.009374664,
                      -0.006869983, -0.052669868,
                      0.035065539, 0.000123557,
                      0.007478263, 0.033491168,
                      0.054387365, 0.002254213,
                      -0.007836075, -0.020323699,
                      -0.019178702, -0.010376536,
                      -0.039788652, -0.032632418,
                      -0.012380281, -0.002540462,
                      -0.016602458, -0.022756819,
                      0.019608077, 0.001887456,
                      0.032918669, 0.008050761,
                      -0.013739966, 0.006547953,
                      -0.016674021, 0.001574371,
                      0.019321827, -0.016960271,
                      -0.031201173, 0.027766181,
                      0.006655296, 0.020753073,
                      0.009804038, 0.024903689,
                      -0.043509893, 0.015815273,
                      -0.017962143, -0.043223642,
                      0.033920541, -0.007764512,
                      -0.006762639, 0.017819017,
                      -0.026621183, 0.046658635,
                      -0.004490536, 0.024188064,
                      -0.010304974, 0.004651551,
                      0.047231134, -0.038071156,
                      0.009589351, -0.033920541,
                      -0.027050557, 0.050093625,
                      0.008515916, -0.025189938,
                      -0.008050761, 0.011950907,
                      0.004973582, 0.014527151,
                      -0.009374664, -0.003721241,
                      0.019608077, 0.049807377,
                      0.016602458, 0.02404494
                    ],
                    "numCandidates": 100,
                    "limit": 50
                  }
                }
              ]
            }
          },
          "combination": {
            "weights": {
              "vectorPipeline": 0.5,
              "fullTextPipeline": 0.5
            }
          },
          "scoreDetails": true
        }
      },
      {
        "$group": {
          "_id": "$decade",
          "top_movie": { "$first": "$$ROOT" },
          "avg_rating": {
            "$avg": "$imdb.rating"
          },
          "count": { "$sum": 1 }
        }
      }
    ],
    "cursor": {},
    "maxTimeMS": 60000,
    "$db": "sample_mflix"
  },
  "ok": 1,
  "$clusterTime": {
    "clusterTime": {
      "$timestamp": "7529935052734464001"
    },
    "signature": {
      "hash": "YbCQw03Zr+dc3GHNXkqXhyICEYk=",
      "keyId": {
        "low": 5,
        "high": 1753198865,
        "unsigned": false
      }
    }
  },
  "operationTime": {
    "$timestamp": "7529935052734464001"
  }
}

    `,
    expected: ``,
    expectedsources: [],
  },
];

function buildPrompt(explainCase: ExplainCase): SimpleEvalCase {
  return {
    name: explainCase.name,
    input: buildExplainPlanPrompt({
      indexes: explainCase.indexes?.trim(),
      query: explainCase.query?.trim(),
      aggregation: explainCase.aggregation?.trim(),
      schema: explainCase.schema?.trim(),
      explainPlan: explainCase.explainPlan?.trim(),
    }).prompt,
    expected: explainCase.expected,
    expectedSources: explainCase.expectedsources,
  };
}

export const evalCases: SimpleEvalCase[] = explainCases.map(buildPrompt);
