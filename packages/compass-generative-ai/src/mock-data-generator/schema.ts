import { z } from 'zod';

const fakerArgItemSchema = z.union([
  z.object({ json: z.string() }),
  z.string(),
  z.number(),
  z.boolean(),
]);

export const fakerFieldSchema = z.object({
  fieldPath: z
    .string()
    .describe(
      'Dot-notation path to the field (e.g., "facility.name", "modifications[]")'
    ),
  fakerMethod: z
    .string()
    .describe(
      'Faker.js method (e.g., "person.firstName", "helpers.arrayElement")'
    ),
  fakerArgs: z
    .array(fakerArgItemSchema)
    .describe(
      'Array of arguments for the faker method. Use empty [] when defaults are sufficient. Use {"json": "..."} format for object/array arguments.'
    ),
});

export const mockDataSchemaToolSchema = z.object({
  fields: z
    .array(fakerFieldSchema)
    .describe('Array of field-to-faker mappings'),
});

export type MockDataSchemaToolOutput = z.infer<typeof mockDataSchemaToolSchema>;

export interface MockDataSchemaRawField {
  type: string;
  sampleValues?: unknown[];
}

export type RawSchema = Record<string, MockDataSchemaRawField>;

// Backwards compatibility: remove once CLOUDP-381919 updates
// atlas-ai-service.ts to import the new names above.
export { mockDataSchemaToolSchema as MockDataSchemaResponseShape };
export type { MockDataSchemaToolOutput as MockDataSchemaResponse };
