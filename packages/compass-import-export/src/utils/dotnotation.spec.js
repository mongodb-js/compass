/* eslint-disable no-var */
import { expect } from 'chai';

import dotnotation from './dotnotation';
import { ObjectID } from 'bson';

describe('dotnotation', function () {
  it('should handle simplest case', function () {
    var doc = {
      _id: 'arlo',
      name: 'Arlo',
      age: 5,
      location: {
        place: 'home',
        activity: {
          sleeping: true,
          is: 'on the couch',
        },
      },
    };

    expect(dotnotation.serialize(doc)).to.deep.equal({
      _id: 'arlo',
      name: 'Arlo',
      age: 5,
      'location.place': 'home',
      'location.activity.is': 'on the couch',
      'location.activity.sleeping': true,
    });
  });

  it('should handle not recurse into bson types', function () {
    var oid = new ObjectID('5df51e94e92c7b5b333d6c4f');

    var doc = {
      _id: oid,
    };

    var res = dotnotation.serialize(doc);
    expect(res).to.have.keys(['_id']);
    expect(res).to.deep.equal({
      _id: oid,
    });
  });

  it('should handle not recurse into arrays', function () {
    var doc = {
      _id: 'compass',
      locations: ['berlin', 'nyc', 'philadelphia'],
    };
    var res = dotnotation.serialize(doc);
    expect(res).to.have.keys(['_id', 'locations']);
    /**
     * NOTE: lucas: This may seem silly but convention
     * for all flatten-ing libraries is to recurse into
     * arrays like: `'locations.0'` or `locations.[]`.
     */
    expect(res).to.deep.equal({
      _id: 'compass',
      locations: ['berlin', 'nyc', 'philadelphia'],
    });
  });

  it('should pre-generate objects when includeObjects is specified', function () {
    expect(
      dotnotation.serialize(
        {
          foo: {
            1: 'a',
            two: 'b',
          },
        },
        { includeObjects: true }
      )
    ).to.deep.equal({
      foo: {},
      'foo.1': 'a',
      'foo.two': 'b',
    });

    // leaves arrays alone - already handled by flatten() with { safe: true }
    expect(
      dotnotation.serialize(
        {
          foo: ['a', 'b'],
        },
        { includeObjects: true }
      )
    ).to.deep.equal({
      foo: ['a', 'b'],
    });
  });

  it('should parse deeply nested objects without including objects', function () {
    const serializedObject = dotnotation.serialize(
      {
        supermarket: {
          fruits: {
            oranges: {
              amount: {
                '2022-01-15': 1.66,
                '2022-02-16': 1.22,
                '2022-03-13': 1.11,
                '2022-04-14': 7.69,
              },
            },
            apples: {
              a: 123,
              amount: {
                '2022-01-15': 3.47,
                '2022-02-14': 4.18,
                '2022-03-15': 4.18,
              },
            },
            currency: 'usd',
          },
        },
        test: '123',
      },
      { includeObjects: false }
    );

    expect(serializedObject).to.deep.equal({
      'supermarket.fruits.oranges.amount.2022-01-15': 1.66,
      'supermarket.fruits.oranges.amount.2022-02-16': 1.22,
      'supermarket.fruits.oranges.amount.2022-03-13': 1.11,
      'supermarket.fruits.oranges.amount.2022-04-14': 7.69,
      'supermarket.fruits.apples.amount.2022-01-15': 3.47,
      'supermarket.fruits.apples.amount.2022-02-14': 4.18,
      'supermarket.fruits.apples.amount.2022-03-15': 4.18,
      'supermarket.fruits.apples.a': 123,
      'supermarket.fruits.currency': 'usd',
      test: '123',
    });
  });

  it('should parse deeply nested objects without overriding arrays', function () {
    const serializedObject = dotnotation.serialize(
      {
        supermarket: {
          17: 76,
          fruits: {
            apples: {
              12: '34',
              amount: {
                '2022-01-15': 3.47,
                '2022-02-14': 4.18,
                '2022-03-15': 4.18,
              },
              a: 123,
            },
            currency: 'usd',
          },
        },
        test: '123',
        a: {
          b: {
            c: {
              17: 76,
              d: {
                a: 'ok',
                99: 'test',
              },
              f: [
                {
                  aa: {
                    bb: {
                      123: 'test',
                    },
                    4: 5,
                  },
                },
              ],
            },
          },
        },
      },
      { includeObjects: true }
    );

    expect(serializedObject).to.deep.equal({
      supermarket: {},
      'supermarket.17': 76,
      'supermarket.fruits': {},
      'supermarket.fruits.apples': {},
      'supermarket.fruits.apples.12': '34',
      'supermarket.fruits.apples.amount': {},
      'supermarket.fruits.apples.amount.2022-01-15': 3.47,
      'supermarket.fruits.apples.amount.2022-02-14': 4.18,
      'supermarket.fruits.apples.amount.2022-03-15': 4.18,
      'supermarket.fruits.apples.a': 123,
      'supermarket.fruits.currency': 'usd',
      test: '123',
      a: {},
      'a.b': {},
      'a.b.c': {},
      'a.b.c.17': 76,
      'a.b.c.d': {},
      'a.b.c.d.a': 'ok',
      'a.b.c.d.99': 'test',
      'a.b.c.f': [
        {
          aa: {
            4: 5,
            bb: {
              123: 'test',
            },
          },
        },
      ],
    });
  });

  it('should parse deeply nested objects', function () {
    const serializedObject = dotnotation.serialize(
      {
        supermarket: {
          fruits: {
            oranges: {
              aTest: ['test'],
              amount: {
                '2022-01-15': 1.66,
                '2022-02-16': 1.22,
                '2022-03-13': 1.11,
                '2022-04-14': 7.69,
              },
            },
            apples: {
              a: 123,
              amount: {
                '2022-01-15': 3.47,
                '2022-02-14': 4.18,
                '2022-03-15': 4.18,
              },
              arrayTest: ['test'],
            },
            currency: 'usd',
          },
        },
        test: '123',
      },
      { includeObjects: true }
    );

    expect(serializedObject).to.deep.equal({
      supermarket: {},
      'supermarket.fruits': {},
      'supermarket.fruits.oranges': {},
      'supermarket.fruits.oranges.aTest': ['test'],
      'supermarket.fruits.oranges.amount': {},
      'supermarket.fruits.oranges.amount.2022-01-15': 1.66,
      'supermarket.fruits.oranges.amount.2022-02-16': 1.22,
      'supermarket.fruits.oranges.amount.2022-03-13': 1.11,
      'supermarket.fruits.oranges.amount.2022-04-14': 7.69,
      'supermarket.fruits.apples': {},
      'supermarket.fruits.apples.amount': {},
      'supermarket.fruits.apples.amount.2022-01-15': 3.47,
      'supermarket.fruits.apples.amount.2022-02-14': 4.18,
      'supermarket.fruits.apples.amount.2022-03-15': 4.18,
      'supermarket.fruits.apples.arrayTest': ['test'],
      'supermarket.fruits.apples.a': 123,
      'supermarket.fruits.currency': 'usd',
      test: '123',
    });
  });
});
