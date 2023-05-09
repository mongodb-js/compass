import { expect } from 'chai';
import bson from 'bson';
import { getSchema } from './get-schema';

const DATA = [
  {
    useCase: 'does nothing when input is empty',
    input: [],
    output: [],
  },
  {
    useCase: '_id is always the first one',
    input: [
      {
        data: 'something',
        _id: 123456,
      },
    ],
    output: [
      {
        name: '_id',
        type: 'Int32',
      },
      {
        name: 'data',
        type: 'String',
      },
    ],
  },
  {
    useCase: 'simple json object',
    input: [
      {
        name: 'hi',
        data: 'hello',
      },
    ],
    output: [
      {
        name: 'data',
        type: 'String',
      },
      {
        name: 'name',
        type: 'String',
      },
    ],
  },
  {
    useCase: 'simple json object with falsy values',
    input: [
      {
        name: '',
        downloads: 0,
        popular: false,
        phoneNumbers: [],
        addresses: null,
      },
    ],
    output: [
      {
        name: 'addresses',
        type: 'Null',
      },
      {
        name: 'downloads',
        type: 'Int32',
      },
      {
        name: 'name',
        type: 'String',
      },
      {
        name: 'phoneNumbers',
        type: 'Array',
      },
      {
        name: 'popular',
        type: 'Boolean',
      },
    ],
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
      { name: 'address', type: 'Object' },
      { name: 'address.city', type: 'String' },
      { name: 'address.street', type: 'Object' },
      { name: 'address.street.name', type: 'String' },
      { name: 'address.street.number', type: 'Int32' },
      { name: 'data', type: 'String' },
      { name: 'name', type: 'String' },
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
      { name: 'data', type: 'String' },
      { name: 'name', type: 'String' },
      { name: 'streets', type: 'Array' },
      { name: 'streets._id', type: 'Int32' },
      { name: 'streets.city', type: 'String' },
      { name: 'streets.name', type: 'String' },
      { name: 'streets.number', type: 'Int32' },
      { name: 'streets.zip', type: 'Int32' },
    ],
  },
  {
    useCase: 'handles bson values',
    input: [
      {
        _id: new bson.ObjectId(),
        data: new bson.Double(123),
        address: {
          street: 'Alt-Moabit',
          number: new bson.Int32(18),
        },
      },
    ],
    output: [
      { name: '_id', type: 'ObjectId' },
      { name: 'address', type: 'Object' },
      { name: 'address.number', type: 'Int32' },
      { name: 'address.street', type: 'String' },
      { name: 'data', type: 'Double' },
    ],
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
    output: [
      { name: 'meta', type: 'Object' },
      { name: 'meta.common', type: 'Object' },
      { name: 'meta.common.artists', type: 'Array' },
    ],
  },
];

describe('get schema', function () {
  DATA.forEach(({ useCase, input, output }) => {
    it(useCase, function () {
      expect(getSchema(input)).to.deep.equal(output);
    });
  });
});
