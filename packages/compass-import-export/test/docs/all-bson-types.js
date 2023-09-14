import {
  BSONRegExp,
  Binary,
  Code,
  DBRef,
  Decimal128,
  Double,
  Int32,
  Long,
  MaxKey,
  MinKey,
  ObjectId,
  Timestamp,
  UUID,
  BSONSymbol,
} from 'bson';

export default [
  {
    _id: new ObjectId('642d766b7300158b1f22e972'),
    double: new Double(1.2), // Double, 1, double
    string: 'Hello, world!', // String, 2, string
    object: { key: 'value' }, // Object, 3, object
    array: [1, 2, 3], // Array, 4, array
    binData: new Binary(Buffer.from([1, 2, 3])), // Binary data, 5, binData
    // Undefined, 6, undefined (deprecated)
    objectId: new ObjectId('642d766c7300158b1f22e975'), // ObjectId, 7, objectId
    boolean: true, // Boolean, 8, boolean
    date: new Date('2023-04-05T13:25:08.445Z'), // Date, 9, date
    null: null, // Null, 10, null
    regex: new BSONRegExp('pattern', 'i'), // Regular Expression, 11, regex
    // DBPointer, 12, dbPointer (deprecated)
    javascript: new Code('function() {}'), // JavaScript, 13, javascript
    symbol: new BSONSymbol('symbol'), // Symbol, 14, symbol (deprecated)
    javascriptWithScope: new Code('function() {}', { foo: 1, bar: 'a' }), // JavaScript code with scope 15 "javascriptWithScope" Deprecated in MongoDB 4.4.
    int: new Int32(12345), // 32-bit integer, 16, "int"
    timestamp: new Timestamp(new Long('7218556297505931265')), // Timestamp, 17, timestamp
    long: new Long('123456789123456789'), // 64-bit integer, 18, long
    decimal: new Decimal128(
      Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])
    ), // Decimal128, 19, decimal
    minKey: new MinKey(), // Min key, -1, minKey
    maxKey: new MaxKey(), // Max key, 127, maxKey

    binaries: {
      generic: new Binary(Buffer.from([1, 2, 3]), 0), // 0
      functionData: new Binary(Buffer.from('//8='), 1), // 1
      binaryOld: new Binary(Buffer.from('//8='), 2), // 2
      uuidOld: new Binary(Buffer.from('c//SZESzTGmQ6OfR38A11A=='), 3), // 3
      uuid: new UUID('AAAAAAAA-AAAA-4AAA-AAAA-AAAAAAAAAAAA'), // 4
      md5: new Binary(Buffer.from('c//SZESzTGmQ6OfR38A11A=='), 5), // 5
      encrypted: new Binary(Buffer.from('c//SZESzTGmQ6OfR38A11A=='), 6), // 6
      compressedTimeSeries: new Binary(
        Buffer.from('c//SZESzTGmQ6OfR38A11A=='),
        7
      ), // 7
      custom: new Binary(Buffer.from('//8='), 128), // 128
    },

    dbRef: new DBRef('namespace', new ObjectId('642d76b4b7ebfab15d3c4a78')), // not actually a separate type, just a convention
  },
];
