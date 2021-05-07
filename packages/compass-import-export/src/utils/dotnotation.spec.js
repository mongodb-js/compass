/* eslint-disable no-var */
import dotnotation from './dotnotation';
import { ObjectID } from 'bson';

describe('dotnotation', () => {
  it('should handle simplest case', () => {
    var doc = {
      _id: 'arlo',
      name: 'Arlo',
      age: 5,
      location: {
        place: 'home',
        activity: {
          sleeping: true,
          is: 'on the couch'
        }
      }
    };

    expect(dotnotation.serialize(doc)).to.deep.equal({
      _id: 'arlo',
      name: 'Arlo',
      age: 5,
      'location.place': 'home',
      'location.activity.is': 'on the couch',
      'location.activity.sleeping': true
    });
  });

  it('should handle not recurse into bson types', () => {
    var oid = new ObjectID('5df51e94e92c7b5b333d6c4f');

    var doc = {
      _id: oid
    };

    var res = dotnotation.serialize(doc);
    expect(res).to.have.keys(['_id']);
    expect(res).to.deep.equal({
      _id: oid
    });
  });

  it('should handle not recurse into arrays', () => {
    var doc = {
      _id: 'compass',
      locations: ['berlin', 'nyc', 'philadelphia']
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
      locations: ['berlin', 'nyc', 'philadelphia']
    });
  });
});
