import type {
  ArraySchemaType,
  DocumentSchemaType,
  Schema,
  SchemaField,
  SchemaType,
} from 'mongodb-schema';

// Every 1000 iterations, unblock the thread.
const UNBLOCK_INTERVAL_COUNT = 1000;
const unblockThread = async () =>
  new Promise<void>((resolve) => setTimeout(resolve));

export async function calculateSchemaDepth(schema: Schema): Promise<number> {
  let unblockThreadCounter = 0;
  let deepestPath = 0;

  async function traverseSchemaTree(
    fieldsOrTypes: SchemaField[] | SchemaType[],
    depth: number
  ): Promise<void> {
    unblockThreadCounter++;
    if (unblockThreadCounter === UNBLOCK_INTERVAL_COUNT) {
      unblockThreadCounter = 0;
      await unblockThread();
    }

    if (!fieldsOrTypes || fieldsOrTypes.length === 0) {
      return;
    }

    deepestPath = Math.max(depth, deepestPath);

    for (const fieldOrType of fieldsOrTypes) {
      if ((fieldOrType as DocumentSchemaType).bsonType === 'Document') {
        await traverseSchemaTree(
          (fieldOrType as DocumentSchemaType).fields,
          depth + 1 // Increment by one when we go a level deeper.
        );
      } else if (
        (fieldOrType as ArraySchemaType).bsonType === 'Array' ||
        (fieldOrType as SchemaField).types
      ) {
        const increment =
          (fieldOrType as ArraySchemaType).bsonType === 'Array' ? 1 : 0;
        await traverseSchemaTree(
          (fieldOrType as ArraySchemaType | SchemaField).types,
          depth + increment // Increment by one when we go a level deeper.
        );
      }
    }
  }

  await traverseSchemaTree(schema.fields, 1);

  return deepestPath;
}
