import type { SimpleEvalCase } from '../assistant.eval';

const evalCases: SimpleEvalCase[] = [
  {
    input: 'How do I model data with MongoDB?',
    expected: `Data modeling in MongoDB is highly dependent on how you access your data. To ensure that your data model has a logical structure and achieves optimal performance, plan your schema prior to using your database at a production scale. To determine your data model, use the following schema design process:

Identify your workload: Identify the operations that your application runs most frequently
Map relationships: Identify the relationships in your application's data and decide whether to link or embed related data.
Apply design patterns: Apply schema design patterns to optimize reads and writes.
Create indexes: Create indexes to support common query patterns.
`,
    expectedSources: [
      'https://www.mongodb.com/docs/manual/data-modeling/#plan-your-schema',
      'https://www.mongodb.com/docs/manual/data-modeling/schema-design-process/#designing-your-schema',
    ],
  },
];

export default evalCases;
