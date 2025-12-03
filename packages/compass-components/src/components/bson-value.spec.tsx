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
import { render, cleanup, screen } from '@mongodb-js/testing-library-compass';
import { LegacyUUIDDisplayContext } from './document-list/legacy-uuid-format-context';

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
      type: 'Binary',
      value: Binary.createFromBase64('dGVzdA==', Binary.SUBTYPE_UUID_OLD),
      expected: "Binary.createFromBase64('dGVzdA==', 3)",
    },
    {
      type: 'Binary',
      value: Binary.fromInt8Array(new Int8Array([1, 2, 3])),
      expected: 'Binary.fromInt8Array(new Int8Array([1, 2, 3]))',
    },
    {
      type: 'Binary',
      value: Binary.fromFloat32Array(new Float32Array([1.1, 2.2, 3.3])),
      expected: 'Binary.fromFloat32Array(new Float32Array([1.1, 2.2, 3.3]))',
    },
    {
      type: 'Binary',
      value: Binary.fromPackedBits(new Uint8Array([1, 2, 3])),
      expected: 'Binary.fromPackedBits(new Uint8Array([1, 2, 3]))',
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

  describe('Legacy UUID display formats', function () {
    const legacyUuidBinary = Binary.createFromHexString(
      '0123456789abcdef0123456789abcdef',
      Binary.SUBTYPE_UUID_OLD
    );

    it('should render Legacy UUID without encoding (raw format)', function () {
      const { container } = render(
        <LegacyUUIDDisplayContext.Provider value="">
          <BSONValue type="Binary" value={legacyUuidBinary} />
        </LegacyUUIDDisplayContext.Provider>
      );

      expect(container.querySelector('.element-value')?.textContent).to.include(
        "Binary.createFromBase64('ASNFZ4mrze8BI0VniavN7w==', 3)"
      );
    });

    it('should render Legacy UUID in Java format', function () {
      const { container } = render(
        <LegacyUUIDDisplayContext.Provider value="LegacyJavaUUID">
          <BSONValue type="Binary" value={legacyUuidBinary} />
        </LegacyUUIDDisplayContext.Provider>
      );

      expect(container.querySelector('.element-value')?.textContent).to.eq(
        'LegacyJavaUUID("efcdab89-6745-2301-efcd-ab8967452301")'
      );
    });

    it('should render Legacy UUID in C# format', function () {
      const { container } = render(
        <LegacyUUIDDisplayContext.Provider value="LegacyCSharpUUID">
          <BSONValue type="Binary" value={legacyUuidBinary} />
        </LegacyUUIDDisplayContext.Provider>
      );

      expect(container.querySelector('.element-value')?.textContent).to.eq(
        'LegacyCSharpUUID("67452301-ab89-efcd-0123-456789abcdef")'
      );
    });

    it('should render Legacy UUID in Python format', function () {
      const { container } = render(
        <LegacyUUIDDisplayContext.Provider value="LegacyPythonUUID">
          <BSONValue type="Binary" value={legacyUuidBinary} />
        </LegacyUUIDDisplayContext.Provider>
      );

      expect(container.querySelector('.element-value')?.textContent).to.eq(
        'LegacyPythonUUID("0123456789abcdef0123456789abcdef")'
      );
    });

    it('should fallback to raw format if UUID conversion fails', function () {
      // Create an invalid UUID binary that will cause conversion to fail.
      const invalidUuidBinary = new Binary(
        Buffer.from('invalid'),
        Binary.SUBTYPE_UUID_OLD
      );

      const { container } = render(
        <LegacyUUIDDisplayContext.Provider value="LegacyJavaUUID">
          <BSONValue type="Binary" value={invalidUuidBinary} />
        </LegacyUUIDDisplayContext.Provider>
      );

      expect(container.querySelector('.element-value')?.textContent).to.include(
        'Binary.createFromBase64('
      );
    });

    it('should fallback to raw format for all Legacy UUID formats on error', function () {
      const invalidUuidBinary = new Binary(
        Buffer.from('invalid'),
        Binary.SUBTYPE_UUID_OLD
      );

      const formats = [
        'LegacyJavaUUID',
        'LegacyCSharpUUID',
        'LegacyPythonUUID',
      ] as const;

      formats.forEach((format) => {
        const { container } = render(
          <LegacyUUIDDisplayContext.Provider value={format}>
            <BSONValue type="Binary" value={invalidUuidBinary} />
          </LegacyUUIDDisplayContext.Provider>
        );

        expect(
          container.querySelector('.element-value')?.textContent
        ).to.include(
          'Binary.createFromBase64(',
          `${format} should fallback to raw format`
        );
        expect(
          container.querySelector('.element-value')?.textContent
        ).to.include(', 3)', `${format} should show subtype 3`);
        cleanup();
      });
    });
  });
});
