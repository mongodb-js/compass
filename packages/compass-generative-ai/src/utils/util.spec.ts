import { expect } from 'chai';
import { flattenSchemaToObject } from './util';

const mockSchema = {
  _id: {
    types: [
      {
        bsonType: 'ObjectId',
      },
    ],
  },
  name: {
    types: [
      {
        bsonType: 'String',
      },
    ],
  },
  createdAt: {
    types: [
      {
        bsonType: 'Date',
      },
    ],
  },
  verified: {
    types: [
      {
        bsonType: 'Null',
      },
    ],
  },
  providers: {
    types: [
      {
        bsonType: 'Array',
        types: [
          {
            bsonType: 'String',
          },
        ],
      },
    ],
  },
  reviews: {
    types: [
      {
        bsonType: 'Array',
        types: [
          {
            bsonType: 'Document',
            fields: {
              name: {
                types: [
                  {
                    bsonType: 'String',
                  },
                ],
              },
              location: {
                types: [
                  {
                    bsonType: 'Document',
                    fields: {
                      country: {
                        types: [
                          {
                            bsonType: 'String',
                          },
                        ],
                      },
                      coordinates: {
                        types: [
                          {
                            bsonType: 'Array',
                            types: [
                              {
                                bsonType: 'Int32',
                              },
                            ],
                          },
                        ],
                      },
                    },
                  },
                ],
              },
            },
          },
        ],
      },
    ],
  },
  preferences: {
    types: [
      {
        bsonType: 'Document',
        fields: {
          notifications: {
            types: [
              {
                bsonType: 'Document',
                fields: {},
              },
            ],
          },
          selectedProjectId: {
            types: [
              {
                bsonType: 'ObjectId',
              },
            ],
          },
        },
      },
    ],
  },
  metadata: {
    types: [
      {
        bsonType: 'Array',
        types: [
          {
            bsonType: 'Array',
            types: [
              {
                bsonType: 'Int32',
              },
              {
                bsonType: 'String',
              },
            ],
          },
        ],
      },
    ],
  },
};

describe('utils', function () {
  it('flattenSchemaToObject', function () {
    expect(flattenSchemaToObject(mockSchema)).to.deep.equal({
      _id: 'ObjectId',
      name: 'String',
      createdAt: 'Date',
      verified: 'Null',
      providers: 'String[]',
      'reviews.name': 'String',
      'reviews.location.country': 'String',
      'reviews.location.coordinates': 'Int32[]',
      'preferences.notifications': 'Document',
      'preferences.selectedProjectId': 'ObjectId',
      metadata: 'Int32[]',
    });
  });
});
