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
const TypeChecker = require('../lib/type-checker');

describe('TypeChecker', function() {
  describe('#cast', function() {

  });

  describe('#type', function() {
    context('when the object is a string', function() {
      it('returns String', function() {
        expect(TypeChecker.type('testing')).to.equal('String');
      })
    });

    context('when the object is a double', function() {
      it('returns Number', function() {
        expect(TypeChecker.type(2.45)).to.equal('Number');
      })
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
      })
    });

    context('when the object is an object id', function() {
      var objectId = new ObjectId();

      it('returns ObjectId', function() {
        expect(TypeChecker.type(objectId)).to.equal('ObjectID');
      })
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
      it('returns Number', function() {
        expect(TypeChecker.type(1234234)).to.equal('Number');
      })
    });

    context('when the object is a timestamp', function() {
      var timestamp = new Timestamp(0, 100);

      it('returns Timestamp', function() {
        expect(TypeChecker.type(timestamp)).to.equal('Timestamp');
      });
    });

    context('when the object is a 64 bit int', function() {
      it('returns Number', function() {
        expect(TypeChecker.type(Number.MAX_SAFE_INTEGER)).to.equal('Number');
      })
    });

    context('when the object is a min key', function() {
      var minKey = new MinKey();

      it('returns ObjectId', function() {
        expect(TypeChecker.type(minKey)).to.equal('MinKey');
      })
    });

    context('when the object is a max key', function() {
      var maxKey = new MaxKey();

      it('returns ObjectId', function() {
        expect(TypeChecker.type(maxKey)).to.equal('MaxKey');
      })
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
    context('when the object is a string', function() {
      context('when the string is empty', function() {
        var value = '';

        it('returns the list', function() {
          expect(TypeChecker.castableTypes(value)).to.deep.equal([
            'String',
            'MinKey',
            'MaxKey'
          ]);
        });
      });

      context('when the string is not empty', function() {
        context('when the string is numeric', function() {
          context('when the string is an integer', function() {
            var value = '24';

            it('returns the list', function() {
              expect(TypeChecker.castableTypes(value)).to.deep.equal([
                'String',
                'Number'
              ]);
            });
          });

          context('when the string is a floating point', function() {
            var value = '24.7';

            it('returns the list', function() {
              expect(TypeChecker.castableTypes(value)).to.deep.equal([
                'String',
                'Number'
              ]);
            });
          });
        });

        context('when the string is undefined', function() {
          var value = 'undefined';

          it('returns the list', function() {
            expect(TypeChecker.castableTypes(value)).to.deep.equal([
              'String',
              'Undefined'
            ]);
          });
        });

        context('when the string is null', function() {
          var value = 'null';

          it('returns the list', function() {
            expect(TypeChecker.castableTypes(value)).to.deep.equal([
              'String',
              'Null'
            ]);
          });
        });

        context('when the string is in date format', function() {
          var value = '2016-10-10';

          it('returns the list', function() {
            expect(TypeChecker.castableTypes(value)).to.deep.equal([
              'String'
            ]);
          });
        });

        context('when the string is a boolean format', function() {
          context('when true', function() {
            var value = 'true';

            it('returns the list', function() {
              expect(TypeChecker.castableTypes(value)).to.deep.equal([
                'String',
                'Boolean'
              ]);
            });
          });

          context('when false', function() {
            var value = 'false';

            it('returns the list', function() {
              expect(TypeChecker.castableTypes(value)).to.deep.equal([
                'String',
                'Boolean'
              ]);
            });
          });
        });

        context('when the string is non-deterministic', function() {
          var value = 'testing';

          it('returns the list', function() {
            expect(TypeChecker.castableTypes(value)).to.deep.equal([
              'String'
            ]);
          });
        });
      });
    });

    context('when the object is a double', function() {
      var value = 23.113;

      it('returns the list', function() {
        expect(TypeChecker.castableTypes(value)).to.deep.equal([
          'Number',
          'String'
        ]);
      });
    });

    context('when the object is an undefined', function() {
      var value = undefined;

      it('returns the list', function() {
        expect(TypeChecker.castableTypes(value)).to.deep.equal([
          'Undefined',
          'String'
        ]);
      });
    });

    context('when the object is a boolean false', function() {
      var value = false;

      it('returns the list', function() {
        expect(TypeChecker.castableTypes(value)).to.deep.equal([
          'Boolean',
          'String'
        ]);
      });
    });

    context('when the object is a boolean true', function() {
      var value = true;

      it('returns the list', function() {
        expect(TypeChecker.castableTypes(value)).to.deep.equal([
          'Boolean',
          'String'
        ]);
      });
    });

    context('when the object is a utc date time', function() {
      var value = new Date();

      it('returns the list', function() {
        expect(TypeChecker.castableTypes(value)).to.deep.equal([
          'Date',
          'String'
        ]);
      });
    });

    context('when the object is a null', function() {
      var value = null;

      it('returns the list', function() {
        expect(TypeChecker.castableTypes(value)).to.deep.equal([
          'Null',
          'String'
        ]);
      });
    });

    context('when the object is a regex', function() {
      var value = new BSONRegExp(/test/, []);

      it('returns the list', function() {
        expect(TypeChecker.castableTypes(value)).to.deep.equal([
          'BSONRegExp',
          'String'
        ]);
      });
    });

    context('when the object is a code with scope', function() {
      var value = new Code('where something');

      it('returns the list', function() {
        expect(TypeChecker.castableTypes(value)).to.deep.equal([
          'Code',
          'String'
        ]);
      });
    });

    context('when the object is a integer', function() {
      var value = 123;

      it('returns the list', function() {
        expect(TypeChecker.castableTypes(value)).to.deep.equal([
          'Number',
          'String'
        ]);
      });
    });

    context('when the object is a timestamp', function() {
      var value = new Timestamp(0, 10);

      it('returns the list', function() {
        expect(TypeChecker.castableTypes(value)).to.deep.equal([
          'Timestamp',
          'String'
        ]);
      });
    });

    context('when the object is a min key', function() {
      var value = new MinKey();

      it('returns the list', function() {
        expect(TypeChecker.castableTypes(value)).to.deep.equal([
          'MinKey',
          'String'
        ]);
      });
    });

    context('when the object is a max key', function() {
      var value = new MaxKey();

      it('returns the list', function() {
        expect(TypeChecker.castableTypes(value)).to.deep.equal([
          'MaxKey',
          'String'
        ]);
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
});
