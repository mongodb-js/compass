import _ from 'lodash';
import { Buffer } from 'buffer';
import {
  EJSON,
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

import type { Document } from 'bson';

export type Fixture = {
  name: string;
  before: Document;
  after: Document;
};

export type FixtureGroup = {
  name: string;
  fixtures: Fixture[];
};

const allTypesDoc: Document = {
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
};

const allTypesDocChanged: Document = {
  _id: new ObjectId('6564759d220c47fd4c97379c'),
  double: new Double(1.3), // Double, 1, double
  string: 'oh no!', // String, 2, string
  object: { foo: 'bar' }, // Object, 3, object
  array: [1, 2, 3, 4], // Array, 4, array
  binData: new Binary(Buffer.from([1, 2, 3, 4])), // Binary data, 5, binData
  // Undefined, 6, undefined (deprecated)
  objectId: new ObjectId('656475ac220c47fd4c97379d'), // ObjectId, 7, objectId
  boolean: false, // Boolean, 8, boolean
  date: new Date('2023-04-05T13:25:08.446Z'), // Date, 9, date
  null: null, // Null, 10, null
  regex: new BSONRegExp('patterns', 'i'), // Regular Expression, 11, regex
  // DBPointer, 12, dbPointer (deprecated)
  javascript: new Code('function() { /* woop */ }'), // JavaScript, 13, javascript
  symbol: new BSONSymbol('symbols are deprecated'), // Symbol, 14, symbol (deprecated)
  javascriptWithScope: new Code('function() {}', { foo: 'a', bar: '1' }), // JavaScript code with scope 15 "javascriptWithScope" Deprecated in MongoDB 4.4.
  int: new Int32(123456), // 32-bit integer, 16, "int"
  timestamp: new Timestamp(new Long('7218556297505931266')), // Timestamp, 17, timestamp
  long: new Long('1234567891234567890'), // 64-bit integer, 18, long
  decimal: new Decimal128(
    Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 17])
  ), // Decimal128, 19, decimal
  minKey: new MinKey(), // Min key, -1, minKey
  maxKey: new MaxKey(), // Max key, 127, maxKey

  binaries: {
    generic: new Binary(Buffer.from([1, 2, 3, 4]), 0), // 0
    functionData: new Binary(Buffer.from('//8= '), 1), // 1
    binaryOld: new Binary(Buffer.from('//8= '), 2), // 2
    uuidOld: new Binary(Buffer.from('0123456789abcdef0123456789abcdef'), 3), // 3
    uuid: new UUID('0e1f691e-d3ed-45d8-a151-cb9c995c50ff'), // 4
    md5: new Binary(Buffer.from('0123456789abcdef0123456789abcdef'), 5), // 5
    encrypted: new Binary(Buffer.from('0123456789abcdef0123456789abcdef'), 6), // 6
    compressedTimeSeries: new Binary(
      Buffer.from('0123456789abcdef0123456789abcdef'),
      7
    ), // 7
    custom: new Binary(Buffer.from('0123456789abcdef0123456789abcdef'), 128), // 128
  },

  dbRef: new DBRef('namespace', new ObjectId('642d76b4b7ebfab15d3c4a79')), // not actually a separate type, just a convention
};

const smallChangeDoc: Document = _.clone(allTypesDoc);

smallChangeDoc.string = 'oh no!';

