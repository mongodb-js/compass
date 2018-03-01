import bson from 'bson';
import DocumentTransform from 'utils/document-transform';

describe('DocumentTransform', () => {
  describe('#_transform', () => {
    context('when the type is json', () => {
      const transform = new DocumentTransform('json');

      context('when the document has an object id', () => {
        const id = new bson.ObjectId();
        const object = { field: id };

        it('returns the extended json with line break', (done) => {
          transform._transform(object, null, (error, data) => {
            expect(error).to.equal(null);
            expect(data).to.equal(`{"field":{"$oid":"${id.toHexString()}"}}\n`);
            done();
          });
        });
      });

      context('when the document has a string', () => {
        const object = { field: 'testing' };

        it('returns the extended json with line break', (done) => {
          transform._transform(object, null, (error, data) => {
            expect(error).to.equal(null);
            expect(data).to.equal('{"field":"testing"}\n');
            done();
          });
        });
      });

      context('when the document has a binary', () => {
        const binary = new bson.Binary('test');
        const object = { field: binary };

        it('returns the extended json with line break', (done) => {
          transform._transform(object, null, (error, data) => {
            expect(error).to.equal(null);
            expect(data).to.equal('{"field":{"$binary":{"base64":"dGVzdA==","subType":"00"}}}\n');
            done();
          });
        });
      });

      context('when the document has a boolean', () => {
        const object = { field: false };

        it('returns the extended json with line break', (done) => {
          transform._transform(object, null, (error, data) => {
            expect(error).to.equal(null);
            expect(data).to.equal('{"field":false}\n');
            done();
          });
        });
      });

      context('when the document has a code', () => {
        const code = new bson.Code('test', {});
        const object = { field: code };

        it('returns the extended json with line break', (done) => {
          transform._transform(object, null, (error, data) => {
            expect(error).to.equal(null);
            expect(data).to.equal('{"field":{"$code":"test","$scope":{}}}\n');
            done();
          });
        });
      });

      context('when the document has a date', () => {
        const date = new Date('2014-01-01 05:00:00.000Z');
        const object = { field: date };

        it('returns the extended json with line break', (done) => {
          transform._transform(object, null, (error, data) => {
            expect(error).to.equal(null);
            expect(data).to.equal('{"field":{"$date":{"$numberLong":"1388552400000"}}}\n');
            done();
          });
        });
      });

      context('when the document has a decimal 128', () => {
        const num = bson.Decimal128.fromString('123.45');
        const object = { field: num };

        it('returns the extended json with line break', (done) => {
          transform._transform(object, null, (error, data) => {
            expect(error).to.equal(null);
            expect(data).to.equal('{"field":{"$numberDecimal":"123.45"}}\n');
            done();
          });
        });
      });

      context('when the document has a double', () => {
        const num = new bson.Double(123.45);
        const object = { field: num };

        it('returns the extended json with line break', (done) => {
          transform._transform(object, null, (error, data) => {
            expect(error).to.equal(null);
            expect(data).to.equal('{"field":{"$numberDouble":"123.45"}}\n');
            done();
          });
        });
      });

      context('when the document has an int32', () => {
        const num = new bson.Int32(123);
        const object = { field: num };

        it('returns the extended json with line break', (done) => {
          transform._transform(object, null, (error, data) => {
            expect(error).to.equal(null);
            expect(data).to.equal('{"field":{"$numberInt":"123"}}\n');
            done();
          });
        });
      });

      context('when the document has an int64', () => {
        const num = new bson.Long(123);
        const object = { field: num };

        it('returns the extended json with line break', (done) => {
          transform._transform(object, null, (error, data) => {
            expect(error).to.equal(null);
            expect(data).to.equal('{"field":{"$numberLong":"123"}}\n');
            done();
          });
        });
      });

      context('when the document has a max key', () => {
        const val = new bson.MaxKey();
        const object = { field: val };

        it('returns the extended json with line break', (done) => {
          transform._transform(object, null, (error, data) => {
            expect(error).to.equal(null);
            expect(data).to.equal('{"field":{"$maxKey":1}}\n');
            done();
          });
        });
      });

      context('when the document has a min key', () => {
        const val = new bson.MinKey();
        const object = { field: val };

        it('returns the extended json with line break', (done) => {
          transform._transform(object, null, (error, data) => {
            expect(error).to.equal(null);
            expect(data).to.equal('{"field":{"$minKey":1}}\n');
            done();
          });
        });
      });

      context('when the document has a null', () => {
        const object = { field: null };

        it('returns the extended json with line break', (done) => {
          transform._transform(object, null, (error, data) => {
            expect(error).to.equal(null);
            expect(data).to.equal('{"field":null}\n');
            done();
          });
        });
      });

      context('when the document has an object', () => {
        const val = { name: 'test' };
        const object = { field: val };

        it('returns the extended json with line break', (done) => {
          transform._transform(object, null, (error, data) => {
            expect(error).to.equal(null);
            expect(data).to.equal('{"field":{"name":"test"}}\n');
            done();
          });
        });
      });

      context('when the document has a regex', () => {
        const val = new bson.BSONRegExp('/test/');
        const object = { field: val };

        it('returns the extended json with line break', (done) => {
          transform._transform(object, null, (error, data) => {
            expect(error).to.equal(null);
            expect(data).to.equal('{"field":{"$regularExpression":{"pattern":"/test/","options":""}}}\n');
            done();
          });
        });
      });

      context('when the document has a timestamp', () => {
        const val = bson.Timestamp.fromInt(10);
        const object = { field: val };

        it('returns the extended json with line break', (done) => {
          transform._transform(object, null, (error, data) => {
            expect(error).to.equal(null);
            expect(data).to.equal('{"field":{"$timestamp":{"t":0,"i":10}}}\n');
            done();
          });
        });
      });

      context('when the document has an undefined', () => {
        const object = { field: undefined };

        it('returns the extended json with line break', (done) => {
          transform._transform(object, null, (error, data) => {
            expect(error).to.equal(null);
            expect(data).to.equal('{"field":null}\n');
            done();
          });
        });
      });
    });

    context('when the type is csv', () => {
      const transform = new DocumentTransform('csv');

      context('when the header row has been written', () => {
        before(() => {
          transform.isFirstRecord = false;
        });

        context('when the document has an object id', () => {
          const id = new bson.ObjectId();
          const object = { field: id };

          it('returns the extended json with line break', (done) => {
            transform._transform(object, null, (error, data) => {
              expect(error).to.equal(null);
              expect(data).to.equal(`ObjectId("${id.toHexString()}")\n`);
              done();
            });
          });
        });

        context('when the document has a string', () => {
          const object = { field: 'testing' };

          it('returns the extended json with line break', (done) => {
            transform._transform(object, null, (error, data) => {
              expect(error).to.equal(null);
              expect(data).to.equal('testing\n');
              done();
            });
          });
        });

        context('when the document has a binary', () => {
          const binary = new bson.Binary('test');
          const object = { field: binary };

          it('returns the extended json with line break', (done) => {
            transform._transform(object, null, (error, data) => {
              expect(error).to.equal(null);
              expect(data).to.equal('Binary("test",0)\n');
              done();
            });
          });
        });

        context('when the document has a boolean', () => {
          const object = { field: false };

          it('returns the extended json with line break', (done) => {
            transform._transform(object, null, (error, data) => {
              expect(error).to.equal(null);
              expect(data).to.equal('false\n');
              done();
            });
          });
        });

        context('when the document has a code', () => {
          const code = new bson.Code('test', {});
          const object = { field: code };

          it('returns the extended json with line break', (done) => {
            transform._transform(object, null, (error, data) => {
              expect(error).to.equal(null);
              expect(data).to.equal('Code("test",{})\n');
              done();
            });
          });
        });

        context('when the document has a date', () => {
          const date = new Date('2014-01-01 05:00:00.000Z');
          const object = { field: date };

          it('returns the extended json with line break', (done) => {
            transform._transform(object, null, (error, data) => {
              expect(error).to.equal(null);
              expect(data).to.equal('2014-01-01T05:00:00.000Z\n');
              done();
            });
          });
        });

        context('when the document has a decimal 128', () => {
          const num = bson.Decimal128.fromString('123.45');
          const object = { field: num };

          it('returns the extended json with line break', (done) => {
            transform._transform(object, null, (error, data) => {
              expect(error).to.equal(null);
              expect(data).to.equal('123.45\n');
              done();
            });
          });
        });

        context('when the document has a double', () => {
          const num = new bson.Double(123.45);
          const object = { field: num };

          it('returns the extended json with line break', (done) => {
            transform._transform(object, null, (error, data) => {
              expect(error).to.equal(null);
              expect(data).to.equal('123.45\n');
              done();
            });
          });
        });

        context('when the document has an int32', () => {
          const num = new bson.Int32(123);
          const object = { field: num };

          it('returns the extended json with line break', (done) => {
            transform._transform(object, null, (error, data) => {
              expect(error).to.equal(null);
              expect(data).to.equal('123\n');
              done();
            });
          });
        });

        context('when the document has an int64', () => {
          const num = new bson.Long(123);
          const object = { field: num };

          it('returns the extended json with line break', (done) => {
            transform._transform(object, null, (error, data) => {
              expect(error).to.equal(null);
              expect(data).to.equal('123\n');
              done();
            });
          });
        });

        context('when the document has a max key', () => {
          const val = new bson.MaxKey();
          const object = { field: val };

          it('returns the extended json with line break', (done) => {
            transform._transform(object, null, (error, data) => {
              expect(error).to.equal(null);
              expect(data).to.equal('MaxKey()\n');
              done();
            });
          });
        });

        context('when the document has a min key', () => {
          const val = new bson.MinKey();
          const object = { field: val };

          it('returns the extended json with line break', (done) => {
            transform._transform(object, null, (error, data) => {
              expect(error).to.equal(null);
              expect(data).to.equal('MinKey()\n');
              done();
            });
          });
        });

        context('when the document has a null', () => {
          const object = { field: null };

          it('returns the extended json with line break', (done) => {
            transform._transform(object, null, (error, data) => {
              expect(error).to.equal(null);
              expect(data).to.equal('\n');
              done();
            });
          });
        });

        context('when the document has an object', () => {
          const val = { name: 'test' };
          const object = { field: val };

          it('returns the extended json with line break', (done) => {
            transform._transform(object, null, (error, data) => {
              expect(error).to.equal(null);
              expect(data).to.equal('"{"name":"test"}"\n');
              done();
            });
          });
        });

        context('when the document has a regex', () => {
          const val = new bson.BSONRegExp('/test/i');
          const object = { field: val };

          it('returns the extended json with line break', (done) => {
            transform._transform(object, null, (error, data) => {
              expect(error).to.equal(null);
              expect(data).to.equal('/test/i\n');
              done();
            });
          });
        });

        context('when the document has a timestamp', () => {
          const val = bson.Timestamp.fromInt(10);
          const object = { field: val };

          it('returns the extended json with line break', (done) => {
            transform._transform(object, null, (error, data) => {
              expect(error).to.equal(null);
              expect(data).to.equal('10\n');
              done();
            });
          });
        });

        context('when the document has an undefined', () => {
          const object = { field: undefined };

          it('returns the extended json with line break', (done) => {
            transform._transform(object, null, (error, data) => {
              expect(error).to.equal(null);
              expect(data).to.equal('\n');
              done();
            });
          });
        });

        context('when the objects are in order', () => {

        });

        context('when the objects are not in order', () => {

        });
      });
    });
  });
});
