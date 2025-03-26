import React from 'react';
import Diagram from '../diagram';
import type { MongoDBJSONSchema } from 'mongodb-schema';

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
  const collectionNodes = collections.map(
    ({ collectionName, $jsonSchema }) => ({
      id: collectionName,
      type: 'COLLECTION',
      hidden: false,
      selected: false,
      data: {
        title: collectionName,
        fields: Object.entries($jsonSchema.properties || {}).map(
          ([field, { bsonType }]) => ({
            name: field,
            description: bsonType,
          })
        ),
      },
    })
  );

  return <Diagram nodes={collectionNodes} />;
};

export default SchemaVizualization;
