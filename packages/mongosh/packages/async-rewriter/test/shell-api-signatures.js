module.exports = {
  'ShellApi': {
    'type': 'ShellApi',
    'hasAsyncChild': false,
    'attributes': {
      'use': {
        'type': 'function',
        'returnsPromise': false,
        'returnType': 'unknown',
      },
      'it': {
        'type': 'function',
        'returnsPromise': false,
        'returnType': 'unknown',
      },
      'show': {
        'type': 'function',
        'returnsPromise': false,
        'returnType': 'unknown',
      }
    }
  },
  'CommandResult': {
    'type': 'CommandResult',
    'hasAsyncChild': false,
    'returnsPromise': false,
    'attributes': {}
  },
  'BulkWriteResult': {
    'type': 'BulkWriteResult',
    'hasAsyncChild': false,
    'returnsPromise': false,
    'attributes': {}
  },
  'InsertManyResult': {
    'type': 'InsertManyResult',
    'hasAsyncChild': false,
    'returnsPromise': false,
    'attributes': {}
  },
  'InsertOneResult': {
    'type': 'InsertOneResult',
    'hasAsyncChild': false,
    'returnsPromise': false,
    'attributes': {}
  },
  'UpdateResult': {
    'type': 'UpdateResult',
    'hasAsyncChild': false,
    'returnsPromise': false,
    'attributes': {}
  },
  'DeleteResult': {
    'type': 'DeleteResult',
    'hasAsyncChild': false,
    'returnsPromise': false,
    'attributes': {}
  },
  'CursorIterationResult': {
    'type': 'CursorIterationResult',
    'hasAsyncChild': false,
    'returnsPromise': false,
    'attributes': {}
  },
  'AggregationCursor': {
    'type': 'AggregationCursor',
    'hasAsyncChild': true,
    'returnsPromise': false,
    'attributes': {
      'close': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'forEach': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'hasNext': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'isClosed': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': false
      },
      'isExhausted': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': false
      },
      'itcount': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'map': {
        'type': 'function',
        'returnType': 'AggregationCursor',
        'returnsPromise': false
      },
      'next': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'toArray': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'explain': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      }
    }
  },
  'Collection': {
    'type': 'Collection',
    'hasAsyncChild': true,
    'returnsPromise': false,
    'attributes': {
      'aggregate': {
        'type': 'function',
        'returnType': 'AggregationCursor',
        'returnsPromise': true
      },
      'bulkWrite': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'count': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'countDocuments': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'deleteMany': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'deleteOne': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'distinct': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'estimatedDocumentCount': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'find': {
        'type': 'function',
        'returnType': 'Cursor',
        'returnsPromise': false
      },
      'findAndModify': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'findOne': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'renameCollection': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'findOneAndDelete': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'findOneAndReplace': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'findOneAndUpdate': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'insert': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'insertMany': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'insertOne': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'isCapped': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'remove': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'save': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'replaceOne': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'update': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'updateMany': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'updateOne': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'convertToCapped': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'createIndexes': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'createIndex': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'ensureIndex': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'getIndexes': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'getIndexSpecs': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'getIndices': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'getIndexKeys': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'dropIndexes': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'dropIndex': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'totalIndexSize': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'reIndex': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'getDB': {
        'type': 'function',
        'returnType': 'Database',
        'returnsPromise': false
      },
      'stats': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'dataSize': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'storageSize': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'totalSize': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'drop': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'exists': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'getFullName': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': false
      },
      'getName': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': false
      },
      'runCommand': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'explain': {
        'type': 'function',
        'returnType': 'Explainable',
        'returnsPromise': false
      }
    }
  },
  'Cursor': {
    'type': 'Cursor',
    'hasAsyncChild': true,
    'returnsPromise': false,
    'attributes': {
      'addOption': {
        'type': 'function',
        'returnType': 'Cursor',
        'returnsPromise': false
      },
      'allowPartialResults': {
        'type': 'function',
        'returnType': 'Cursor',
        'returnsPromise': false
      },
      'batchSize': {
        'type': 'function',
        'returnType': 'Cursor',
        'returnsPromise': false
      },
      'clone': {
        'type': 'function',
        'returnType': 'Cursor',
        'returnsPromise': false
      },
      'close': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'collation': {
        'type': 'function',
        'returnType': 'Cursor',
        'returnsPromise': false
      },
      'comment': {
        'type': 'function',
        'returnType': 'Cursor',
        'returnsPromise': false
      },
      'count': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'explain': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'forEach': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'hasNext': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'hint': {
        'type': 'function',
        'returnType': 'Cursor',
        'returnsPromise': false
      },
      'isClosed': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': false
      },
      'isExhausted': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': false
      },
      'itcount': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'limit': {
        'type': 'function',
        'returnType': 'Cursor',
        'returnsPromise': false
      },
      'map': {
        'type': 'function',
        'returnType': 'Cursor',
        'returnsPromise': false
      },
      'max': {
        'type': 'function',
        'returnType': 'Cursor',
        'returnsPromise': false
      },
      'maxTimeMS': {
        'type': 'function',
        'returnType': 'Cursor',
        'returnsPromise': false
      },
      'min': {
        'type': 'function',
        'returnType': 'Cursor',
        'returnsPromise': false
      },
      'next': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'noCursorTimeout': {
        'type': 'function',
        'returnType': 'Cursor',
        'returnsPromise': false
      },
      'oplogReplay': {
        'type': 'function',
        'returnType': 'Cursor',
        'returnsPromise': false
      },
      'projection': {
        'type': 'function',
        'returnType': 'Cursor',
        'returnsPromise': false
      },
      'readPref': {
        'type': 'function',
        'returnType': 'Cursor',
        'returnsPromise': false
      },
      'returnKey': {
        'type': 'function',
        'returnType': 'Cursor',
        'returnsPromise': false
      },
      'size': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'skip': {
        'type': 'function',
        'returnType': 'Cursor',
        'returnsPromise': false
      },
      'sort': {
        'type': 'function',
        'returnType': 'Cursor',
        'returnsPromise': false
      },
      'tailable': {
        'type': 'function',
        'returnType': 'Cursor',
        'returnsPromise': false
      },
      'toArray': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      }
    }
  },
  'Database': {
    'type': 'Database',
    'hasAsyncChild': true,
    'returnsPromise': false,
    'attributes': {
      'getMongo': {
        'type': 'function',
        'returnType': 'Mongo',
        'returnsPromise': false
      },
      'getCollectionNames': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'getCollectionInfos': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'runCommand': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'adminCommand': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'aggregate': {
        'type': 'function',
        'returnType': 'AggregationCursor',
        'returnsPromise': true
      }
    }
  },
  'Explainable': {
    'type': 'Explainable',
    'hasAsyncChild': true,
    'returnsPromise': false,
    'attributes': {
      'getCollection': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': false
      },
      'getVerbosity': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': false
      },
      'setVerbosity': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': false
      },
      'find': {
        'type': 'function',
        'returnType': 'ExplainableCursor',
        'returnsPromise': false
      },
      'aggregate': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      }
    }
  },
  'ExplainableCursor': {
    'type': 'ExplainableCursor',
    'hasAsyncChild': true,
    'returnsPromise': false,
    'attributes': {
      'addOption': {
        'type': 'function',
        'returnType': 'Cursor',
        'returnsPromise': false
      },
      'allowPartialResults': {
        'type': 'function',
        'returnType': 'Cursor',
        'returnsPromise': false
      },
      'batchSize': {
        'type': 'function',
        'returnType': 'Cursor',
        'returnsPromise': false
      },
      'clone': {
        'type': 'function',
        'returnType': 'Cursor',
        'returnsPromise': false
      },
      'close': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'collation': {
        'type': 'function',
        'returnType': 'Cursor',
        'returnsPromise': false
      },
      'comment': {
        'type': 'function',
        'returnType': 'Cursor',
        'returnsPromise': false
      },
      'count': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'explain': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'forEach': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'hasNext': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'hint': {
        'type': 'function',
        'returnType': 'Cursor',
        'returnsPromise': false
      },
      'isClosed': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': false
      },
      'isExhausted': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': false
      },
      'itcount': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'limit': {
        'type': 'function',
        'returnType': 'Cursor',
        'returnsPromise': false
      },
      'map': {
        'type': 'function',
        'returnType': 'Cursor',
        'returnsPromise': false
      },
      'max': {
        'type': 'function',
        'returnType': 'Cursor',
        'returnsPromise': false
      },
      'maxTimeMS': {
        'type': 'function',
        'returnType': 'Cursor',
        'returnsPromise': false
      },
      'min': {
        'type': 'function',
        'returnType': 'Cursor',
        'returnsPromise': false
      },
      'next': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'noCursorTimeout': {
        'type': 'function',
        'returnType': 'Cursor',
        'returnsPromise': false
      },
      'oplogReplay': {
        'type': 'function',
        'returnType': 'Cursor',
        'returnsPromise': false
      },
      'projection': {
        'type': 'function',
        'returnType': 'Cursor',
        'returnsPromise': false
      },
      'readPref': {
        'type': 'function',
        'returnType': 'Cursor',
        'returnsPromise': false
      },
      'returnKey': {
        'type': 'function',
        'returnType': 'Cursor',
        'returnsPromise': false
      },
      'size': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      },
      'skip': {
        'type': 'function',
        'returnType': 'Cursor',
        'returnsPromise': false
      },
      'sort': {
        'type': 'function',
        'returnType': 'Cursor',
        'returnsPromise': false
      },
      'tailable': {
        'type': 'function',
        'returnType': 'Cursor',
        'returnsPromise': false
      },
      'toArray': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      }
    }
  },
  'Shard': {
    'type': 'Shard',
    'hasAsyncChild': true,
    'returnsPromise': false,
    'attributes': {}
  },
  'ReplicaSet': {
    'type': 'ReplicaSet',
    'hasAsyncChild': true,
    'returnsPromise': false,
    'attributes': {}
  },
  'Mongo': {
    'type': 'Mongo',
    'hasAsyncChild': true,
    'returnsPromise': true,
    'attributes': {
      'connect': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': false
      },
      'getDB': {
        'type': 'function',
        'returnType': 'Database',
        'returnsPromise': false
      },
      'use': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': false
      },
      'show': {
        'type': 'function',
        'returnType': {
          'type': 'unknown',
          'attributes': {}
        },
        'returnsPromise': true
      }
    }
  }
};
