import { ObjectId } from 'bson';

interface Field {
  type: string;
  faker?: string;
  fakerArgs?: any[];
  items?: {
    type: string;
    schema: {
      [key: string]: Field;
    };
  };
}

interface Collection {
  name: string;
  count: number;
  schema: {
    [key: string]: Field;
  };
}

interface Relationship {
  fromCollection: string;
  fromField: string;
  toCollection: string;
}

interface FakeSchemaGenerateResponse {
  collections: Collection[];
  relationships: Relationship[];
}

export const FAKE_SCHEMA_GENERATE_RESPONSE: FakeSchemaGenerateResponse = {
  collections: [
    {
      name: 'products',
      count: 100,
      schema: {
        _id: {
          type: 'ObjectId',
          faker: 'database.mongodbObjectId',
        },
        name: {
          type: 'String',
          faker: 'commerce.productName',
        },
        category: {
          type: 'String',
          faker: 'helpers.arrayElement',
          fakerArgs: ['Electronics', 'Fitness', 'Outdoors', 'Office'],
        },
        price: {
          type: 'Number',
          faker: 'commerce.price',
        },
        inStock: {
          type: 'Boolean',
          faker: 'datatype.boolean',
        },
        tags: {
          type: 'Array',
          faker: 'helpers.arrayElements',
          fakerArgs: [
            [
              'computer',
              'accessory',
              'wireless',
              'exercise',
              'mat',
              'home',
              'hydration',
              'bottle',
              'eco-friendly',
              'audio',
              'music',
              'headphones',
              'desk',
              'ergonomics',
              'adjustable',
            ],
            {
              min: 1,
              max: 3,
            },
          ],
        },
      },
    },
    {
      name: 'orders',
      count: 1000,
      schema: {
        _id: {
          type: 'ObjectId',
          faker: 'database.mongodbObjectId',
        },
        customerName: {
          type: 'String',
          faker: 'person.fullName',
        },
        orderDate: {
          type: 'Date',
          faker: 'date.recent',
        },
        products: {
          type: 'Array',
          items: {
            type: 'Object',
            schema: {
              productId: {
                type: 'ObjectId',
              },
              quantity: {
                type: 'Number',
                faker: 'number.int',
                fakerArgs: [
                  {
                    min: 1,
                    max: 5,
                  },
                ],
              },
            },
          },
        },
        status: {
          type: 'String',
          faker: 'helpers.arrayElement',
          fakerArgs: ['shipped', 'processing', 'delivered', 'cancelled'],
        },
        totalAmount: {
          type: 'Number',
          faker: 'commerce.price',
        },
      },
    },
  ],
  relationships: [
    {
      fromCollection: 'products',
      fromField: 'productId',
      toCollection: 'orders',
    },
  ],
};

export const FAKE_SCHEMA_GENERATE_PAYLOAD = [
  {
    collectionName: 'products',
    documents: [
      {
        _id: new ObjectId().toHexString(),
        name: 'Wireless Mouse',
        category: 'Electronics',
        price: 29.99,
        inStock: true,
        tags: ['computer', 'accessory', 'wireless'],
      },
      {
        _id: new ObjectId().toHexString(),
        name: 'Yoga Mat',
        category: 'Fitness',
        price: 19.95,
        inStock: true,
        tags: ['exercise', 'mat', 'home'],
      },
      {
        _id: new ObjectId().toHexString(),
        name: 'Stainless Steel Water Bottle',
        category: 'Outdoors',
        price: 15.5,
        inStock: false,
        tags: ['hydration', 'bottle', 'eco-friendly'],
      },
      {
        _id: new ObjectId().toHexString(),
        name: 'Noise Cancelling Headphones',
        category: 'Electronics',
        price: 149.99,
        inStock: true,
        tags: ['audio', 'music', 'headphones'],
      },
      {
        _id: new ObjectId().toHexString(),
        name: 'Standing Desk Converter',
        category: 'Office',
        price: 89.0,
        inStock: true,
        tags: ['desk', 'ergonomics', 'adjustable'],
      },
    ],
  },
  {
    collectionName: 'orders',
    documents: [
      {
        _id: new ObjectId().toHexString(),
        customerName: 'Jane Doe',
        orderDate: new Date('2024-05-10T13:30:00Z'),
        products: [
          { productId: new ObjectId('665c1e00b73b30f183e6e401'), quantity: 1 },
          { productId: new ObjectId('665c1e00b73b30f183e6e403'), quantity: 2 },
        ],
        status: 'shipped',
        totalAmount: 180.49,
      },
      {
        _id: new ObjectId().toHexString(),
        customerName: 'John Smith',
        orderDate: new Date('2024-05-08T09:45:00Z'),
        products: [
          { productId: new ObjectId('665c1e00b73b30f183e6e405'), quantity: 1 },
        ],
        status: 'processing',
        totalAmount: 89.0,
      },
      {
        _id: new ObjectId().toHexString(),
        customerName: 'Alice Johnson',
        orderDate: new Date('2024-05-11T16:10:00Z'),
        products: [
          { productId: new ObjectId('665c1e00b73b30f183e6e400'), quantity: 2 },
        ],
        status: 'delivered',
        totalAmount: 59.98,
      },
      {
        _id: new ObjectId().toHexString(),
        customerName: 'Bob Lee',
        orderDate: new Date('2024-05-09T12:00:00Z'),
        products: [
          { productId: new ObjectId('665c1e00b73b30f183e6e402'), quantity: 3 },
        ],
        status: 'cancelled',
        totalAmount: 46.5,
      },
      {
        _id: new ObjectId().toHexString(),
        customerName: 'Emily Green',
        orderDate: new Date('2024-05-12T15:20:00Z'),
        products: [
          { productId: new ObjectId('665c1e00b73b30f183e6e404'), quantity: 1 },
          { productId: new ObjectId('665c1e00b73b30f183e6e400'), quantity: 1 },
        ],
        status: 'shipped',
        totalAmount: 179.98,
      },
    ],
  },
];
