import bson from 'bson';
import SplitLinesTransform from 'utils/split-lines-transform';

describe('SplitLinesTransform', () => {
  describe('#_transform', () => {
    context('when the type is json', () => {
      context('when the document has an object id', () => {
        const transform = new SplitLinesTransform('json');
        const id = new bson.ObjectId();
        const input = `{"field":{"$oid":"${id.toHexString()}"}}\n`;

        it('returns the object id document', (done) => {
          transform._transform(input, null, (error, data) => {
            expect(error).to.equal(null);
            expect(data[0].field.toHexString()).to.equal(id.toHexString());
            done();
          });
        });
      });

      context('when the document has a string', () => {
        const transform = new SplitLinesTransform('json');
        const input = '{"field":"testing"}\n';

        it('returns the string document', (done) => {
          transform._transform(input, null, (error, data) => {
            expect(error).to.equal(null);
            expect(data[0].field).to.equal('testing');
            done();
          });
        });
      });

      context('when the document has a binary', () => {
        const transform = new SplitLinesTransform('json');
        const input = '{"field":{"$binary":{"base64":"dGVzdA==","subType":"00"}}}\n';

        it('returns the binary document', (done) => {
          transform._transform(input, null, (error, data) => {
            expect(error).to.equal(null);
            expect(data[0].field.toString()).to.equal('test');
            expect(data[0].field.sub_type).to.equal(0);
            done();
          });
        });
      });

      context('when the document has a boolean', () => {
        const transform = new SplitLinesTransform('json');
        const input = '{"field":false}\n';

        it('returns the boolean document', (done) => {
          transform._transform(input, null, (error, data) => {
            expect(error).to.equal(null);
            expect(data[0].field).to.equal(false);
            done();
          });
        });
      });

      context('when the document has a code', () => {
        const transform = new SplitLinesTransform('json');
        const input = '{"field":{"$code":"test","$scope":{}}}\n';

        it('returns the code document', (done) => {
          transform._transform(input, null, (error, data) => {
            expect(error).to.equal(null);
            expect(data[0].field.code).to.equal('test');
            expect(data[0].field.scope).to.deep.equal({});
            done();
          });
        });
      });

      context('when the document has a date', () => {
        const transform = new SplitLinesTransform('json');
        const date = new Date('2014-01-01 05:00:00.000Z');
        const input = '{"field":{"$date":{"$numberLong":"1388552400000"}}}\n';

        it('returns the date document', (done) => {
          transform._transform(input, null, (error, data) => {
            expect(error).to.equal(null);
            expect(data[0].field).to.deep.equal(date);
            done();
          });
        });
      });

      context('when the document has a decimal 128', () => {
        const transform = new SplitLinesTransform('json');
        const num = bson.Decimal128.fromString('123.45');
        const input = '{"field":{"$numberDecimal":"123.45"}}\n';

        it('returns the decimal 128 document', (done) => {
          transform._transform(input, null, (error, data) => {
            expect(error).to.equal(null);
            expect(data[0].field).to.deep.equal(num);
            done();
          });
        });
      });

      context('when the document has a double', () => {
        const transform = new SplitLinesTransform('json');
        const num = new bson.Double(123.45);
        const input = '{"field":{"$numberDouble":"123.45"}}\n';

        it('returns the double document', (done) => {
          transform._transform(input, null, (error, data) => {
            expect(error).to.equal(null);
            expect(data[0].field).to.deep.equal(num);
            done();
          });
        });
      });

      context('when the document has an int32', () => {
        const transform = new SplitLinesTransform('json');
        const num = new bson.Int32('123');
        const input = '{"field":{"$numberInt":"123"}}\n';

        it('returns the int32 document', (done) => {
          transform._transform(input, null, (error, data) => {
            expect(error).to.equal(null);
            expect(data[0].field).to.deep.equal(num);
            done();
          });
        });
      });

      context('when the document has an int64', () => {
        const transform = new SplitLinesTransform('json');
        const num = new bson.Long(123);
        const input = '{"field":{"$numberLong":"123"}}\n';

        it('returns the int64 document', (done) => {
          transform._transform(input, null, (error, data) => {
            expect(error).to.equal(null);
            expect(data[0].field).to.deep.equal(num);
            done();
          });
        });
      });

      context('when the document has a max key', () => {
        const transform = new SplitLinesTransform('json');
        const val = new bson.MaxKey();
        const input = '{"field":{"$maxKey":1}}\n';

        it('returns the max key document', (done) => {
          transform._transform(input, null, (error, data) => {
            expect(error).to.equal(null);
            expect(data[0].field).to.deep.equal(val);
            done();
          });
        });
      });

      context('when the document has a min key', () => {
        const transform = new SplitLinesTransform('json');
        const val = new bson.MinKey();
        const input = '{"field":{"$minKey":1}}\n';

        it('returns the min key document', (done) => {
          transform._transform(input, null, (error, data) => {
            expect(error).to.equal(null);
            expect(data[0].field).to.deep.equal(val);
            done();
          });
        });
      });
    });

    context('when the type is csv', () => {

    });
  });
});
