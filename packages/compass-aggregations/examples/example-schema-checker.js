import { EXAMPLE, STAGE_DEFAULTS } from './example-constants';
import { ObjectId } from 'bson';

/**
 * From @terakilobyte's aggregation examples from Education Team.
 *
 * @see https://gist.github.com/imlucas/5c92b6cfd46cba2a8bbb4a428c37c31b
 */

// do I have schema problems?
// the following tells me if I have mistyped names or bad references for a lookup
const SCHEMA_CHECKER_EXAMPLE = {
  ...EXAMPLE,
  namespace: 'aggregations.air_alliances',
  pipeline: [{
    ...STAGE_DEFAULTS,
    id: new ObjectId().toHexString(),
    stageOperator: '$lookup',
    stage: `{
  from: "air_airlines",
  let: { maybe_name: "$airlines" },
  pipeline: [
    {
      $match: {
        $expr: {
          $gt: [
            {
              $size: {
                $setIntersection: [
                  "$$maybe_name",
                  ["$name", "$alias", "$iata", "$icao"]
                ]
              }
            },
            0
          ]
        }
      }
    },
    {
      $project: {
        _id: 0,
        name_is: "$name",
        ref_name: {
          $arrayElemAt: [
            {
              $filter: {
                input: "$$maybe_name",
                cond: {
                  $in: ["$$this", ["$name", "$alias", "$iata", "$icao"]]
                }
              }
            },
            0
          ]
        }
      }
    }
  ],
  as: "found"
}`,
      previewDocuments: []
    },
    {
      ...STAGE_DEFAULTS,
      id: new ObjectId().toHexString(),
      stageOperator: '$match',
      stage: `{
  $expr: {
    $ne: [{ $size: "$airlines" }, { $size: "$found" }]
  }
}`,
      previewDocuments: []
    },
    {
      ...STAGE_DEFAULTS,
      id: new ObjectId().toHexString(),
      stageOperator: '$project',
      stage: `{
  _id: 0,
  name: 1,
  not_found: {
    $setDifference: ["$airlines", "$found.ref_name"]
  },
  needs_updating: {
    $filter: {
      input: "$found",
      cond: {
        $ne: ["$$this.name_is", "$$this.ref_name"]
      }
    }
  }
}`,
      previewDocuments: []
    }
  ]
};

export default SCHEMA_CHECKER_EXAMPLE;
