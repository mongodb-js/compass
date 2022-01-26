import { expect } from 'chai';
import ConnectionStringUrl from 'mongodb-connection-string-url';

import { handleUpdateTlsOption } from './tls-options';

describe('#handleUpdateTlsOption', function () {
  describe('when it is called to update to `ON`', function () {
    it('should update tls to `true` when `ON` is passed', function () {
      const connectionStringUrl = new ConnectionStringUrl(
        'mongodb://a:b@outerspace:123/?directConnection=true&ssl=false'
      );

      const res = handleUpdateTlsOption({
        action: {
          tlsOption: 'ON',
          type: 'update-tls-option',
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

      const res = handleUpdateTlsOption({
        action: {
          tlsOption: 'ON',
          type: 'update-tls-option',
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

      const res = handleUpdateTlsOption({
        action: {
          tlsOption: 'ON',
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
        ).searchParams.get('ssl')
      ).to.equal(null);
    });
  });

  describe('when it is called to update to `OFF`', function () {
    it('should update tls to `false` when `OFF` is passed', function () {
      const connectionStringUrl = new ConnectionStringUrl(
        'mongodb://a:b@outerspace:123/?directConnection=true&ssl=false'
      );

      const res = handleUpdateTlsOption({
        action: {
          tlsOption: 'OFF',
          type: 'update-tls-option',
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

      const res = handleUpdateTlsOption({
        action: {
          tlsOption: 'OFF',
          type: 'update-tls-option',
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

      const res = handleUpdateTlsOption({
        action: {
          tlsOption: 'OFF',
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
        ).searchParams.get('ssl')
      ).to.equal(null);
    });

    it('should unset the `ssl` option when ssl=false', function () {
      const connectionStringUrl = new ConnectionStringUrl(
        'mongodb://a:b@outerspace:123/?directConnection=true&ssl=false'
      );

      const res = handleUpdateTlsOption({
        action: {
          tlsOption: 'OFF',
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
        ).searchParams.get('ssl')
      ).to.equal(null);
    });
  });

  describe('when it is called to update to `DEFAULT`', function () {
    it('should unset tls when `DEFAULT` is passed', function () {
      const connectionStringUrl = new ConnectionStringUrl(
        'mongodb://a:b@outerspace:123/?directConnection=true&tls=true'
      );

      const res = handleUpdateTlsOption({
        action: {
          tlsOption: 'DEFAULT',
          type: 'update-tls-option',
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

      const res = handleUpdateTlsOption({
        action: {
          tlsOption: 'DEFAULT',
          type: 'update-tls-option',
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

      const res = handleUpdateTlsOption({
        action: {
          tlsOption: 'DEFAULT',
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
        ).searchParams.get('ssl')
      ).to.equal(null);
    });
  });
});
