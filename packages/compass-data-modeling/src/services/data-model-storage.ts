import { z } from '@mongodb-js/compass-user-data';

export const RelationshipSideSchema = z.object({
  ns: z.string(),
  cardinality: z.number(),
  fields: z.array(z.string()),
});

export type RelationshipSide = z.output<typeof RelationshipSideSchema>;

export const RelationshipSchema = z.object({
  id: z.string(),
  relationship: z.tuple([RelationshipSideSchema, RelationshipSideSchema]),
  isInferred: z.boolean(),
});

export type Relationship = z.output<typeof RelationshipSchema>;

export const StaticModelSchema = z.object({
  collections: z.array(
    z.object({
      ns: z.string(),
      jsonSchema: z.unknown(), // MongoDBJSONSchema is not directly representable in zod
      indexes: z.array(z.record(z.unknown())),
      shardKey: z.record(z.unknown()).optional(),
      displayPosition: z.tuple([z.number(), z.number()]),
    })
  ),
  relationships: z.array(RelationshipSchema),
});

export type StaticModel = z.output<typeof StaticModelSchema>;

export const EditSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('SetModel'),
    id: z.string(),
    timestamp: z.string(),
    model: z.unknown(), // TODO: StaticModelSchema,
  }),
  z.object({
    type: z.literal('AddRelationship'),
    id: z.string(),
    timestamp: z.string(),
    relationship: RelationshipSchema,
  }),
  z.object({
    type: z.literal('RemoveRelationship'),
    id: z.string(),
    timestamp: z.string(),
  }),
]);

export type Edit = z.output<typeof EditSchema>;

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

  edits: z.array(EditSchema).default([]),
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
