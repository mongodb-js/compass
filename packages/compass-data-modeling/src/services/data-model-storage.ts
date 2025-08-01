import { z } from '@mongodb-js/compass-user-data';
import type { MongoDBJSONSchema } from 'mongodb-schema';

export const RelationshipSideSchema = z.object({
  ns: z.string().nullable(),
  cardinality: z.number(),
  fields: z.array(z.string()).nullable(),
});

export type RelationshipSide = z.output<typeof RelationshipSideSchema>;

export const RelationshipSchema = z.object({
  id: z.string().uuid(),
  name: z.string().optional(),
  relationship: z.tuple([RelationshipSideSchema, RelationshipSideSchema]),
  isInferred: z.boolean(),
});

export type Relationship = z.output<typeof RelationshipSchema>;

const CollectionSchema = z.object({
  ns: z.string(),
  jsonSchema: z.custom<MongoDBJSONSchema>((value) => {
    const isObject = typeof value === 'object' && value !== null;
    return isObject && 'bsonType' in value;
  }),
  indexes: z.array(z.record(z.unknown())),
  shardKey: z.record(z.unknown()).optional(),
  displayPosition: z.tuple([z.number(), z.number()]),
});

export type DataModelCollection = z.output<typeof CollectionSchema>;

export const StaticModelSchema = z.object({
  collections: z.array(CollectionSchema),
  relationships: z.array(RelationshipSchema),
});

export type StaticModel = z.output<typeof StaticModelSchema>;

const EditSchemaBase = z.object({
  id: z.string().uuid(),
  timestamp: z.string().datetime(),
});

const EditSchemaVariants = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('SetModel'),
    model: StaticModelSchema,
  }),
  z.object({
    type: z.literal('AddRelationship'),
    relationship: RelationshipSchema,
  }),
  z.object({
    type: z.literal('UpdateRelationship'),
    relationship: RelationshipSchema,
  }),
  z.object({
    type: z.literal('RemoveRelationship'),
    relationshipId: z.string().uuid(),
  }),
  z.object({
    type: z.literal('MoveCollection'),
    ns: z.string(),
    newPosition: z.tuple([z.number(), z.number()]),
  }),
]);

export const EditSchema = z.intersection(EditSchemaBase, EditSchemaVariants);

export const EditListSchema = z
  .array(EditSchema)
  .nonempty()
  // Ensure first item exists and is 'SetModel'
  .refine((edits) => edits[0]?.type === 'SetModel', {
    message: "First edit must be of type 'SetModel'",
  });

export type Edit = z.output<typeof EditSchema>;
export type SetModelEdit = Extract<
  z.output<typeof EditSchema>,
  { type: 'SetModel' }
>;

export type EditAction = z.output<typeof EditSchemaVariants>;

export const validateEdit = (
  edit: unknown
): { result: true; errors?: never } | { result: false; errors: string[] } => {
  try {
    EditSchema.parse(edit);
    return { result: true };
  } catch (e) {
    return {
      result: false,
      errors: (e as z.ZodError).issues.map(({ path, message }) =>
        message === 'Required'
          ? `'${path}' is required`
          : `Invalid field '${path}': ${message}`
      ),
    };
  }
};

export const MongoDBDataModelDescriptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  /**
   * Connection id associated with the data model at the moment of configuring
   * and analyzing. No connection id means diagram was imported and not attached
   * to a connection. Practically speaking it just means that we can't do
   * anything that would require re-fetching data associated with the diagram
   */
  connectionId: z.string().nullable(),
  edits: EditListSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type MongoDBDataModelDescription = z.output<
  typeof MongoDBDataModelDescriptionSchema
>;

export interface DataModelStorage {
  save(description: MongoDBDataModelDescription): Promise<boolean>;
  delete(id: MongoDBDataModelDescription['id']): Promise<boolean>;
  loadAll(): Promise<MongoDBDataModelDescription[]>;
  load(id: string): Promise<MongoDBDataModelDescription | null>;
}
