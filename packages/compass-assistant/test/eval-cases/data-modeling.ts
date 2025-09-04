import type { SimpleEvalCase } from '../assistant.eval';

const dataModelingCases: SimpleEvalCase[] = [
  {
    input: 'How do I model data with MongoDB?',
    expected: `Start with workload analysis: identify frequent operations. Map
relationships and decide whether to embed or reference. Apply schema design
patterns to optimize reads and writes. Finally, create indexes to support
common query patterns. Planning ahead helps ensure performance and consistency
as you scale.`,
    expectedSources: [
      'https://www.mongodb.com/docs/manual/data-modeling/#plan-your-schema',
      'https://www.mongodb.com/docs/manual/data-modeling/schema-design-process/#designing-your-schema',
    ],
  },
  {
    input: 'Is MongoDB schemaless?',
    expected: `No. MongoDB uses a flexible schema. Documents in a collection need not
share identical fields or types, but most follow a similar structure. You can
enforce consistency with JSON Schema validation rules in Compass or via
collMod.`,
    expectedSources: [
      'https://www.mongodb.com/docs/manual/data-modeling/#data-modeling',
      'https://www.mongodb.com/docs/manual/core/schema-validation/specify-validation-level/',
      'https://www.mongodb.com/docs/compass/validation/',
    ],
  },
  {
    input: 'Should I embed related data or put it in a new collection?',
    expected: `Embed when it simplifies code and the data has a contains or has-a
relationship, is read together, updated together, or archived together. Use
references for frequently changing subdocuments, many-to-many or large
hierarchies, or when the subdocument is often queried on its own.`,
    expectedSources: [
      'https://www.mongodb.com/docs/manual/data-modeling/concepts/embedding-vs-references/',
    ],
  },
];

export default dataModelingCases;
