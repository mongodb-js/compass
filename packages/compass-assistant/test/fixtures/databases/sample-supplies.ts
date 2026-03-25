import { Decimal128, ObjectId } from 'mongodb';
import type { SeedDatabase } from '../../types/seed-data';

const salesDocuments: Record<string, unknown>[] = [
  {
    _id: new ObjectId('5bd761dcae323e45a93ccfe8'),
    saleDate: new Date('2015-03-23T21:06:49.506Z'),
    items: [
      {
        name: 'printer paper',
        tags: ['office', 'stationary'],
        price: Decimal128.fromString('40.01'),
        quantity: 2,
      },
      {
        name: 'notepad',
        tags: ['office', 'writing', 'school'],
        price: Decimal128.fromString('35.29'),
        quantity: 2,
      },
      {
        name: 'pens',
        tags: ['writing', 'office', 'school', 'stationary'],
        price: Decimal128.fromString('56.12'),
        quantity: 5,
      },
    ],
    storeLocation: 'Denver',
    customer: {
      gender: 'M',
      age: 42,
      email: 'cauho@witwuta.sv',
      satisfaction: 4,
    },
    couponUsed: true,
    purchaseMethod: 'Online',
  },
  {
    _id: new ObjectId('5bd761dcae323e45a93ccfe9'),
    saleDate: new Date('2015-08-25T10:01:02.918Z'),
    items: [
      {
        name: 'envelopes',
        tags: ['stationary', 'office', 'general'],
        price: Decimal128.fromString('8.05'),
        quantity: 10,
      },
      {
        name: 'laptop',
        tags: ['electronics', 'school', 'office'],
        price: Decimal128.fromString('866.50'),
        quantity: 4,
      },
      {
        name: 'backpack',
        tags: ['school', 'travel', 'kids'],
        price: Decimal128.fromString('83.28'),
        quantity: 2,
      },
    ],
    storeLocation: 'Seattle',
    customer: {
      gender: 'M',
      age: 50,
      email: 'keecade@hem.uy',
      satisfaction: 5,
    },
    couponUsed: false,
    purchaseMethod: 'Phone',
  },
  {
    _id: new ObjectId('5bd761dcae323e45a93ccfea'),
    saleDate: new Date('2016-01-14T16:24:11.000Z'),
    items: [
      {
        name: 'binder',
        tags: ['school', 'general', 'organization'],
        price: Decimal128.fromString('28.31'),
        quantity: 6,
      },
      {
        name: 'desk lamp',
        tags: ['office', 'home', 'lighting'],
        price: Decimal128.fromString('64.99'),
        quantity: 1,
      },
      {
        name: 'monitor stand',
        tags: ['office', 'ergonomic'],
        price: Decimal128.fromString('39.95'),
        quantity: 2,
      },
    ],
    storeLocation: 'London',
    customer: {
      gender: 'F',
      age: 33,
      email: 'noralu@reni.uk',
      satisfaction: 3,
    },
    couponUsed: true,
    purchaseMethod: 'In store',
  },
];

export const sampleSupplies: SeedDatabase = {
  databaseName: 'sample_supplies',
  collections: [
    {
      collectionName: 'sales',
      documents: salesDocuments,
      indexes: [
        { key: { saleDate: 1 } },
        { key: { storeLocation: 1, saleDate: 1 } },
      ],
    },
  ],
};
