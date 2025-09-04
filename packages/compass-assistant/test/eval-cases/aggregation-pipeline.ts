import type { SimpleEvalCase } from '../assistant.eval';

const aggregationPipelineCases: SimpleEvalCase[] = [
  {
    input: 'What is an aggregation pipeline?',
    expected: `The aggregation pipeline in MongoDB is a framework for data processing
and transformation. It consists of a sequence of stages, where each stage
operates on input documents and passes results to the next stage. Common stages
include $match, $group, $project, $lookup, and $set. Pipelines are useful for
analysis, reporting, and reshaping data.

In Compass, you can build pipelines under the Aggregations tab using natural
language, the visual stage editor, or the text view.

Example:
db.orders.aggregate([
  { $unwind: { path: "$products" } },
  { $match: { "products.price": { $gt: 15 } } },
  { $group: {
      _id: "$products.prod_id",
      product: { $first: "$products.name" },
      total_value: { $sum: "$products.price" },
      quantity: { $sum: 1 }
    }
  },
  { $set: { product_id: "$_id" } },
  { $unset: ["_id"] }
])`,
    expectedSources: [
      'https://www.mongodb.com/docs/manual/core/aggregation-pipeline/',
      'https://www.mongodb.com/docs/compass/create-agg-pipeline/',
    ],
  },
];

export default aggregationPipelineCases;
