import { expect } from 'chai';
import ConnectionStringUrl from 'mongodb-connection-string-url';

import { handleUpdateTls, handleUpdateTlsOption } from './tls-handler';

describe('tls-option-handler', function () {
  describe('#handleUpdateTls', function () {
    describe('when it is called to update to `ON`', function () {
      it('should update tls to `true` when `ON` is passed', function () {
        const connectionStringUrl = new ConnectionStringUrl(
          'mongodb://a:b@outerspace:123/?directConnection=true&ssl=false'
        );

        const res = handleUpdateTls({
          action: {
            tlsOption: 'ON',
            type: 'update-tls',
          },
          connectionStringUrl,
          connectionOptions: {
            connectionString: connectionStringUrl.toString(),
          },
        });
        expect(res.connectionOptions.connectionString).to.equal(
          'mongodb://a:b@outerspace:123/?directConnection=true&tls=true'
        );
        expect(
          new ConnectionStringUrl(
            res.connectionOptions.connectionString
          ).searchParams.get('tls')
        ).to.equal('true');
      });

      it('should update the connection string', function () {
        const connectionStringUrl = new ConnectionStringUrl(
          'mongodb://a:b@outerspace:123/?directConnection=true&ssl=false'
        );

        const res = handleUpdateTls({
          action: {
            tlsOption: 'ON',
            type: 'update-tls',
          },
          connectionStringUrl,
          connectionOptions: {
            connectionString: connectionStringUrl.toString(),
          },
        });
        expect(res.connectionOptions.connectionString).to.equal(
          'mongodb://a:b@outerspace:123/?directConnection=true&tls=true'
        );
      });

      it('should unset the `ssl` option', function () {
        const connectionStringUrl = new ConnectionStringUrl(
          'mongodb://a:b@outerspace:123/?directConnection=true&ssl=false'
        );

        const res = handleUpdateTls({
          action: {
            tlsOption: 'ON',
            type: 'update-tls',
          },
          connectionStringUrl,
          connectionOptions: {
            connectionString: connectionStringUrl.toString(),
          },
        });
        expect(
          new ConnectionStringUrl(
            res.connectionOptions.connectionString
          ).searchParams.get('ssl')
        ).to.equal(null);
      });
    });

    describe('when it is called to update to `OFF`', function () {
      it('should update tls to `false` when `OFF` is passed', function () {
        const connectionStringUrl = new ConnectionStringUrl(
          'mongodb://a:b@outerspace:123/?directConnection=true&ssl=false'
        );

        const res = handleUpdateTls({
          action: {
            tlsOption: 'OFF',
            type: 'update-tls',
          },
          connectionStringUrl,
          connectionOptions: {
            connectionString: connectionStringUrl.toString(),
          },
        });
        expect(res.connectionOptions.connectionString).to.equal(
          'mongodb://a:b@outerspace:123/?directConnection=true&tls=false'
        );
        expect(
          new ConnectionStringUrl(
            res.connectionOptions.connectionString
          ).searchParams.get('tls')
        ).to.equal('false');
      });

      it('should update the connection string', function () {
        const connectionStringUrl = new ConnectionStringUrl(
          'mongodb://a:b@outerspace:123/?directConnection=true&tls=true'
        );

        const res = handleUpdateTls({
          action: {
            tlsOption: 'OFF',
            type: 'update-tls',
          },
          connectionStringUrl,
          connectionOptions: {
            connectionString: connectionStringUrl.toString(),
          },
        });
        expect(res.connectionOptions.connectionString).to.equal(
          'mongodb://a:b@outerspace:123/?directConnection=true&tls=false'
        );
      });

      it('should unset the `ssl` option when ssl=true', function () {
        const connectionStringUrl = new ConnectionStringUrl(
          'mongodb://a:b@outerspace:123/?directConnection=true&ssl=true'
        );

        const res = handleUpdateTls({
          action: {
            tlsOption: 'OFF',
            type: 'update-tls',
          },
          connectionStringUrl,
          connectionOptions: {
            connectionString: connectionStringUrl.toString(),
          },
        });
        expect(
          new ConnectionStringUrl(
            res.connectionOptions.connectionString
          ).searchParams.get('ssl')
        ).to.equal(null);
      });

      it('should unset the `ssl` option when ssl=false', function () {
        const connectionStringUrl = new ConnectionStringUrl(
          'mongodb://a:b@outerspace:123/?directConnection=true&ssl=false'
        );

        const res = handleUpdateTls({
          action: {
            tlsOption: 'OFF',
            type: 'update-tls',
          },
          connectionStringUrl,
          connectionOptions: {
            connectionString: connectionStringUrl.toString(),
          },
        });
        expect(
          new ConnectionStringUrl(
            res.connectionOptions.connectionString
          ).searchParams.get('ssl')
        ).to.equal(null);
      });
    });

    describe('when it is called to update to `DEFAULT`', function () {
      it('should unset tls when `DEFAULT` is passed', function () {
        const connectionStringUrl = new ConnectionStringUrl(
          'mongodb://a:b@outerspace:123/?directConnection=true&tls=true'
        );

        const res = handleUpdateTls({
          action: {
            tlsOption: 'DEFAULT',
            type: 'update-tls',
          },
          connectionStringUrl,
          connectionOptions: {
            connectionString: connectionStringUrl.toString(),
          },
        });
        expect(res.connectionOptions.connectionString).to.equal(
          'mongodb://a:b@outerspace:123/?directConnection=true'
        );
        expect(
          new ConnectionStringUrl(
            res.connectionOptions.connectionString
          ).searchParams.get('tls')
        ).to.equal(null);
      });

      it('should update the connection string', function () {
        const connectionStringUrl = new ConnectionStringUrl(
          'mongodb://a:b@outerspace:123/?directConnection=true&ssl=false&tls=true'
        );

        const res = handleUpdateTls({
          action: {
            tlsOption: 'DEFAULT',
            type: 'update-tls',
          },
          connectionStringUrl,
          connectionOptions: {
            connectionString: connectionStringUrl.toString(),
          },
        });
        expect(res.connectionOptions.connectionString).to.equal(
          'mongodb://a:b@outerspace:123/?directConnection=true'
        );
      });

      it('should unset the `ssl` option', function () {
        const connectionStringUrl = new ConnectionStringUrl(
          'mongodb://a:b@outerspace:123/?directConnection=true&ssl=false'
        );

        const res = handleUpdateTls({
          action: {
            tlsOption: 'DEFAULT',
            type: 'update-tls',
          },
          connectionStringUrl,
          connectionOptions: {
            connectionString: connectionStringUrl.toString(),
          },
        });
        expect(
          new ConnectionStringUrl(
            res.connectionOptions.connectionString
          ).searchParams.get('ssl')
        ).to.equal(null);
      });
    });
  });

  describe('#handleUpdateTlsOption', function () {
    it('should unset the passed option when the value is falsy', function () {
      const connectionStringUrl = new ConnectionStringUrl(
        'mongodb://a:b@outerspace:123/?directConnection=true&tls=true&tlsCAFile=%2Fpath%2Fto%2Ffile.pem'
      );

      const res = handleUpdateTlsOption({
        action: {
          key: 'tlsCAFile',
          value: null,
          type: 'update-tls-option',
        },
        connectionStringUrl,
        connectionOptions: {
          connectionString: connectionStringUrl.toString(),
        },
      });

      expect(
        new ConnectionStringUrl(
          res.connectionOptions.connectionString
        ).searchParams.get('tlsCAFile')
      ).to.equal(null);
      expect(
        res.connectionOptions.connectionString.includes('tlsCAFile')
      ).to.equal(false);
    });

    it('should not change tls when unsetting', function () {
      const connectionStringUrl = new ConnectionStringUrl(
        'mongodb://a:b@outerspace:123/?directConnection=true&tls=true&tlsCAFile=%2Fpath%2Fto%2Ffile.pem'
      );

      const res = handleUpdateTlsOption({
        action: {
          key: 'tlsCAFile',
          value: null,
          type: 'update-tls-option',
        },
        connectionStringUrl,
        connectionOptions: {
          connectionString: connectionStringUrl.toString(),
        },
      });
      expect(
        new ConnectionStringUrl(
          res.connectionOptions.connectionString
        ).searchParams.get('tls')
      ).to.equal('true');
    });

    it('should not set tls when unsetting a value', function () {
      const connectionStringUrl = new ConnectionStringUrl(
        'mongodb://a:b@outerspace:123/?directConnection=true&tlsCAFile=%2Fpath%2Fto%2Ffile.pem'
      );

      const res = handleUpdateTlsOption({
        action: {
          key: 'tlsCAFile',
          value: null,
          type: 'update-tls-option',
        },
        connectionStringUrl,
        connectionOptions: {
          connectionString: connectionStringUrl.toString(),
        },
      });
      expect(
        new ConnectionStringUrl(
          res.connectionOptions.connectionString
        ).searchParams.get('tls')
      ).to.equal(null);
    });

    it('should set tls true when setting a value', function () {
      const connectionStringUrl = new ConnectionStringUrl(
        'mongodb://a:b@outerspace:123/?directConnection=true'
      );

      const res = handleUpdateTlsOption({
        action: {
          key: 'tlsCAFile',
          value: '%2Fpath%2Fto%2Ffile.pem',
          type: 'update-tls-option',
        },
        connectionStringUrl,
        connectionOptions: {
          connectionString: connectionStringUrl.toString(),
        },
      });
      expect(
        new ConnectionStringUrl(
          res.connectionOptions.connectionString
        ).searchParams.get('tls')
      ).to.equal('true');
    });

    it('should set a tls option value', function () {
      const connectionStringUrl = new ConnectionStringUrl(
        'mongodb://a:b@outerspace:123/?directConnection=true'
      );

      const res = handleUpdateTlsOption({
        action: {
          key: 'tlsCAFile',
          value: '%2Fpath%2Fto%2Ffile.pem',
          type: 'update-tls-option',
        },
        connectionStringUrl,
        connectionOptions: {
          connectionString: connectionStringUrl.toString(),
        },
      });
      expect(
        new ConnectionStringUrl(
          res.connectionOptions.connectionString
        ).searchParams.get('tlsCAFile')
      ).to.equal('%2Fpath%2Fto%2Ffile.pem');
    });

    it('should set useSystemCA to true and remove CA file from options', function () {
      const connectionStringUrl = new ConnectionStringUrl(
        'mongodb://a:b@outerspace:123/?directConnection=true&tlsCAFile=%2Fpath%2Fto%2Ffile.pem'
      );

      const res = handleUpdateTlsOption({
        action: {
          key: 'useSystemCA',
          value: 'true',
          type: 'update-tls-option',
        },
        connectionStringUrl,
        connectionOptions: {
          connectionString: connectionStringUrl.toString(),
        },
      });
      expect(res.connectionOptions).to.have.property('useSystemCA', true);
      expect(
        new ConnectionStringUrl(
          res.connectionOptions.connectionString
        ).searchParams.get('tlsCAFile')
      ).to.equal(null);
    });

    it('should remove useSystemCA property', function () {
      const connectionStringUrl = new ConnectionStringUrl(
        'mongodb://a:b@outerspace:123/?directConnection=true&tlsCAFile=%2Fpath%2Fto%2Ffile.pem'
      );

      const res = handleUpdateTlsOption({
        action: {
          key: 'useSystemCA',
          value: null,
          type: 'update-tls-option',
        },
        connectionStringUrl,
        connectionOptions: {
          useSystemCA: true,
          connectionString: connectionStringUrl.toString(),
        },
      });
      expect(res.connectionOptions).not.to.have.property('useSystemCA');
    });
  });
});
