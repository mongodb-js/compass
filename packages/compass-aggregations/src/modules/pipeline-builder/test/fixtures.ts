type PipelineFixture = {
  useCase: string;
  text?: string;
  stages: {
    disabled: boolean;
    syntaxError?: string;
    operator: string | null;
    value: string | null;
  }[];
}

export const pipelines: PipelineFixture[] = [
  {
    useCase: 'stages enabled with no comments',
    text: `[
{
  $match: {
    name: /compass/i,
    tags: {
      $in: ['leafygreen', 'react'],
    },
    version: {
      $gt: 1
    },
  },
},
{
  $set: {
    title: "$fullplot",
    reviews: {
      $arrayElemAt: ["$countries", 0],
    },
    year: {
      $concat: [
        "feed=",
        {
          $toString: "$metacritic",
        },
      ],
    },
  },
},
{
  $unset: [
    "plot",
    "title",
    "fullplot",
    "poster",
    "directors",
    "writers",
    "cast",
    "genres",
  ],
},
{
  $unwind: 'tags'
},
{$limit: 20},
    ]`,
    stages: [
      {
        disabled: false,
        syntaxError: undefined,
        operator: '$match',
        value: `{
  name: /compass/i,
  tags: {
    $in: ["leafygreen", "react"],
  },
  version: {
    $gt: 1,
  },
}`,
      },
      {
        disabled: false,
        syntaxError: undefined,
        operator: '$set',
        value: `{
  title: "$fullplot",
  reviews: {
    $arrayElemAt: ["$countries", 0],
  },
  year: {
    $concat: [
      "feed=",
      {
        $toString: "$metacritic",
      },
    ],
  },
}`,
      },
      {
        disabled: false,
        syntaxError: undefined,
        operator: '$unset',
        value: `[
  "plot",
  "title",
  "fullplot",
  "poster",
  "directors",
  "writers",
  "cast",
  "genres",
]`,
      },
      {
        disabled: false,
        syntaxError: undefined,
        operator: '$unwind',
        value: `"tags"`,
      },
      {
        disabled: false,
        syntaxError: undefined,
        operator: '$limit',
        value: `20`,
      }
    ],
  },
  {
    useCase: 'pipeline with enabled and disabled stages',
    text: `[
{
  $match: {
    name: /compass/i,
  },
},
// {
//   $unwind: 'tags'
// },
// {$limit: 20},
{
  $sort: {
    name: -1,
  }
},
/** {
 *   $group: {
 *     // unique tags 
 *     _id: null,
 *     tags: {
 *       $addToSet: "$tags",
 *     }
 *   }
 * }
**/
// {
//   $project: 
//    /**
//     * Stage comment which compass adds
//     **/
//   {
//     _id: 0,
//     tags: 1,
//   }
// }
{
  $limit:
  20
  /**
   * Provide the number of documents to limit.
   */
}
    ]`,
    stages: [
      {
        disabled: false,
        syntaxError: undefined,
        operator: '$match',
        value: `{
  name: /compass/i,
}`,
      },
      {
        disabled: true,
        syntaxError: undefined,
        operator: '$unwind',
        value: `"tags"`,
      },
      {
        disabled: true,
        syntaxError: undefined,
        operator: '$limit',
        value: `20`,
      },
      {
        disabled: false,
        syntaxError: undefined,
        operator: '$sort',
        value: `{
  name: -1,
}`,
      },
      {
        disabled: true,
        syntaxError: undefined,
        operator: '$group',
        value: `{
  // unique tags
  _id: null,
  tags: {
    $addToSet: "$tags",
  },
}`,
      },
      {
        disabled: true,
        syntaxError: undefined,
        operator: '$project',
        value: `/**
 * Stage comment which compass adds
 **/
{
  _id: 0,
  tags: 1,
}`,
      },
      {
        disabled: false,
        syntaxError: undefined,
        operator: '$limit',
        value: `20
/**
 * Provide the number of documents to limit.
 */`,
      }
    ],
  },
  {
    useCase: 'empty pipeline with disabled stages',
    text: `[
  //{$unwind: 'tags'}
  /*{$limit: 20}*/
  /*
   *{$sort: {
   *  name: -1 
   *}}
   */
]`,
    stages: [
      {
        disabled: true,
        syntaxError: undefined,
        operator: '$unwind',
        value: `"tags"`,
      },
      {
        disabled: true,
        syntaxError: undefined,
        operator: '$limit',
        value: `20`,
      },
      {
        disabled: true,
        syntaxError: undefined,
        operator: '$sort',
        value: `{
  name: -1,
}`,
      }
    ],
  }
];