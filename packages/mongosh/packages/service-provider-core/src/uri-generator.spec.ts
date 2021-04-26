import { CommonErrors, MongoshInvalidInputError } from '@mongosh/errors';
import { expect } from 'chai';
import generateUri from './uri-generator';

describe('uri-generator.generate-uri', () => {
  context('when no arguments are provided', () => {
    const options = { _: [] };

    it('returns the default uri', () => {
      expect(generateUri(options)).to.equal('mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000');
    });
  });

  context('when no URI is provided', () => {
    it('handles host', () => {
      expect(generateUri({ _: [], host: 'localhost' })).to.equal('mongodb://localhost:27017/?directConnection=true&serverSelectionTimeoutMS=2000');
    });
    it('handles port', () => {
      expect(generateUri({ _: [], port: '27018' })).to.equal('mongodb://127.0.0.1:27018/?directConnection=true&serverSelectionTimeoutMS=2000');
    });
    it('handles both host and port', () => {
      expect(generateUri({ _: [], host: 'localhost', port: '27018' })).to.equal('mongodb://localhost:27018/?directConnection=true&serverSelectionTimeoutMS=2000');
    });
    it('handles host with port included', () => {
      expect(generateUri({ _: [], host: 'localhost:27018' })).to.equal('mongodb://localhost:27018/?directConnection=true&serverSelectionTimeoutMS=2000');
    });
    it('throws if host has port AND port set to other value', () => {
      try {
        generateUri({ _: [], host: 'localhost:27018', port: '27019' });
        expect.fail('expected error');
      } catch (e) {
        expect(e).to.be.instanceOf(MongoshInvalidInputError);
        expect(e.code).to.equal(CommonErrors.InvalidArgument);
      }
    });
    it('handles host has port AND port set to equal value', () => {
      expect(generateUri({ _: [], host: 'localhost:27018', port: '27018' })).to.equal('mongodb://localhost:27018/?directConnection=true&serverSelectionTimeoutMS=2000');
    });
  });

  context('when a full URI is provided', () => {
    context('when no additional options are provided', () => {
      const options = { _: ['mongodb://192.0.0.1:27018/foo'] };

      it('returns the uri', () => {
        expect(generateUri(options)).to.equal('mongodb://192.0.0.1:27018/foo?directConnection=true');
      });
    });

    context('when additional options are provided', () => {
      context('when providing host with URI', () => {
        const uri = 'mongodb://192.0.0.1:27018/foo';
        const options = { _: [uri], host: '127.0.0.1' };

        it('throws an exception', () => {
          try {
            generateUri(options);
            expect.fail('expected error');
          } catch (e) {
            expect(e).to.be.instanceOf(MongoshInvalidInputError);
            expect(e.code).to.equal(CommonErrors.InvalidArgument);
          }
        });
      });

      context('when providing port with URI', () => {
        const uri = 'mongodb://192.0.0.1:27018/foo';
        const options = { _: [uri], port: '27018' };

        it('throws an exception', () => {
          try {
            generateUri(options);
            expect.fail('expected error');
          } catch (e) {
            expect(e.name).to.equal('MongoshInvalidInputError');
            expect(e.code).to.equal(CommonErrors.InvalidArgument);
          }
        });
      });
    });

    context('when providing a URI with query parameters', () => {
      context('that do not conflict with directConnection', () => {
        const uri = 'mongodb://192.0.0.1:27018?readPreference=primary';
        const options = { _: [uri] };
        it('still includes directConnection', () => {
          expect(generateUri(options)).to.equal('mongodb://192.0.0.1:27018/?readPreference=primary&directConnection=true');
        });
      });

      context('including replicaSet', () => {
        const uri = 'mongodb://192.0.0.1:27018/db?replicaSet=replicaset';
        const options = { _: [uri] };
        it('does not add the directConnection parameter', () => {
          expect(generateUri(options)).to.equal(uri);
        });
      });

      context('including explicit directConnection', () => {
        const uri = 'mongodb://192.0.0.1:27018/db?directConnection=false';
        const options = { _: [uri] };
        it('does not change the directConnection parameter', () => {
          expect(generateUri(options)).to.equal(uri);
        });
      });
    });

    context('when providing a URI with SRV record', () => {
      const uri = 'mongodb+srv://somehost/?readPreference=primary';
      const options = { _: [uri] };
      it('no directConnection is added', () => {
        expect(generateUri(options)).to.equal(uri);
      });
    });

    context('when providing a URI with multiple seeds', () => {
      const uri = 'mongodb://192.42.42.42:27017,192.0.0.1:27018/db?readPreference=primary';
      const options = { _: [uri] };
      it('no directConnection is added', () => {
        expect(generateUri(options)).to.equal(uri);
      });
    });
  });

  context('when a URI is provided without a scheme', () => {
    context('when providing host', () => {
      const uri = '192.0.0.1';
      const options = { _: [uri] };

      it('returns the uri with the scheme', () => {
        expect(generateUri(options)).to.equal(`mongodb://${uri}:27017/test?directConnection=true`);
      });
    });

    context('when providing host:port', () => {
      const uri = '192.0.0.1:27018';
      const options = { _: [uri] };

      it('returns the uri with the scheme', () => {
        expect(generateUri(options)).to.equal(`mongodb://${uri}/test?directConnection=true`);
      });
    });

    context('when proving host + port option', () => {
      const uri = '192.0.0.1';
      const options = { _: [uri], port: '27018' };

      it('throws an exception', () => {
        try {
          generateUri(options);
          expect.fail('expected error');
        } catch (e) {
          expect(e).to.be.instanceOf(MongoshInvalidInputError);
          expect(e.code).to.equal(CommonErrors.InvalidArgument);
        }
      });
    });

    context('when no additional options are provided without db', () => {
      const uri = '192.0.0.1:27018';
      const options = { _: [uri] };

      it('returns the uri with the scheme', () => {
        expect(generateUri(options)).to.equal(`mongodb://${uri}/test?directConnection=true`);
      });
    });

    context('when no additional options are provided with empty db', () => {
      const uri = '192.0.0.1:27018/';
      const options = { _: [uri] };

      it('returns the uri with the scheme', () => {
        expect(generateUri(options)).to.equal(`mongodb://${uri}test?directConnection=true`);
      });
    });

    context('when no additional options are provided with db', () => {
      const uri = '192.0.0.1:27018/foo';
      const options = { _: [uri] };

      it('returns the uri with the scheme', () => {
        expect(generateUri(options)).to.equal(`mongodb://${uri}?directConnection=true`);
      });
    });

    context('when additional options are provided', () => {
      context('when providing host with URI', () => {
        const uri = '192.0.0.1:27018/foo';
        const options = { _: [uri], host: '127.0.0.1' };

        it('throws an exception', () => {
          try {
            generateUri(options);
            expect.fail('expected error');
          } catch (e) {
            expect(e).to.be.instanceOf(MongoshInvalidInputError);
            expect(e.code).to.equal(CommonErrors.InvalidArgument);
          }
        });
      });

      context('when providing host with db', () => {
        const uri = 'foo';
        const options = { _: [uri], host: '127.0.0.2' };

        it('uses the provided host with default port', () => {
          expect(generateUri(options)).to.equal('mongodb://127.0.0.2:27017/foo?directConnection=true');
        });
      });

      context('when providing port with URI', () => {
        const uri = '192.0.0.1:27018/foo';
        const options = { _: [uri], port: '27018' };

        it('throws an exception', () => {
          try {
            generateUri(options);
            expect.fail('expected error');
          } catch (e) {
            expect(e).to.be.instanceOf(MongoshInvalidInputError);
            expect(e.code).to.equal(CommonErrors.InvalidArgument);
          }
        });
      });

      context('when providing port with db', () => {
        const uri = 'foo';
        const options = { _: [uri], port: '27018' };

        it('uses the provided host with default port', () => {
          expect(generateUri(options)).to.equal('mongodb://127.0.0.1:27018/foo?directConnection=true&serverSelectionTimeoutMS=2000');
        });
      });

      context('when providing port with only a host URI', () => {
        const uri = '127.0.0.2/foo';
        const options = { _: [uri], port: '27018' };

        it('throws an exception', () => {
          try {
            generateUri(options);
            expect.fail('expected error');
          } catch (e) {
            expect(e).to.be.instanceOf(MongoshInvalidInputError);
            expect(e.code).to.equal(CommonErrors.InvalidArgument);
          }
        });
      });

      context('when providing nodb', () => {
        const uri = 'mongodb://127.0.0.2/foo';
        const options = { _: [uri], nodb: true };

        it('returns an empty string', () => {
          expect(generateUri(options)).to.equal('');
        });
      });

      context('when providing explicit serverSelectionTimeoutMS', () => {
        const uri = 'mongodb://127.0.0.2/foo?serverSelectionTimeoutMS=10';
        const options = { _: [uri] };

        it('does not override the existing value', () => {
          expect(generateUri(options)).to.equal('mongodb://127.0.0.2/foo?serverSelectionTimeoutMS=10&directConnection=true');
        });
      });

      context('when providing explicit serverSelectionTimeoutMS (different case)', () => {
        const uri = 'mongodb://127.0.0.2/foo?SERVERSELECTIONTIMEOUTMS=10';
        const options = { _: [uri] };

        it('does not override the existing value', () => {
          expect(generateUri(options)).to.equal('mongodb://127.0.0.2/foo?SERVERSELECTIONTIMEOUTMS=10&directConnection=true');
        });
      });
    });

    context('when providing a URI with query parameters', () => {
      context('that do not conflict with directConnection', () => {
        const uri = '192.0.0.1:27018?readPreference=primary';
        const options = { _: [uri] };
        it('still includes directConnection', () => {
          expect(generateUri(options)).to.equal('mongodb://192.0.0.1:27018/?readPreference=primary&directConnection=true');
        });
      });

      context('including replicaSet', () => {
        const uri = '192.0.0.1:27018/db?replicaSet=replicaset';
        const options = { _: [uri] };
        it('does not add the directConnection parameter', () => {
          expect(generateUri(options)).to.equal(`mongodb://${uri}`);
        });
      });

      context('including explicit directConnection', () => {
        const uri = '192.0.0.1:27018?directConnection=false';
        const options = { _: [uri] };
        it('does not change the directConnection parameter', () => {
          expect(generateUri(options)).to.equal('mongodb://192.0.0.1:27018/?directConnection=false');
        });
      });
    });
  });


  context('when an invalid URI is provided', () => {
    const uri = '/x';
    const options = { _: [uri] };

    it('returns the uri', () => {
      try {
        generateUri(options);
      } catch (e) {
        expect(e.message).to.contain('Invalid URI: /x');
        expect(e).to.be.instanceOf(MongoshInvalidInputError);
        expect(e.code).to.equal(CommonErrors.InvalidArgument);
        return;
      }
      expect.fail('expected error');
    });
  });

  context('when the --host option contains invalid characters', () => {
    const options = { host: 'a,b,c' };

    it('returns the uri', () => {
      try {
        generateUri(options);
      } catch (e) {
        expect(e.message).to.contain('The --host argument contains an invalid character: ,');
        expect(e).to.be.instanceOf(MongoshInvalidInputError);
        expect(e.code).to.equal(CommonErrors.InvalidArgument);
        return;
      }
      expect.fail('expected error');
    });
  });
});
