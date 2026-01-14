import { z } from '@mongodb-js/compass-user-data';
import toNS from 'mongodb-ns';
import type { MongoDBJSONSchema } from 'mongodb-schema';

export const FieldPathSchema = z.array(z.string());

export type FieldPath = z.output<typeof FieldPathSchema>;

export const RelationshipSideSchema = z.object({
  ns: z.string().nullable(),
  cardinality: z.number(),
  fields: z.array(z.string()).nullable(),
});

export type RelationshipSide = z.output<typeof RelationshipSideSchema>;

export const RelationshipSchema = z.object({
  id: z.string().uuid(),
  relationship: z.tuple([RelationshipSideSchema, RelationshipSideSchema]),
  isInferred: z.boolean(),
  note: z.string().optional(),
});

export type Relationship = z.output<typeof RelationshipSchema>;

export const DEFAULT_IS_EXPANDED = true;

export const InitialExpansionState = {
  global: DEFAULT_IS_EXPANDED,
  overrides: new Set<string>(),
};

export type FieldData = Exclude<
  MongoDBJSONSchema,
  'properties' | 'items' | 'anyOf'
> & {
  properties?: Record<string, FieldData>;
  items?: FieldData | FieldData[];
  anyOf?: FieldData[];
  expanded?: boolean;
};

const FieldDataSchema = z.custom<FieldData>((value) => {
  const isObject = typeof value === 'object' && value !== null;
  return isObject && 'bsonType' in value;
});

const CollectionSchema = z.preprocess(
  (val) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { expanded, expansionState, jsonSchema, ...rest } = val as Record<
      string,
      unknown
    >;
    const collection = {
      ...rest,
    };
    if (jsonSchema) {
      collection.fieldData = jsonSchema;
    }
    return collection;
  },
  z.object({
    ns: z.string(),
    fieldData: FieldDataSchema,
    indexes: z.array(z.record(z.unknown())),
    shardKey: z.record(z.unknown()).optional(),
    displayPosition: z.tuple([z.number(), z.number()]),
    note: z.string().optional(),
  })
);

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
  z.object({
    type: z.literal('MoveMultipleCollections'),
    newPositions: z.record(z.string(), z.tuple([z.number(), z.number()])),
  }),
  z.object({
    type: z.literal('RemoveCollection'),
    ns: z.string(),
  }),
  z.object({
    type: z.literal('RenameCollection'),
    fromNS: z.string(),
    toNS: z.string(),
  }),
  z.object({
    type: z.literal('UpdateCollectionNote'),
    ns: z.string(),
    note: z.string(),
  }),
  z.object({
    type: z.literal('AddCollection'),
    ns: z.string(),
    position: z.tuple([z.number(), z.number()]),
    initialSchema: z.custom<MongoDBJSONSchema>(),
  }),
  // Field operations
  z.object({
    type: z.literal('RenameField'),
    ns: z.string(),
    field: FieldPathSchema,
    newName: z.string(),
  }),
  z.object({
    type: z.literal('RemoveField'),
    ns: z.string(),
    field: FieldPathSchema,
  }),
  z.object({
    type: z.literal('ChangeFieldType'),
    ns: z.string(),
    field: FieldPathSchema,
    from: FieldDataSchema,
    to: FieldDataSchema,
  }),
  z.object({
    type: z.literal('AddField'),
    ns: z.string(),
    field: FieldPathSchema,
    jsonSchema: FieldDataSchema,
  }),
  z.object({
    type: z.literal('DuplicateField'),
    ns: z.string(),
    field: FieldPathSchema,
  }),
  z.object({
    type: z.literal('MoveField'),
    sourceNS: z.string(),
    targetNS: z.string(),
    targetField: FieldPathSchema,
    field: FieldPathSchema,
    jsonSchema: FieldDataSchema,
  }),
  z.object({
    type: z.literal('ToggleExpandCollection'),
    ns: z.string(),
    expanded: z.boolean(),
  }),
  z.object({
    type: z.literal('ToggleExpandField'),
    ns: z.string(),
    field: FieldPathSchema,
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
    console.log('Edit validation error:', e);
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

export const MongoDBDataModelDescriptionSchema = z.preprocess(
  (val) => {
    const model = val as Record<string, unknown>;
    if (
      !model.database &&
      Array.isArray(model.edits) &&
      model.edits.length > 0
    ) {
      // Infer database from the first collection's namespace in the 'SetModel' edit
      model.database = toNS(model.edits?.[0].model.collections[0].ns).database;
    }
    return model;
  },
  z.object({
    id: z.string(),
    name: z.string(),
    /**
     * Connection id associated with the data model at the moment of configuring
     * and analyzing. No connection id means diagram was imported and not attached
     * to a connection. Practically speaking it just means that we can't do
     * anything that would require re-fetching data associated with the diagram
     */
    connectionId: z.string().nullable(),
    database: z.string(),
    edits: EditListSchema,
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
);

export type MongoDBDataModelDescription = z.output<
  typeof MongoDBDataModelDescriptionSchema
>;

export interface DataModelStorage {
  save(description: MongoDBDataModelDescription): Promise<boolean>;
  delete(id: MongoDBDataModelDescription['id']): Promise<boolean>;
  loadAll(): Promise<MongoDBDataModelDescription[]>;
  load(id: string): Promise<MongoDBDataModelDescription | null>;
}
