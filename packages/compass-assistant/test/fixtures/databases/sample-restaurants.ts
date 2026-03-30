import { ObjectId } from 'mongodb';
import type { SeedDatabase } from '../../types/seed-data';

const restaurantsDocuments: Record<string, unknown>[] = [
  {
    _id: new ObjectId('5eb3d668b31de5d588f4292a'),
    address: {
      building: '2780',
      coord: [-73.98241999999999, 40.579505],
      street: 'Stillwell Avenue',
      zipcode: '11224',
    },
    borough: 'Brooklyn',
    cuisine: 'American',
    grades: [
      { date: new Date('2014-06-10T00:00:00.000Z'), grade: 'A', score: 5 },
      { date: new Date('2013-06-05T00:00:00.000Z'), grade: 'A', score: 7 },
      { date: new Date('2012-04-13T00:00:00.000Z'), grade: 'A', score: 12 },
      { date: new Date('2011-10-12T00:00:00.000Z'), grade: 'A', score: 12 },
    ],
    name: 'Riviera Caterer',
    restaurant_id: '40356018',
  },
  {
    _id: new ObjectId('5eb3d668b31de5d588f4292b'),
    address: {
      building: '7114',
      coord: [-73.9068506, 40.6199034],
      street: 'Avenue U',
      zipcode: '11234',
    },
    borough: 'Brooklyn',
    cuisine: 'Delicatessen',
    grades: [
      { date: new Date('2014-05-29T00:00:00.000Z'), grade: 'A', score: 10 },
      { date: new Date('2014-01-14T00:00:00.000Z'), grade: 'A', score: 10 },
      { date: new Date('2013-08-03T00:00:00.000Z'), grade: 'A', score: 8 },
      { date: new Date('2012-07-18T00:00:00.000Z'), grade: 'A', score: 10 },
    ],
    name: "Wilken's Fine Food",
    restaurant_id: '40356483',
  },
  {
    _id: new ObjectId('5eb3d668b31de5d588f4292c'),
    address: {
      building: '155',
      coord: [-73.98513, 40.758896],
      street: 'West 44th Street',
      zipcode: '10036',
    },
    borough: 'Manhattan',
    cuisine: 'Italian',
    grades: [
      { date: new Date('2014-02-12T00:00:00.000Z'), grade: 'A', score: 9 },
      { date: new Date('2013-01-08T00:00:00.000Z'), grade: 'B', score: 18 },
      { date: new Date('2012-03-15T00:00:00.000Z'), grade: 'A', score: 11 },
    ],
    name: 'Trastevere Kitchen',
    restaurant_id: '41700001',
  },
];

export const sampleRestaurants: SeedDatabase = {
  databaseName: 'sample_restaurants',
  collections: [
    {
      collectionName: 'restaurants',
      documents: restaurantsDocuments,
      indexes: [
        { key: { 'address.coord': '2dsphere' } },
        { key: { borough: 1, cuisine: 1 } },
        { key: { borough: 1 } },
      ],
    },
  ],
};
