import React from 'react';
import {
  Binary,
  UUID,
  Code,
  Double,
  Int32,
  Long,
  BSONRegExp,
  Timestamp,
  DBRef,
  MaxKey,
  MinKey,
  ObjectId,
  BSONSymbol,
  Decimal128,
} from 'bson';
import BSONValue from './bson-value';
import { expect } from 'chai';
import { render, cleanup, screen } from '@testing-library/react';

describe('BSONValue', function () {
  afterEach(cleanup);
  const valuesToRender = [
    {
      type: 'Binary',
      value: Binary.createFromBase64('dGVzdA==', Binary.SUBTYPE_DEFAULT),
      expected: "Binary.createFromBase64('dGVzdA==', 0)",
    },
    {
      type: 'Binary',
      value: Binary.createFromBase64(
        'encrypted data',
        Binary.SUBTYPE_ENCRYPTED
      ),
      expected: '*********',
    },
    {
      type: 'Binary',
      value: new UUID('48b481f0-31c7-4b2d-81d4-987ac69262a9').toBinary(),
      expected: "UUID('48b481f0-31c7-4b2d-81d4-987ac69262a9')",
    },
    {
      type: 'Binary',
      value: Binary.createFromHexString('3132303d', Binary.SUBTYPE_UUID),
      expected: "UUID('3132303d')",
    },
    {
      type: 'Code',
      value: new Code('var a = 1', { foo: 2 }),
      expected: 'Code(\'var a = 1\', {"foo":2})',
    },
    {
      type: 'Double',
      value: new Double(123),
      expected: '123',
    },
    { type: 'Int32', value: new Int32(123), expected: '123' },
    { type: 'Long', value: new Long(123), expected: '123' },
    {
      type: 'BSONRegExp',
      value: new BSONRegExp('foo', 'im'),
      expected: '/foo/im',
    },
    {
      type: 'Timestamp',
      value: new Timestamp(new Long(0)),
      expected: 'Timestamp({ t: 0, i: 0 })',
    },
    {
      type: 'DBRef',
      value: new DBRef('foo', new ObjectId('5d505646cf6d4fe581014ab2')),
      expected: "DBRef('foo', '5d505646cf6d4fe581014ab2')",
    },
    {
      type: 'DBRef',
      value: new DBRef('foo', new ObjectId('5d505646cf6d4fe581014ab2'), 'buz'),
      expected: "DBRef('foo', '5d505646cf6d4fe581014ab2', 'buz')",
    },
    { type: 'MaxKey', value: new MaxKey(), expected: 'MaxKey()' },
    { type: 'MinKey', value: new MinKey(), expected: 'MinKey()' },
    {
      type: 'ObjectId',
      value: new ObjectId('5d505646cf6d4fe581014ab2'),
      expected: "ObjectId('5d505646cf6d4fe581014ab2')",
    },
    {
      type: 'BSONSymbol',
      value: new BSONSymbol('abc'),
      expected: "Symbol('abc')",
    },
    {
      type: 'Decimal128',
      value: new Decimal128('10.0'),
      expected: '10.0',
    },
    {
      type: 'Date',
      value: new Date(0),
      expected: '1970-01-01T00:00:00.000+00:00',
    },
    {
      type: 'String',
      value: 'this is a string of test that is less than 70 symbols long',
      expected: '"this is a string of test that is less than 70 symbols long"',
    },
    {
      type: 'String',
      value:
        'this is a string of test that is less than is more than 70 symbols for the purpose of showing truncated text',
      expected:
        '"this is a string of test that is less than is more than 70 symbols for…"',
    },
    { type: 'Undefined', value: undefined, expected: 'undefined' },
    { type: 'Null', value: null, expected: 'null' },
    { type: 'Boolean', value: false, expected: 'false' },
    { type: 'Boolean', value: true, expected: 'true' },
    { type: 'Array', value: [1, 2, 3], expected: 'Array (3)' },
    { type: 'Array', value: [], expected: 'Array (empty)' },
  ];

  valuesToRender.forEach(function ({ expected, ...props }) {
    it(`should render ${props.type} as ${expected}`, function () {
      const { container } = render(<BSONValue {...(props as any)}></BSONValue>);

      expect(container.querySelector('.element-value')).to.exist;
      expect(container.querySelector('.element-value')?.textContent).to.eq(
        expected
      );
    });
  });

  it('should render an info link for encrypted values', async function () {
    render(
      <BSONValue
        type="Binary"
        value={Binary.createFromBase64(
          'encrypted data',
          Binary.SUBTYPE_ENCRYPTED
        )}
      />
    );

    expect(await screen.findByTestId('bson-value-in-use-encryption-docs-link'))
      .to.be.visible;
  });
});
