import { expect } from 'chai';
import bson from 'bson';
import { getSchema } from './get-schema';

const DATA = [
  {
    useCase: '_id is always the first one',
    input: [
      {
        data: 'something',
        _id: 123456,
      },
    ],
    output: ['_id', 'data'],
  },
  {
    useCase: 'simple json object',
    input: [
      {
        name: 'hi',
        data: 'hello',
      },
    ],
    output: ['data', 'name'],
  },
  {
    useCase: 'nested json object',
    input: [
      {
        name: 'hi',
        data: 'hello',
        address: {
          city: 'berlin',
          street: {
            name: 'Alt-Moabit',
            number: 1,
          },
        },
      },
    ],
    output: [
      'address',
      'address.city',
      'address.street',
      'address.street.name',
      'address.street.number',
      'data',
      'name',
    ],
  },
  {
    useCase: 'multiple nested json object with array values',
    input: [
      {
        data: 'hello',
        name: 'hi',
        streets: [
          {
            name: 'Alt-Moabit',
            zip: 10555,
          },
          {
            name: 'Alt-Moabit',
            number: 12,
          },
        ],
      },
      {
        data: 'hello',
        name: 'hi',
        streets: [
          {
            _id: 1234,
            city: 'Berlin',
          },
        ],
      },
    ],
    output: [
      'data',
      'name',
      'streets',
      'streets._id',
      'streets.city',
      'streets.name',
      'streets.number',
      'streets.zip',
    ],
  },
  {
    useCase: 'handles bson values',
    input: [
      {
        _id: new bson.ObjectId(),
        data: new bson.Int32(123),
        address: {
          street: 'Alt-Moabit',
          number: new bson.Int32(18),
        },
      },
    ],
    output: ['_id', 'address', 'address.number', 'address.street', 'data'],
  },
  {
    useCase: 'nested array with scaler values',
    input: [
      {
        meta: {
          common: {
            artists: ['some user'],
          },
        },
      },
    ],
    output: ['meta', 'meta.common', 'meta.common.artists'],
  },
];

describe('get schema', function () {
  DATA.forEach(({ useCase, input, output }) => {
    it(useCase, function () {
      expect(getSchema(input)).to.deep.equal(output);
    });
  });
});
