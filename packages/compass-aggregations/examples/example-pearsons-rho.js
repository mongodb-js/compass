import { EXAMPLE, STAGE_DEFAULTS } from './example-constants';
import { ObjectId } from 'bson';

/**
 * Pearsons Rho as a pipeline from @johnlpage
 * [Calculating Correlation inside MongoDB](http://ilearnasigoalong.blogspot.com/2017/10/calculating-correlation-inside-mongodb.html)
 * > I've been pondering recently the idea of a library of statistical and heuristic functions that run inside MongoDB using the aggregation Pipeline.
 * > After all if we can avoid pulling data out of the database that must help performance. As a little experiment, here is the correlation co-efficient
 * > of two fields using Pearsons Rho. It's broken down into individual variables to make it easier to read rather than a huge piece of javascript.
 * > That's usually the best way to write pipelines.
 */
const PEARSONS_RHO_EXAMPLE = {
  ...EXAMPLE,
  namespace: 'johnpage.pearsons',
  pipeline: [
    {
      ...STAGE_DEFAULTS,
      id: new ObjectId().toHexString(),
      stageOperator: '$group',
      stage: `{
  _id: true,
  count: {
    $sum: 1
  },
  sumx: {
    $sum: '$x'
  },
  sumy: {
    $sum: '$y'
  },
  sumxsquared: {
    $sum: {
      $multiply: ['$x', '$x']
    }
  },
  sumysquared: {
    $sum: {
      $multiply: ['$y', '$y']
    }
  },
  sumxy: {
    $sum: {
      $multiply: ['$x', '$y']
    }
  }
}`,
      previewDocuments: []
    },
    {
      ...STAGE_DEFAULTS,
      id: new ObjectId().toHexString(),
      stageOperator: '$project',
      stage: `{
  rho: {
    $divide: [
      {
        $subtract: [
          {
            $multiply: ['$sumxy', '$count']
          },
          {
            $multiply: ['$sumx', '$sumy']
          }
        ]
      },
      {
        $sqrt: {
          $multiply: [
            {
              $subtract: [
                {
                  $multiply: ['$sumxsquared', '$count']
                },
                {
                  $multiply: ['$sumx', '$sumx']
                }
              ]
            },
            {
              $subtract: [
                {
                  $multiply: ['$sumysquared', '$count']
                },
                {
                  $multiply: ['$sumy', '$sumy']
                }
              ]
            }
          ]
        }
      }
    ]
  }
}`,
      previewDocuments: []
    }
  ]
};

export default PEARSONS_RHO_EXAMPLE;
