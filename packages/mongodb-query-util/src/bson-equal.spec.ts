import { expect } from 'chai';
import { bsonEqual } from '.';

import { ObjectId, Decimal128, Long, Int32, Double } from 'bson';

describe('#bsonEqual', function () {
  context('when the value is an object id', function () {
    context('when the values are equal', function () {
      const id = new ObjectId();

      it('returns true', function () {
        expect(bsonEqual(id, id)).to.equal(true);
      });
    });

    context('when the values are not equal', function () {
      const id = new ObjectId();
      const other = new ObjectId();

      it('returns false', function () {
        expect(bsonEqual(id, other)).to.equal(false);
      });
    });
  });

  context('when the value is a decimal 128', function () {
    context('when the values are equal', function () {
      const first = new Decimal128('12.45');
      const second = new Decimal128('12.45');

      it('returns true', function () {
        expect(bsonEqual(first, second)).to.equal(true);
      });
    });

    context('when the values are not equal', function () {
      const first = new Decimal128('12.45');
      const second = new Decimal128('112.123');

      it('returns false', function () {
        expect(bsonEqual(first, second)).to.equal(false);
      });
    });
  });

  context('when the value is a long', function () {
    context('when the values are equal', function () {
      const first = new Long(12);
      const second = new Long(12);

      it('returns true', function () {
        expect(bsonEqual(first, second)).to.equal(true);
      });
    });

    context('when the values are not equal', function () {
      const first = new Long(12);
      const second = new Long(15);

      it('returns false', function () {
        expect(bsonEqual(first, second)).to.equal(false);
      });
    });
  });

  context('when the value is an int32', function () {
    context('when the values are equal', function () {
      const first = new Int32(12);
      const second = new Int32(12);

      it('returns true', function () {
        expect(bsonEqual(first, second)).to.equal(true);
      });
    });

    context('when the values are not equal', function () {
      const first = new Int32(12);
      const second = new Int32(15);

      it('returns false', function () {
        expect(bsonEqual(first, second)).to.equal(false);
      });
    });
  });

  context('when the value is a double', function () {
    context('when the values are equal', function () {
      const first = new Double(12.2);
      const second = new Double(12.2);

      it('returns true', function () {
        expect(bsonEqual(first, second)).to.equal(true);
      });
    });

    context('when the values are not equal', function () {
      const first = new Double(12.2);
      const second = new Double(15.2);

      it('returns false', function () {
        expect(bsonEqual(first, second)).to.equal(false);
      });
    });
  });

  context('when the value is a string', function () {
    it('returns undefined', function () {
      expect(bsonEqual('', '')).to.equal(undefined);
    });
  });
});
