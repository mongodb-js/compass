import React from 'react';
import type { MongoDBJSONSchema } from 'mongodb-schema';
import { Diagram } from './diagram/diagram';
import type { Node } from './diagram/utils/types';

const SchemaVizualization: React.FC = () => {
  const collections: {
    collectionName: string;
    $jsonSchema: MongoDBJSONSchema;
  }[] = [
    {
      collectionName: 'books',
      $jsonSchema: {
        bsonType: 'object',
        required: ['_id', 'id', 'title', 'year'],
        properties: {
          _id: {
            bsonType: 'objectId',
          },
          id: {
            bsonType: 'string',
          },
          title: {
            bsonType: 'string',
          },
          year: {
            bsonType: 'string',
          },
        },
      },
    },
  ];
  const collectionNodes: Node[] = collections.map(
    ({ collectionName, $jsonSchema }) => ({
      id: collectionName,
      type: 'COLLECTION',
      hidden: false,
      selected: false,
      position: {
        // TODO: positioning via elk.
        x: 100,
        y: 100,
      },
      data: {
        title: collectionName,
        fields: Object.entries($jsonSchema.properties || {}).map(
          ([field, { bsonType }]) => ({
            name: field,
            description: bsonType as any, // TODO: typing
          })
        ),
      },
    })
  );

  return (
    <Diagram
      id="schema-viz"
      edges={[]} // TODO: connections in the data
      nodes={collectionNodes}
    />
  );
};

export default SchemaVizualization;
