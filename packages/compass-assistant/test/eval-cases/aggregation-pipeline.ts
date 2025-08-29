import type { SimpleEvalCase } from '../assistant.eval';

const evalCases: SimpleEvalCase[] = [
  {
    input: 'What is an aggregation pipeline?',
    expected: `The aggregation pipeline in MongoDB is a framework for data processing and transformation. It consists of a sequence of stages, where each stage performs an operation on the input documents and passes the results to the next stage. Common operations include filtering, grouping, projecting, joining, and calculating values. Aggregation pipelines are powerful for data analysis, reporting, and transformation tasks in MongoDB.

Compass makes it easy to create and run aggregation pipelines under the Aggregations tab. You may generate an aggregation pipeline with natural language, utilize the visual stage editor, or edit aggregations in the text view. 

Example aggregation pipeline: 
db.orders.aggregate([
   // Stage 1: Unwind the array of products
   { $unwind: { path: "$products" } },

   // Stage 2: Match products that cost more than $15
   { $match: { "products.price": { $gt: 15 } } },

   // Stage 3: Group products by product ID
   { $group: {
         _id: "$products.prod_id",
         product: { $first: "$products.name" },
         total_value: { $sum: "$products.price" },
         quantity: { $sum: 1 }
      }
   },

   // Stage 4: Add a product_id field
   { $set: { product_id: "$_id" } },

   // Stage 5: Remove the _id field
   { $unset: ["_id"] }
])
`,
    expectedSources: [
      'https://www.mongodb.com/docs/manual/core/aggregation-pipeline/',
      'https://www.mongodb.com/docs/compass/create-agg-pipeline/',
    ],
  },
];

export default evalCases;