const airbnb = EJSON.deserialize(
  {
    _id: {
      $oid: '65648c68cf3ba12a2fcb9c1e',
    },
    id: 13913,
    listing_url: 'https://www.airbnb.com/rooms/13913',
    scrape_id: {
      $numberLong: '20220910194334',
    },
    last_scraped: {
      $date: '2022-09-11T00:00:00.000Z',
    },
    source: 'city scrape',
    name: 'Holiday London DB Room Let-on going',
    description:
      "My bright double bedroom with a large window has a relaxed feeling! It comfortably fits one or two and is centrally located just two blocks from Finsbury Park. Enjoy great restaurants in the area and easy access to easy transport tubes, trains and buses. Babies and children of all ages are welcome.<br /><br /><b>The space</b><br />Hello Everyone,<br /><br />I'm offering my lovely double bedroom in Finsbury Park area (zone 2) for let in a shared apartment. <br />You will share the apartment with me and it is fully furnished with a self catering kitchen. Two people can easily sleep well as the room has a queen size bed. I also have a travel cot for a baby for guest with small children. <br /><br />I will require a deposit up front as a security gesture on both our parts and will be given back to you when you return the keys. <br /><br />I trust anyone who will be responding to this add would treat my home with care and respect . <br /><br />Best Wishes <br /><br />Alina<br /><br /><b>Gue",
    neighborhood_overview:
      'Finsbury Park is a friendly melting pot community composed of Turkish, French, Spanish, Middle Eastern, Irish and English families. <br />We have a wonderful variety of international restaurants directly under us on Stroud Green Road. And there are many shops and large Tescos supermarket right next door. <br /><br />But you can also venture up to Crouch End and along Greens Lanes where there will endless choice of Turkish and Middle Eastern cuisines.s',
    picture_url:
      'https://a0.muscache.com/pictures/miso/Hosting-13913/original/d755aa6d-cebb-4464-80be-2722c921e8d5.jpeg',
    host_id: 54730,
    host_url: 'https://www.airbnb.com/users/show/54730',
    host_name: 'Alina',
    host_since: {
      $date: '2009-11-16T00:00:00.000Z',
    },
    host_location: 'London, United Kingdom',
    host_about:
      'I am a Multi-Media Visual Artist and Creative Practitioner in Education. I live in  London England with a Greek/Canadian origins and work internationally. \r\n\r\nI love everything there is to be enjoyed in life and travel is on top of my list!',
    host_response_time: 'within a day',
    host_response_rate: '80%',
    host_acceptance_rate: '70%',
    host_is_superhost: false,
    host_thumbnail_url:
      'https://a0.muscache.com/im/users/54730/profile_pic/1327774386/original.jpg?aki_policy=profile_small',
    host_picture_url:
      'https://a0.muscache.com/im/users/54730/profile_pic/1327774386/original.jpg?aki_policy=profile_x_medium',
    host_neighbourhood: 'LB of Islington',
    host_listings_count: 3,
    host_total_listings_count: 4,
    host_verifications: "['email', 'phone']",
    host_has_profile_pic: true,
    host_identity_verified: true,
    neighbourhood: 'Islington, Greater London, United Kingdom',
    neighbourhood_cleansed: 'Islington',
    latitude: 51.56861,
    longitude: -0.1127,
    property_type: 'Private room in rental unit',
    room_type: 'Private room',
    accommodates: 1,
    bathrooms_text: '1 shared bath',
    bedrooms: 1,
    beds: 1,
    amenities: [
      'Extra pillows and blankets',
      'Oven',
      'Fire extinguisher',
      'Hair dryer',
      'Hangers',
      'Crib',
      'Dishes and silverware',
      'Luggage dropoff allowed',
      'Essentials',
      'Outlet covers',
      'Patio or balcony',
      'Shampoo',
      'Free parking on premises',
      'TV with standard cable',
      'Free street parking',
      'Cooking basics',
      'Bed linens',
      'Babysitter recommendations',
      'Carbon monoxide alarm',
      'Bathtub',
      'Heating',
      'Wifi',
      'Building staff',
      'Children’s books and toys',
      'Coffee maker',
      'Long term stays allowed',
      'Pack ’n play/Travel crib',
      'Refrigerator',
      'Room-darkening shades',
      'Iron',
      'Kitchen',
      'Stove',
      'Lock on bedroom door',
      'Hot water',
      'Washer',
      'Paid parking off premises',
      'Children’s dinnerware',
      'Smoke alarm',
      'Ethernet connection',
      'Dryer',
      'Cable TV',
    ],
    price: '$50.00',
    minimum_nights: 1,
    maximum_nights: 29,
    minimum_minimum_nights: 1,
    maximum_minimum_nights: 1,
    minimum_maximum_nights: 29,
    maximum_maximum_nights: 29,
    minimum_nights_avg_ntm: 1,
    maximum_nights_avg_ntm: 29,
    has_availability: true,
    availability_30: 17,
    availability_60: 38,
    availability_90: 68,
    availability_365: 343,
    calendar_last_scraped: {
      $date: '2022-09-11T00:00:00.000Z',
    },
    number_of_reviews: 30,
    number_of_reviews_ltm: 9,
    number_of_reviews_l30d: 0,
    first_review: {
      $date: '2010-08-18T00:00:00.000Z',
    },
    last_review: {
      $date: '2022-07-15T00:00:00.000Z',
    },
    review_scores_rating: 4.9,
    review_scores_accuracy: 4.82,
    review_scores_cleanliness: 4.89,
    review_scores_checkin: 4.86,
    review_scores_communication: 4.93,
    review_scores_location: 4.75,
    review_scores_value: 4.82,
    instant_bookable: false,
    calculated_host_listings_count: 2,
    calculated_host_listings_count_entire_homes: 1,
    calculated_host_listings_count_private_rooms: 1,
    calculated_host_listings_count_shared_rooms: 0,
    reviews_per_month: 0.2,
  },
  { relaxed: false }
);

