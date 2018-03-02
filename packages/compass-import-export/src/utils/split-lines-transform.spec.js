import bson from 'bson';
import SplitLinesTransform from 'utils/split-lines-transform';

describe('SplitLinesTransform', () => {
  describe('#_transform', () => {
    context('when the type is json', () => {
      context('when the document has an object id', () => {
        const transform = new SplitLinesTransform('json');
        const id = new bson.ObjectId();
        const input = `{"field":{"$oid":"${id.toHexString()}"}}\n`;

        it('returns the object from the string', (done) => {
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

        it('returns the extended json with line break', (done) => {
          transform._transform(input, null, (error, data) => {
            expect(error).to.equal(null);
            expect(data[0].field).to.equal('testing');
            done();
          });
        });
      });
    });

    context('when the type is csv', () => {

    });
  });
});
