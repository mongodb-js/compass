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
});
