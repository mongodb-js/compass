import bson from 'bson';
import { expect } from 'chai';

import { Query } from './';

describe('Query [Model]', function() {
  context('#serialize', function() {
    context('when the document contains a BSON type', function() {
      const oid = new bson.ObjectId();
      const filter = { _id: oid };
      const query = new Query({ filter: filter });

      it('converts to an extended json object', function() {
        expect(query.serialize().filter).to.deep.equal({
          _id: {
            '$oid': oid.toHexString()
          }
        });
      });
    });
  });

  context('#parse', function() {
    const oid = new bson.ObjectId();
    const query = new Query();
    const obj = {
      filter: {
        _id: {
          '$oid': oid.toHexString()
        }
      }
    };

    it('converts from extended json back to objects', function() {
      expect(query.parse(obj).filter._id).to.deep.equal(oid);
    });
  });
});
