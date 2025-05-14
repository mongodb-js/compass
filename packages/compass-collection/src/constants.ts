export const FAKE_SCHEMA_GENERATE_RESPONSE = {
  collections: [
    {
      name: 'products',
      schema: {
        _id: {
          type: 'ObjectId',
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
      schema: {
        _id: {
          type: 'ObjectId',
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