export const fixtureGroups: FixtureGroup[] = [
  {
    name: 'all types',
    fixtures: [
      {
        name: 'all types identical',
        before: allTypesDoc,
        after: _.clone(allTypesDoc),
      },
      {
        name: 'small change',
        before: allTypesDoc,
        after: smallChangeDoc,
      },
      {
        name: 'all types add',
        before: {},
        after: allTypesDoc,
      },
      {
        name: 'all types remove',
        before: allTypesDoc,
        after: {},
      },
      {
        name: 'all types changed',
        before: allTypesDoc,
        after: allTypesDocChanged,
      },
    ],
  },
  {
    name: 'simple',
    fixtures: [
      {
        name: 'simple add',
        before: {},
        after: { foo: 'bar' },
      },
      {
        name: 'simple remove',
        before: { foo: 'bar' },
        after: {},
      },
      {
        name: 'same simple type',
        before: { foo: 1 },
        after: { foo: 2 },
      },
      {
        name: 'different simple types',
        before: { foo: 1 },
        after: { foo: 'a' },
      },
      {
        name: 'add field',
        before: { foo: 'a' },
        after: { foo: 'a', bar: 'b' },
      },
      {
        name: 'remove field',
        before: { foo: 'a', bar: 'b' },
        after: { foo: 'a' },
      },
    ],
  },
  {
    name: 'nested object changes',
    fixtures: [
      {
        name: 'nested object simple',
        before: { foo: { bar: 1 } },
        after: { foo: { bar: 'a' } },
      },
      {
        name: 'nested object array simple',
        before: { foo: { bar: [1] } },
        after: { foo: { bar: ['a'] } },
      },
      {
        name: 'nested object array array simple',
        before: { foo: { bar: [[1]] } },
        after: { foo: { bar: [['a']] } },
      },
    ],
  },
  {
    name: 'array changes',
    fixtures: [
      {
        name: 'simple array',
        before: { foo: [1, 2, 3] },
        after: { foo: ['a', 'b', 'c'] },
      },
      {
        name: 'add simple value to array',
        before: { foo: [1, 2, 3] },
        after: { foo: [1, 2, 3, 4] },
      },
      {
        name: 'add object to array',
        before: { foo: [{ a: 1 }] },
        after: { foo: [{ a: 1 }, { bar: 'baz' }] },
      },
      {
        name: 'add array to array',
        before: { foo: [[1]] },
        after: { foo: [[1], [2]] },
      },
      {
        name: 'remove simple value from array',
        before: { foo: [1, 2, 3] },
        after: { foo: [1, 3] },
      },
      {
        name: 'remove object from array',
        before: { foo: [{ a: 1 }, { bar: 'baz' }] },
        after: { foo: [{ a: 1 }] },
      },
      {
        name: 'remove array from array',
        before: { foo: [[1], [2]] },
        after: { foo: [[1]] },
      },
    ],
  },
  {
    name: 'objects in arrays',
    fixtures: [
      {
        name: 'object value nested in an array',
        before: { foo: [{ bar: 1 }] },
        after: { foo: [{ bar: 2 }] },
      },
      {
        name: 'add number next to object in array',
        before: { foo: [{ bar: 'baz' }] },
        after: { foo: [0, { bar: 'baz' }] },
      },
      {
        name: 'remove number next to object in array',
        before: { foo: [0, { bar: 'baz' }] },
        after: { foo: [{ bar: 'baz' }] },
      },
      {
        name: 'object inside array changed',
        before: { foo: [0, { bar: 'baz' }] },
        after: { foo: [0, { bar: 'bazz' }] },
      },
      {
        name: 'many items',
        before: {
          foo: [
            { i: 0 },
            { i: 1 },
            { i: 2 },
            { i: 3 },
            { i: 4 },
            { i: 5 },
            { i: 6 },
            { i: 7 },
            { i: 8 },
            { i: 9 },
          ],
        },
        after: {
          foo: [
            { i: 0, newField: 1 },
            { i: 1, newField: 1 },
            { i: 2, newField: 1 },
            { i: 3, newField: 1 },
            { i: 4, newField: 1 },
            { i: 5, newField: 1 },
            { i: 6, newField: 1 },
            { i: 7, newField: 1 },
            { i: 8, newField: 1 },
            { i: 9, newField: 1 },
          ],
        },
      },
    ],
  },
  {
    name: 'shape changes',
    fixtures: [
      {
        name: 'simple to object',
        before: { foo: 1 },
        after: { foo: { bar: 'baz' } },
      },
      {
        name: 'simple to array',
        before: { foo: 1 },
        after: { foo: [1, 2] },
      },
      {
        name: 'object to array',
        before: { foo: { bar: 'baz' } },
        after: { foo: [1, 2] },
      },
      {
        name: 'object to simple',
        before: { foo: { bar: 'baz' } },
        after: { foo: 1 },
      },
      {
        name: 'array to object',
        before: { foo: [1, 2] },
        after: { foo: { bar: 'baz' } },
      },
      {
        name: 'array to simple',
        before: { foo: [1, 2] },
        after: { foo: 1 },
      },
    ],
  },
  {
    name: 'bson',
    fixtures: [
      {
        name: 'type change',
        before: { foo: new Double(1.2) },
        after: { foo: new Int32(1) },
      },
    ],
  },
  {
    name: 'stress tests',
    fixtures: [
      {
        name: 'airbnb',
        before: airbnb,
        after: _.clone(airbnb),
      },
    ],
  },
];
