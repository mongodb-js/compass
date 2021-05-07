import bson from 'bson';
import { Query } from 'models';

describe('Query [Model]', () => {
  context('#serialize', () => {
    context('when the document contains a BSON type', () => {
      const oid = new bson.ObjectId();
      const filter = { _id: oid };
      const query = new Query({ filter: filter });

      it('converts to an extended json object', () => {
        expect(query.serialize().filter).to.deep.equal({
          _id: {
            '$oid': oid.toHexString()
          }
        });
      });
    });
  });

  context('#parse', () => {
    const oid = new bson.ObjectId();
    const query = new Query();
    const obj = {
      filter: {
        _id: {
          '$oid': oid.toHexString()
        }
      }
    };

    it('converts from extended json back to objects', () => {
      expect(query.parse(obj).filter._id).to.deep.equal(oid);
    });
  });
});
