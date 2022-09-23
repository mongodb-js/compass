import { expect } from 'chai';
import type { DataService } from 'mongodb-data-service';
import { PipelineBuilder } from './pipeline-builder';

const pipeline = `
// This is a pipeline to get something from the netflix sample dataset
[
  {
    $match: {
      year: {
        $gt: 2014,
      },
    },
  },
  {
    $lookup: {
      from: "comments",
      localField: "_id",
      foreignField: "movie_id",
      as: "reviews",
    },
  },
  {
    $set: {
      title: "$fullplot",
      reviews: {
        $arrayElemAt: ["$countries", 0],
      },
    },
  },
  {
    $unwind: {
      path: "$reviews",
      preserveNullAndEmptyArrays: false,
    },
  },
  // This is a $set stage
  {
    $set: {
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
  // {
  //   $project: {
  //     type: 1,
  //   },
  // },
  {
    $merge: {
      into: "test",
      on: ["_id", "type"],
      whenMatched: "merge",
      whenNotMatched: "insert",
    },
  },
]
`;

describe('PipelineBuilder', function () {
  it('can parse pipeline from text', function () {
    const builder = new PipelineBuilder(
      pipeline,
      {} as { dataService: DataService }
    );
    expect(builder.getPipelineFromSource()).to.deep.eq(
      builder.getPipelineFromStages()
    );
  });
});
