'use strict';

const expect = require('chai').expect;
const bson = require('bson');
const ObjectId = bson.ObjectId;
const MinKey = bson.MinKey;
const MaxKey = bson.MaxKey;
const Binary = bson.Binary;
const BSONRegExp = bson.BSONRegExp;
const Code = bson.Code;
const Timestamp = bson.Timestamp;
const Long = bson.Long;
const Double = bson.Double;
const Int32 = bson.Int32;
const Decimal128 = bson.Decimal128;
const TypeChecker = require('../lib/type-checker');

describe('TypeChecker', function() {
  describe('#cast', function() {
    context('when the object is a string', function() {
      context('when the string is empty', function() {
        context('when casting to min key', function() {
          var value = '';

          it('returns the min key', function() {
            expect(TypeChecker.cast(value, 'MinKey')).to.deep.equal(new MinKey());
          });
        });

        context('when casting to max key', function() {
          var value = '';

          it('returns the max key', function() {
            expect(TypeChecker.cast(value, 'MaxKey')).to.deep.equal(new MaxKey());
          });
        });

        context('when casting to ObjectId', function() {
          var value = '';

          it('returns a new ObjectId()', function() {
            expect(TypeChecker.cast(value, 'ObjectId')).to.be.an.instanceof(bson.ObjectId);
          });
        });
      });

      context('when the string is an integer', function() {
        context('when the integer is 32 bits', function() {
          context('when casting to an int32', function() {
            var value = '23';

            it('returns the number', function() {
              expect(TypeChecker.cast(value, 'Int32')).to.deep.equal(new Int32(23));
            });
          });

          context('when casting to a boolean', function() {
            context('when the int is 0', function() {
              it('returns false', function() {
                expect(TypeChecker.cast(0, 'Boolean')).to.equal(false);
              });
            });

            context('when the int is 1', function() {
              it('returns true', function() {
                expect(TypeChecker.cast(1, 'Boolean')).to.equal(true);
              });
            });

            context('when the int is > 1', function() {
              it('returns true', function() {
                expect(TypeChecker.cast(2, 'Boolean')).to.equal(true);
              });
            });

            context('when the int is < 0', function() {
              it('returns true', function() {
                expect(TypeChecker.cast(-2, 'Boolean')).to.equal(true);
              });
            });
          });

          context('when the int is partially valid', function() {
            context('when the int is a -', function() {
              var value = '-';

              it('raises an error', function() {
                expect(function() {
                  TypeChecker.cast(value, 'Int32');
                }).to.throw('is not a valid Int32 value');
              });
            });

            context('when the int is a ""', function() {
              var value = '';

              it('raises an error', function() {
                expect(function() {
                  TypeChecker.cast(value, 'Int32');
                }).to.throw('is not a valid Int32 value');
              });
            });
          });

          context('when the int64 is partially valid', function() {
            context('when the int is a -', function() {
              var value = '-';

              it('raises an error', function() {
                expect(function() {
                  TypeChecker.cast(value, 'Int64');
                }).to.throw('is not a valid Int64 value');
              });
            });

            context('when the int is a ""', function() {
              var value = '';

              it('raises an error', function() {
                expect(function() {
                  TypeChecker.cast(value, 'Int64');
                }).to.throw('is not a valid Int64 value');
              });
            });
          });
        });

        context('when the integer is 64 bit', function() {
          context('when casting to an int64', function() {
            var value = '42000000000000';

            it('returns the int64', function() {
              expect(TypeChecker.cast(value, 'Int64')).to.deep.equal(Long.fromNumber(42000000000000));
            });
          });
        });

        context('when casting to a decimal 128', function() {
          var value = '9223372036854775808';
          it('returns the number', function() {
            expect(TypeChecker.cast(value, 'Decimal128').toString()).to.equal(value);
          });
        });
      });

      context('when the string is a double', function() {
        context('when casting to a double', function() {
          context('when the double is valid', function() {
            var value = '23.45';

            it('returns the number', function() {
              expect(TypeChecker.cast(value, 'Double')).to.deep.equal(new Double(23.45));
            });
          });

          context('when the doule is partially valid', function() {
            context('when the double is a -', function() {
              var value = '-';

              it('raises an error', function() {
                expect(function() {
                  TypeChecker.cast(value, 'Double');
                }).to.throw('is not a valid Double value');
              });
            });

            context('when the double is a ""', function() {
              var value = '';

              it('raises an error', function() {
                expect(function() {
                  TypeChecker.cast(value, 'Double');
                }).to.throw('is not a valid Double value');
              });
            });
          });
        });
      });

      context('when the string is a decimal 128', function() {
        context('when casting to a decimal 128', function() {
          var value = '23.45';

          it('returns the number', function() {
            expect(TypeChecker.cast(value, 'Decimal128').toString()).to.equal('23.45');
          });
        });
      });

      context('when the string is a plain string', function() {
        context('when casting to a string', function() {
          var value = 'test';

          it('returns the string', function() {
            expect(TypeChecker.cast(value, 'String')).to.equal(value);
          });
        });

        context('when casting to a boolean', function() {
          var value = 'fal';

          it('raises an exception', function() {
            expect(TypeChecker.cast.bind(null, value, 'Boolean')).to.throw('not a valid boolean');
          });
        });

        context('when casting to an object', function() {
          var value = 'test';

          it('returns an empty object', function() {
            expect(TypeChecker.cast(value, 'Object')).to.deep.equal({});
          });
        });

        context('when casting to an array', function() {
          context('when the value is a string', function() {
            var value = 'test';

            it('returns the string wrapped in an array', function() {
              expect(TypeChecker.cast(value, 'Array')).to.deep.equal([ value ]);
            });
          });

          context('when the value is an object', function() {
            it('returns an empty array', function() {
              expect(TypeChecker.cast({}, 'Array')).to.deep.equal([]);
            });
          });
        });

        context('when casting to a date', function() {
          var value = '2016-10-10';
          var date = new Date(value);

          it('returns the date', function() {
            expect(TypeChecker.cast(value, 'Date')).to.deep.equal(date);
          });
        });
      });

      context('when the string is a 12-byte hex string', function() {
        context('when casting to an ObjectId', function() {
          var value = '58cbf2318ecfb65b8cee6556';
          var oid = new ObjectId(value);

          it('returns a new ObjectId', function() {
            expect(TypeChecker.cast(value, 'ObjectId')).to.deep.equal(oid);
          });
        });

        context('when casting to a string', function() {
          var value = '58cbf2318ecfb65b8cee6556';

          it('returns a string', function() {
            expect(TypeChecker.cast(value, 'String')).to.deep.equal(value);
          });
        });
      });
    });

    context('when the object is a primitive double', function() {
      context('when casting to a string', function() {
        it('returns the number as a string', function() {
          expect(TypeChecker.cast(2.45, 'String')).to.equal('2.45');
        });
      });

      context('when casting to an object id', function() {
        it('returns a new ObjectId()', function() {
          expect(TypeChecker.cast(2.45, 'ObjectId')).to.be.an.instanceof(bson.ObjectId);
        });
      });
    });

    context('when the object is a double', function() {
      context('when casting to a string', function() {
        it('returns the number as a string', function() {
          expect(TypeChecker.cast(new Double(2.45), 'String')).to.equal('2.45');
        });
      });

      context('when casting to decimal-128', function() {
        it('returns the number as decimal-128', function() {
          expect(TypeChecker.cast(new Double(2.45), 'Decimal128').toString()).to.equal('2.45');
        });
      });
    });

    context('when the object is a long', function() {
      context('when casting to a string', function() {
        it('returns the number as a string', function() {
          expect(TypeChecker.cast(new Long(245), 'String')).to.equal('245');
        });
      });

      context('when casting to an int32', function() {
        it('returns the number as an int32', function() {
          expect(TypeChecker.cast(new Long(245), 'Int32')).to.deep.equal(new Int32(245));
        });
      });

      context('when casting to a double', function() {
        it('returns the number as a double', function() {
          expect(TypeChecker.cast(new Long(245), 'Double')).to.deep.equal(new Double(245));
        });
      });

      context('when casting to decimal-128', function() {
        it('returns the number as decimal-128', function() {
          expect(TypeChecker.cast(new Long(245), 'Decimal128').toString()).to.equal('245');
        });
      });
    });

    context('when the object is an int32', function() {
      context('when casting to a string', function() {
        it('returns the number as a string', function() {
          expect(TypeChecker.cast(new Int32(245), 'String')).to.equal('245');
        });
      });

      context('when casting to an int64', function() {
        it('returns the number as an int64', function() {
          expect(TypeChecker.cast(new Int32(245), 'Int64')).to.deep.equal(new Long(245));
        });
      });

      context('when casting to a double', function() {
        it('returns the number as a double', function() {
          expect(TypeChecker.cast(new Int32(245), 'Double')).to.deep.equal(new Double(245));
        });
      });

      context('when casting to decimal-128', function() {
        it('returns the number as decimal-128', function() {
          expect(TypeChecker.cast(new Int32(245), 'Decimal128').toString()).to.equal('245');
        });
      });
    });

    context('when the object is an int32 literal', function() {
      context('when casting to a string', function() {
        it('returns the number as a string', function() {
          expect(TypeChecker.cast(245, 'String')).to.equal('245');
        });
      });

      context('when casting to an int64', function() {
        it('returns the number as an int64', function() {
          expect(TypeChecker.cast(245, 'Int64')).to.deep.equal(new Long(245));
        });
      });

      context('when casting to a double', function() {
        it('returns the number as a double', function() {
          expect(TypeChecker.cast(245, 'Double')).to.deep.equal(new Double(245));
        });
      });
    });

    context('when the object is a binary', function() {
      context('when casting to a string', function() {
        var binary = new Binary('test', 0);

        it('returns the binary as a string', function() {
          expect(TypeChecker.cast(binary, 'String')).to.equal('test');
        });
      });
    });

    context('when the object is an undefined', function() {
      context('when casting to a string', function() {
        it('returns an empty string', function() {
          expect(TypeChecker.cast(undefined, 'String')).to.equal('');
        });
      });
    });

    context('when the object is an object id', function() {
      context('when casting to a string', function() {
        var objectId = new ObjectId();

        it('returns the string id', function() {
          expect(TypeChecker.cast(objectId, 'String').length).to.equal(24);
        });
      });
    });

    context('when the object is a boolean false', function() {
      context('when casting to a string', function() {
        it('returns the string false', function() {
          expect(TypeChecker.cast(false, 'String')).to.equal('false');
        });
      });
    });

    context('when the object is a boolean true', function() {
      context('when casting to a string', function() {
        it('returns the string true', function() {
          expect(TypeChecker.cast(true, 'String')).to.equal('true');
        });
      });
    });

    context('when the object is a utc date time', function() {
      context('when casting to a string', function() {
        var date = new Date(2016, 1, 1);

        it('returns the date as a string', function() {
          expect(TypeChecker.cast(date, 'String')).to.not.equal('');
        });
      });
    });

    context('when the object is a null', function() {
      context('when casting to a string', function() {
        it('returns an empty string', function() {
          expect(TypeChecker.cast(null, 'String')).to.equal('');
        });
      });
    });

    context('when the object is a regex', function() {
      context('when casting to a string', function() {
        var regex = new BSONRegExp('+w', ['i']);

        it('returns the string regex', function() {
          expect(TypeChecker.cast(regex, 'String')).to.equal('');
        });
      });
    });

    context('when the object is a min key', function() {
      context('when casting to a string', function() {
        var minKey = new MinKey();

        it('returns an empty string', function() {
          expect(TypeChecker.cast(minKey, 'String')).to.equal('');
        });
      });
    });

    context('when the object is a max key', function() {
      context('when casting to a string', function() {
        var maxKey = new MaxKey();

        it('returns an empty string', function() {
          expect(TypeChecker.cast(maxKey, 'String')).to.equal('');
        });
      });
    });

    context('when the object is an object', function() {
      context('when casting to a string', function() {
        it('returns an empty string', function() {
          expect(TypeChecker.cast({}, 'String')).to.equal('');
        });
      });

      context('when casting to an array', function() {
        it('returns an empty array', function() {
          expect(TypeChecker.cast({ test: 'value' }, 'Array')).to.deep.equal([]);
        });
      });

      context('when casting to a binary', function() {
        it('returns an empty binary', function() {
          expect(TypeChecker.cast({ test: 'value' }, 'Binary')._bsontype).to.equal('Binary');
        });
      });

      context('when casting to a boolean', function() {
        it('returns true', function() {
          expect(TypeChecker.cast({ test: 'value' }, 'Boolean')).to.equal(true);
        });
      });

      context('when casting to a code', function() {
        it('returns an empty code', function() {
          expect(TypeChecker.cast({ test: 'value' }, 'Code').code).to.equal('[object Object]');
        });
      });

      context('when casting to a date', function() {
        it('returns the invalid date', function() {
          expect(TypeChecker.cast({ test: 'value' }, 'Date').toString()).to.equal('Invalid Date');
        });
      });
    });

    context('when the object is an Array', function() {
      context('when casting to a string', function() {
        var value = [ 'test', 'test2' ];
        it('returns Array', function() {
          expect(TypeChecker.cast(value, 'String')).to.deep.equal('test,test2');
        });
      });
    });
  });

  describe('#type', function() {
    context('when the object is a string', function() {
      it('returns String', function() {
        expect(TypeChecker.type('testing')).to.equal('String');
      });
    });

    context('when the object is a double', function() {
      it('returns Double', function() {
        expect(TypeChecker.type(new Double(2.45))).to.equal('Double');
      });
    });

    context('when the object is a decimal 128', function() {
      it('returns Decimal128', function() {
        expect(TypeChecker.type(Decimal128.fromString('2.45'))).to.equal('Decimal128');
      });
    });

    context('when the object is a binary', function() {
      var binary = new Binary('test', 0);

      it('returns Binary', function() {
        expect(TypeChecker.type(binary)).to.equal('Binary');
      });
    });

    context('when the object is an undefined', function() {
      it('returns Undefined', function() {
        expect(TypeChecker.type(undefined)).to.equal('Undefined');
      });
    });

    context('when the object is an object id', function() {
      var objectId = new ObjectId();

      it('returns ObjectId', function() {
        expect(TypeChecker.type(objectId)).to.equal('ObjectId');
      });
    });

    context('when the object is a boolean false', function() {
      it('returns boolean', function() {
        expect(TypeChecker.type(false)).to.equal('Boolean');
      });
    });

    context('when the object is a boolean true', function() {
      it('returns boolean', function() {
        expect(TypeChecker.type(true)).to.equal('Boolean');
      });
    });

    context('when the object is a utc date time', function() {
      var date = new Date();

      it('returns Date', function() {
        expect(TypeChecker.type(date)).to.equal('Date');
      });
    });

    context('when the object is a null', function() {
      it('returns Null', function() {
        expect(TypeChecker.type(null)).to.equal('Null');
      });
    });

    context('when the object is a regex', function() {
      var regex = new BSONRegExp('+w', ['i']);

      it('returns BSONRegExp', function() {
        expect(TypeChecker.type(regex)).to.equal('BSONRegExp');
      });
    });

    context('when the object is an object', function() {
      it('returns Object', function() {
        expect(TypeChecker.type({})).to.equal('Object');
      });
    });

    context('when the object is an Array', function() {
      it('returns Array', function() {
        expect(TypeChecker.type([ 'test' ])).to.equal('Array');
      });
    });

    context('when the object is a code', function() {
      var code = new Code('where blah');

      it('returns Code', function() {
        expect(TypeChecker.type(code)).to.equal('Code');
      });
    });

    context('when the object is a code with scope', function() {
      var code = new Code('where blah', {});

      it('returns Code', function() {
        expect(TypeChecker.type(code)).to.equal('Code');
      });
    });

    context('when the object is a 32bit int', function() {
      it('returns Int32', function() {
        expect(TypeChecker.type(new Int32(1234234))).to.equal('Int32');
      });
    });

    context('when the object is a timestamp', function() {
      var timestamp = new Timestamp(0, 100);

      it('returns Timestamp', function() {
        expect(TypeChecker.type(timestamp)).to.equal('Timestamp');
      });
    });

    context('when the object is a bson long', function() {
      it('returns Int64', function() {
        expect(TypeChecker.type(new Long(Number.MAX_SAFE_INTEGER))).to.equal('Int64');
      });
    });

    context('when the object is a bson double', function() {
      it('returns Double', function() {
        expect(TypeChecker.type(new Double(43.13123123))).to.equal('Double');
      });
    });

    context('when the object is a min key', function() {
      var minKey = new MinKey();

      it('returns ObjectId', function() {
        expect(TypeChecker.type(minKey)).to.equal('MinKey');
      });
    });

    context('when the object is a max key', function() {
      var maxKey = new MaxKey();

      it('returns ObjectId', function() {
        expect(TypeChecker.type(maxKey)).to.equal('MaxKey');
      });
    });

    context('when the object is an object', function() {
      it('returns Object', function() {
        expect(TypeChecker.type({})).to.equal('Object');
      });
    });

    context('when the object is an Array', function() {
      it('returns Array', function() {
        expect(TypeChecker.type([ 'test' ])).to.equal('Array');
      });
    });
  });

  describe('#castableTypes', function() {
    context('when using high precision support', function() {
      it('includes decimal 128', function() {
        expect(TypeChecker.castableTypes(true)).to.deep.equal([
          'Array',
          'Binary',
          'Boolean',
          'Code',
          'Date',
          'Decimal128',
          'Double',
          'Int32',
          'Int64',
          'MaxKey',
          'MinKey',
          'Null',
          'Object',
          'ObjectId',
          'BSONRegexp',
          'String',
          'Symbol',
          'Timestamp',
          'Undefined'
        ]);
      });
    });

    context('when not using high precision support', function() {
      it('does not include decimal 128', function() {
        expect(TypeChecker.castableTypes()).to.deep.equal([
          'Array',
          'Binary',
          'Boolean',
          'Code',
          'Date',
          'Double',
          'Int32',
          'Int64',
          'MaxKey',
          'MinKey',
          'Null',
          'Object',
          'ObjectId',
          'BSONRegexp',
          'String',
          'Symbol',
          'Timestamp',
          'Undefined'
        ]);
      });
    });
  });
});
