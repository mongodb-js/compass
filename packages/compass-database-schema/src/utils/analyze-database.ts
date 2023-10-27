import type { Document } from 'mongodb';
import type { Schema } from 'mongodb-schema';
import { SchemaAnalyzer } from 'mongodb-schema';
import type { DataService } from 'mongodb-data-service';

export type CollectionFieldReference = {
  collection: string;
  fieldPath: string[];
};

type FieldReferenceWithValues = CollectionFieldReference & {
  values: any[];
};

export type Relationship = {
  from: CollectionFieldReference;
  to: CollectionFieldReference;
};

export type DatabaseSchema = {
  collections: Record<string, Schema>;
  relationships: Relationship[];
};

function shuffleArray(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function findCandidateReferencesForSchema(
  collectionName: string,
  schema: Schema
) {
  const candidatePaths: FieldReferenceWithValues[] = [];

  for (const field of schema.fields) {
    if (field.name === '_id') {
      continue;
    }

    // TODO: also consider anything matching a known naming convention like /_id$/
    // TODO: we might also want to consider any large integers if there are lots of different values?

    const values: any[] = [];
    for (const typeInfo of field.types) {
      if (['ObjectId', 'UUID'].includes(typeInfo.bsonType)) {
        values.push(...((typeInfo as { values: any[] }).values ?? []));
      }
    }
    if (values.length) {
      // in case the sample came from limit()* and wasn't already sorted randomly
      shuffleArray(values);

      candidatePaths.push({
        collection: collectionName,
        fieldPath: field.path,
        values,
      });
    }
  }

  return candidatePaths;
}

async function findRelationshipsCandidate(
  dataService: DataService,
  databaseName: string,
  collectionNames: string[],
  candidatePaths: FieldReferenceWithValues[]
) {
  const relationships: Relationship[] = [];

  // not the most efficient..
  for (const { collection, fieldPath, values } of candidatePaths) {
    for (const target of collectionNames) {
      const ids = values.slice(0, 10);
      console.log(target, 'aggregate', ids);
      const result = await dataService.aggregate(`${databaseName}.${target}`, [
        { $match: { _id: { $in: ids } } },
        { $count: 'matches' },
      ]);

      if (result.length) {
        relationships.push({
          from: {
            collection,
            fieldPath,
          },
          to: {
            collection: target,
            fieldPath: ['_id'],
          },
        });
        // no point checking the collections - we assume this is a many to one
        break;
      }
    }
  }

  return relationships;
}

export async function findRelationshipsForSchema(
  dataService: DataService,
  databaseName: string,
  collectionName: string,
  collectionNames: string[],
  schema: Schema
) {
  const candidatePaths = findCandidateReferencesForSchema(
    collectionName,
    schema
  );
  return await findRelationshipsCandidate(
    dataService,
    databaseName,
    collectionNames,
    candidatePaths
  );
}

function analyzeCollection(documents: Document[]) {
  const analyzer = new SchemaAnalyzer({
    storeValues: true,
  });
  for (const doc of documents) {
    analyzer.analyzeDoc(doc);
  }
  return analyzer;
}

// TODO: this should probably move to data-service
export async function loadDatabaseSchemaForDatabase(
  dataService: DataService,
  databaseName: string
): Promise<DatabaseSchema> {
  // TODO: in theory we already have the collection names loaded from somewhere
  console.log(databaseName, 'listCollections');
  const collectionInfos = (
    await dataService.listCollections(databaseName, {}, { nameOnly: true })
  ).filter((collection) => {
    if (collection.type === 'view') {
      // these tend to be slow
      return false;
    }

    if (collection.system) {
      // these tend to throw errors that you're not allowed to query them
      return false;
    }

    return true;
  });

  console.log(collectionInfos);

  const collections: Record<string, Schema> = {};

  const relationships: Relationship[] = [];

  const collectionNames = collectionInfos.map((c) => c.name);

  for (const coll of collectionInfos) {
    console.log(coll.name, 'sample');
    // TODO: the $sample aggregation can easily be slow
    const docs = await dataService.sample(`${databaseName}.${coll.name}`);

    console.log(coll.name, 'analyzing');
    const analyzer = analyzeCollection(docs);

    const schema = analyzer.getResult();
    collections[coll.name] = schema;

    console.log(coll.name, 'relationship building');
    relationships.push(
      ...(await findRelationshipsForSchema(
        dataService,
        databaseName,
        coll.name,
        collectionNames,
        schema
      ))
    );
  }

  return {
    collections,
    relationships,
  };
}
