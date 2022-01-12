import { expect } from 'chai';
import ConnectionStringUrl from 'mongodb-connection-string-url';
import { MARKABLE_FORM_FIELD_NAMES } from '../constants/markable-form-fields';

import { handleConnectionFormFieldUpdate } from './use-connect-form';

describe('use-connect-form hook', function () {
  describe('#handleConnectionFormFieldUpdate', function () {
    describe('update-direct-connection action', function () {
      describe('directConnection is false on the connection string', function () {
        const connectionStringUrl = new ConnectionStringUrl(
          'mongodb://localhost:27019/?ssl=true&directConnection=false'
        );

        describe('when set directConnection to true is passed', function () {
          let updateResult: ReturnType<typeof handleConnectionFormFieldUpdate>;
          beforeEach(function () {
            updateResult = handleConnectionFormFieldUpdate({
              action: {
                type: 'update-direct-connection',
                isDirectConnection: true,
              },
              connectionStringUrl,
              connectionOptions: {
                connectionString: connectionStringUrl.toString(),
              },
            });
          });

          it('updates directConnection to true', function () {
            expect(
              updateResult.connectionStringUrl.searchParams.get(
                'directConnection'
              )
            ).to.equal('true');
          });

          it('updates connection string', function () {
            expect(updateResult.connectionOptions.connectionString).to.equal(
              'mongodb://localhost:27019/?ssl=true&directConnection=true'
            );
          });

          it('returns no errors', function () {
            expect(updateResult.errors.length).to.equal(0);
          });
        });

        describe('when set directConnection to false is passed', function () {
          let updateResult: ReturnType<typeof handleConnectionFormFieldUpdate>;
          beforeEach(function () {
            updateResult = handleConnectionFormFieldUpdate({
              action: {
                type: 'update-direct-connection',
                isDirectConnection: false,
              },
              connectionStringUrl,
              connectionOptions: {
                connectionString: connectionStringUrl.toString(),
              },
            });
          });

          it('unsets directConnection on the connectionStringUrl', function () {
            expect(
              updateResult.connectionStringUrl.searchParams.get(
                'directConnection'
              )
            ).to.equal(null);
          });

          it('updates the connection string with the unset', function () {
            expect(updateResult.connectionOptions.connectionString).to.equal(
              'mongodb://localhost:27019/?ssl=true'
            );
          });

          it('returns no errors', function () {
            expect(updateResult.errors.length).to.equal(0);
          });
        });
      });

      describe('directConnection is true on the connection string', function () {
        const connectionStringUrl = new ConnectionStringUrl(
          'mongodb://localhost:27019/?ssl=true&directConnection=true'
        );

        describe('when set directConnection to true is passed', function () {
          let updateResult: ReturnType<typeof handleConnectionFormFieldUpdate>;
          beforeEach(function () {
            updateResult = handleConnectionFormFieldUpdate({
              action: {
                type: 'update-direct-connection',
                isDirectConnection: true,
              },
              connectionStringUrl,
              connectionOptions: {
                connectionString: connectionStringUrl.toString(),
              },
            });
          });

          it('keeps directConnection equal to true', function () {
            expect(
              updateResult.connectionStringUrl.searchParams.get(
                'directConnection'
              )
            ).to.equal('true');
          });

          it('does not change the connection string', function () {
            expect(updateResult.connectionOptions.connectionString).to.equal(
              'mongodb://localhost:27019/?ssl=true&directConnection=true'
            );
          });

          it('returns no errors', function () {
            expect(updateResult.errors.length).to.equal(0);
          });
        });

        describe('when set directConnection to false is passed', function () {
          let updateResult: ReturnType<typeof handleConnectionFormFieldUpdate>;
          beforeEach(function () {
            updateResult = handleConnectionFormFieldUpdate({
              action: {
                type: 'update-direct-connection',
                isDirectConnection: false,
              },
              connectionStringUrl,
              connectionOptions: {
                connectionString: connectionStringUrl.toString(),
              },
            });
          });

          it('unsets directConnection on the connectionStringUrl', function () {
            expect(
              updateResult.connectionStringUrl.searchParams.get(
                'directConnection'
              )
            ).to.equal(null);
          });

          it('updates the connection string', function () {
            expect(updateResult.connectionOptions.connectionString).to.equal(
              'mongodb://localhost:27019/?ssl=true'
            );
          });

          it('returns no errors', function () {
            expect(updateResult.errors.length).to.equal(0);
          });
        });
      });
    });

    describe('add-new-host action', function () {
      describe('when directConnection is not set', function () {
        const connectionStringUrl = new ConnectionStringUrl(
          'mongodb://outerspace:123'
        );

        let updateResult: ReturnType<typeof handleConnectionFormFieldUpdate>;
        beforeEach(function () {
          updateResult = handleConnectionFormFieldUpdate({
            action: {
              type: 'add-new-host',
              fieldIndexToAddAfter: 0,
            },
            connectionStringUrl,
            connectionOptions: {
              connectionString: connectionStringUrl.toString(),
            },
          });
        });

        it('adds the host on the connectionStringUrl', function () {
          expect(updateResult.connectionStringUrl.hosts).to.deep.equal([
            'outerspace:123',
            'outerspace:124',
          ]);
        });

        it('updates the connection string with the new host', function () {
          expect(updateResult.connectionOptions.connectionString).to.equal(
            'mongodb://outerspace:123,outerspace:124/'
          );
        });

        it('returns no errors', function () {
          expect(updateResult.errors.length).to.equal(0);
        });
      });

      describe('with multiple hosts and a host without port', function () {
        const connectionStringUrl = new ConnectionStringUrl(
          'mongodb://outerspace:123,backyard,cruiseship:1234,catch:22'
        );

        let updateResult: ReturnType<typeof handleConnectionFormFieldUpdate>;
        beforeEach(function () {
          updateResult = handleConnectionFormFieldUpdate({
            action: {
              type: 'add-new-host',
              fieldIndexToAddAfter: 1,
            },
            connectionStringUrl,
            connectionOptions: {
              connectionString: connectionStringUrl.toString(),
            },
          });
        });

        it('adds the host on the connectionStringUrl', function () {
          expect(updateResult.connectionStringUrl.hosts).to.deep.equal([
            'outerspace:123',
            'backyard',
            'backyard:27018',
            'cruiseship:1234',
            'catch:22',
          ]);
        });

        it('updates the connection string with the new host', function () {
          expect(updateResult.connectionOptions.connectionString).to.equal(
            'mongodb://outerspace:123,backyard,backyard:27018,cruiseship:1234,catch:22/'
          );
        });
      });

      describe('when directConnection is set', function () {
        const connectionStringUrl = new ConnectionStringUrl(
          'mongodb://outerspace:27019/?ssl=true&directConnection=true'
        );

        let updateResult: ReturnType<typeof handleConnectionFormFieldUpdate>;
        beforeEach(function () {
          updateResult = handleConnectionFormFieldUpdate({
            action: {
              type: 'add-new-host',
              fieldIndexToAddAfter: 0,
            },
            connectionStringUrl,
            connectionOptions: {
              connectionString: connectionStringUrl.toString(),
            },
          });
        });

        it('unsets direct connection when a host is added', function () {
          expect(
            updateResult.connectionStringUrl.searchParams.get(
              'directConnection'
            )
          ).to.equal(null);
        });

        it('updates the connection string with the new host', function () {
          expect(updateResult.connectionOptions.connectionString).to.equal(
            'mongodb://outerspace:27019,outerspace:27020/?ssl=true'
          );
        });
      });
    });

    describe('remove-host action', function () {
      describe('with multiple hosts and a host without port', function () {
        const connectionStringUrl = new ConnectionStringUrl(
          'mongodb://outerspace:123,backyard,cruiseship:1234,catch:22'
        );

        let updateResult: ReturnType<typeof handleConnectionFormFieldUpdate>;
        beforeEach(function () {
          updateResult = handleConnectionFormFieldUpdate({
            action: {
              type: 'remove-host',
              fieldIndexToRemove: 1,
            },
            connectionStringUrl,
            connectionOptions: {
              connectionString: connectionStringUrl.toString(),
            },
          });
        });

        it('removes the host on the connectionStringUrl', function () {
          expect(updateResult.connectionStringUrl.hosts).to.deep.equal([
            'outerspace:123',
            'cruiseship:1234',
            'catch:22',
          ]);
        });

        it('updates the connection string to not have the host', function () {
          expect(updateResult.connectionOptions.connectionString).to.equal(
            'mongodb://outerspace:123,cruiseship:1234,catch:22/'
          );
        });
      });

      describe('removing a host leaving only an empty host', function () {
        const connectionStringUrl = new ConnectionStringUrl(
          'mongodb://outerspace:27019,/?ssl=true&directConnection=true'
        );

        let updateResult: ReturnType<typeof handleConnectionFormFieldUpdate>;
        beforeEach(function () {
          updateResult = handleConnectionFormFieldUpdate({
            action: {
              type: 'remove-host',
              fieldIndexToRemove: 0,
            },
            connectionStringUrl,
            connectionOptions: {
              connectionString: connectionStringUrl.toString(),
            },
          });
        });

        it('removes the host on the connectionStringUrl, but sets the last host to default', function () {
          expect(updateResult.connectionStringUrl.hosts).to.deep.equal([
            'localhost:27017',
          ]);
        });

        it('updates the connection string to have one default host', function () {
          expect(updateResult.connectionOptions.connectionString).to.equal(
            'mongodb://localhost:27017/?ssl=true&directConnection=true'
          );
        });
      });
    });

    describe('update-host action', function () {
      describe('updating one host in many', function () {
        const connectionStringUrl = new ConnectionStringUrl(
          'mongodb://outerspace:123,backyard,cruiseship:1234,catch:22'
        );

        let updateResult: ReturnType<typeof handleConnectionFormFieldUpdate>;
        beforeEach(function () {
          updateResult = handleConnectionFormFieldUpdate({
            action: {
              type: 'update-host',
              fieldIndex: 2,
              newHostValue: 'cruiseships:1234',
            },
            connectionStringUrl,
            connectionOptions: {
              connectionString: connectionStringUrl.toString(),
            },
          });
        });

        it('updates the host on the connectionStringUrl', function () {
          expect(updateResult.connectionStringUrl.hosts).to.deep.equal([
            'outerspace:123',
            'backyard',
            'cruiseships:1234',
            'catch:22',
          ]);
        });

        it('updates the connection string with the updated host', function () {
          expect(updateResult.connectionOptions.connectionString).to.equal(
            'mongodb://outerspace:123,backyard,cruiseships:1234,catch:22/'
          );
        });

        it('returns no errors', function () {
          expect(updateResult.errors.length).to.equal(0);
        });
      });

      describe('updating a single host', function () {
        const connectionStringUrl = new ConnectionStringUrl(
          'mongodb://cats:123/?bacon=true'
        );

        let updateResult: ReturnType<typeof handleConnectionFormFieldUpdate>;
        beforeEach(function () {
          updateResult = handleConnectionFormFieldUpdate({
            action: {
              type: 'update-host',
              fieldIndex: 0,
              newHostValue: 'dogs:1234',
            },
            connectionStringUrl,
            connectionOptions: {
              connectionString: connectionStringUrl.toString(),
            },
          });
        });

        it('updates the host on the connectionStringUrl', function () {
          expect(updateResult.connectionStringUrl.hosts).to.deep.equal([
            'dogs:1234',
          ]);
        });

        it('updates the connection string with the updated host', function () {
          expect(updateResult.connectionOptions.connectionString).to.equal(
            'mongodb://dogs:1234/?bacon=true'
          );
        });

        it('returns no errors', function () {
          expect(updateResult.errors.length).to.equal(0);
        });
      });

      describe('updating an srv host', function () {
        const connectionStringUrl = new ConnectionStringUrl(
          'mongodb+srv://backyard'
        );

        let updateResult: ReturnType<typeof handleConnectionFormFieldUpdate>;
        beforeEach(function () {
          updateResult = handleConnectionFormFieldUpdate({
            action: {
              type: 'update-host',
              fieldIndex: 0,
              newHostValue: 'backyards',
            },
            connectionStringUrl,
            connectionOptions: {
              connectionString: connectionStringUrl.toString(),
            },
          });
        });

        it('updates the host on the connectionStringUrl', function () {
          expect(updateResult.connectionStringUrl.hosts).to.deep.equal([
            'backyards',
          ]);
        });

        it('updates the connection string with the updated host', function () {
          expect(updateResult.connectionOptions.connectionString).to.equal(
            'mongodb+srv://backyards/'
          );
        });

        it('returns no errors', function () {
          expect(updateResult.errors.length).to.equal(0);
        });
      });

      describe('making a single host empty', function () {
        const connectionStringUrl = new ConnectionStringUrl(
          'mongodb://outerspace:27019/?ssl=true&directConnection=true'
        );

        let updateResult: ReturnType<typeof handleConnectionFormFieldUpdate>;
        beforeEach(function () {
          updateResult = handleConnectionFormFieldUpdate({
            action: {
              type: 'update-host',
              fieldIndex: 0,
              newHostValue: '',
            },
            connectionStringUrl,
            connectionOptions: {
              connectionString: connectionStringUrl.toString(),
            },
          });
        });

        it('adds an error to the errors with a message and the host field name', function () {
          expect(updateResult.errors).to.deep.equal([
            {
              fieldName: MARKABLE_FORM_FIELD_NAMES.HOSTS,
              fieldIndex: 0,
              message:
                'Host cannot be empty. The host is the address hostname, IP address, or UNIX domain socket where the mongodb instance is running.',
            },
          ]);
        });

        it('keeps the connection string and url the same', function () {
          expect(updateResult.connectionStringUrl.hosts).to.deep.equal([
            'outerspace:27019',
          ]);
          expect(updateResult.connectionOptions.connectionString).to.equal(
            'mongodb://outerspace:27019/?ssl=true&directConnection=true'
          );
        });
      });

      describe('updating a host to have an @', function () {
        const connectionStringUrl = new ConnectionStringUrl(
          'mongodb://outerspace:27019,spaces:123/?ssl=true&directConnection=true'
        );

        let updateResult: ReturnType<typeof handleConnectionFormFieldUpdate>;
        beforeEach(function () {
          updateResult = handleConnectionFormFieldUpdate({
            action: {
              type: 'update-host',
              fieldIndex: 1,
              newHostValue: 'spaces:123@',
            },
            connectionStringUrl,
            connectionOptions: {
              connectionString: connectionStringUrl.toString(),
            },
          });
        });

        it('adds an error to the errors with a message and the host field name', function () {
          expect(updateResult.errors).to.deep.equal([
            {
              fieldName: MARKABLE_FORM_FIELD_NAMES.HOSTS,
              fieldIndex: 1,
              message: "Invalid character in host: '@'",
            },
          ]);
        });

        it('keeps the connection string and url the same', function () {
          expect(updateResult.connectionStringUrl.hosts).to.deep.equal([
            'outerspace:27019',
            'spaces:123',
          ]);
          expect(updateResult.connectionOptions.connectionString).to.equal(
            'mongodb://outerspace:27019,spaces:123/?ssl=true&directConnection=true'
          );
        });
      });

      describe('updating a host to have an /', function () {
        const connectionStringUrl = new ConnectionStringUrl(
          'mongodb://outerspace:27019/?ssl=true&directConnection=true'
        );

        let updateResult: ReturnType<typeof handleConnectionFormFieldUpdate>;
        beforeEach(function () {
          updateResult = handleConnectionFormFieldUpdate({
            action: {
              type: 'update-host',
              fieldIndex: 0,
              newHostValue: 'outerspace:27019/',
            },
            connectionStringUrl,
            connectionOptions: {
              connectionString: connectionStringUrl.toString(),
            },
          });
        });

        it('adds an error to the errors with a message and the host field name', function () {
          expect(updateResult.errors).to.deep.equal([
            {
              fieldName: MARKABLE_FORM_FIELD_NAMES.HOSTS,
              fieldIndex: 0,
              message: "Invalid character in host: '/'",
            },
          ]);
        });

        it('keeps the connection string and url the same', function () {
          expect(updateResult.connectionStringUrl.hosts).to.deep.equal([
            'outerspace:27019',
          ]);
          expect(updateResult.connectionOptions.connectionString).to.equal(
            'mongodb://outerspace:27019/?ssl=true&directConnection=true'
          );
        });
      });

      describe('updating an srv host to have a :', function () {
        const connectionStringUrl = new ConnectionStringUrl(
          'mongodb+srv://outerspace/?ssl=true'
        );

        let updateResult: ReturnType<typeof handleConnectionFormFieldUpdate>;
        beforeEach(function () {
          updateResult = handleConnectionFormFieldUpdate({
            action: {
              type: 'update-host',
              fieldIndex: 0,
              newHostValue: 'outerspace:',
            },
            connectionStringUrl,
            connectionOptions: {
              connectionString: connectionStringUrl.toString(),
            },
          });
        });

        it('adds an error to the errors with a message and the host field name', function () {
          expect(updateResult.errors).to.deep.equal([
            {
              fieldName: MARKABLE_FORM_FIELD_NAMES.HOSTS,
              fieldIndex: 0,
              message: "Invalid character in host: ':'",
            },
          ]);
        });

        it('keeps the connection string and url the same', function () {
          expect(updateResult.connectionStringUrl.hosts).to.deep.equal([
            'outerspace',
          ]);
          expect(updateResult.connectionOptions.connectionString).to.equal(
            'mongodb+srv://outerspace/?ssl=true'
          );
        });
      });
    });

    describe('update-connection-schema action', function () {
      describe('setting standard to srv', function () {
        const connectionStringUrl = new ConnectionStringUrl(
          'mongodb://a:b@cruiseship:123,backyard,cruiseship:1234,catch:22/?ssl=true'
        );

        let updateResult: ReturnType<typeof handleConnectionFormFieldUpdate>;
        beforeEach(function () {
          updateResult = handleConnectionFormFieldUpdate({
            action: {
              type: 'update-connection-schema',
              isSrv: true,
            },
            connectionStringUrl,
            connectionOptions: {
              connectionString: connectionStringUrl.toString(),
            },
          });
        });

        it('updates the host on the connectionStringUrl', function () {
          expect(updateResult.connectionStringUrl.hosts).to.deep.equal([
            'cruiseship',
          ]);
        });

        it('updates the schema on the connectionStringUrl', function () {
          expect(updateResult.connectionStringUrl.isSRV).to.equal(true);
        });

        it('updates the connection string', function () {
          expect(updateResult.connectionOptions.connectionString).to.equal(
            'mongodb+srv://a:b@cruiseship/?ssl=true'
          );
        });

        it('returns no errors', function () {
          expect(updateResult.errors.length).to.equal(0);
        });
      });

      describe('setting standard with directConnection to srv', function () {
        const connectionStringUrl = new ConnectionStringUrl(
          'mongodb://outerspace:123/?directConnection=true'
        );

        let updateResult: ReturnType<typeof handleConnectionFormFieldUpdate>;
        beforeEach(function () {
          updateResult = handleConnectionFormFieldUpdate({
            action: {
              type: 'update-connection-schema',
              isSrv: true,
            },
            connectionStringUrl,
            connectionOptions: {
              connectionString: connectionStringUrl.toString(),
            },
          });
        });

        it('removes the host on the connectionStringUrl', function () {
          expect(updateResult.connectionStringUrl.hosts).to.deep.equal([
            'outerspace',
          ]);
        });

        it('updates the schema on the connectionStringUrl', function () {
          expect(updateResult.connectionStringUrl.isSRV).to.equal(true);
        });

        it('updates the connection string', function () {
          expect(updateResult.connectionOptions.connectionString).to.equal(
            'mongodb+srv://outerspace/'
          );
        });
      });

      describe('setting srv to standard', function () {
        const connectionStringUrl = new ConnectionStringUrl(
          'mongodb+srv://aa:bb@outerspace/?ssl=true'
        );

        let updateResult: ReturnType<typeof handleConnectionFormFieldUpdate>;
        beforeEach(function () {
          updateResult = handleConnectionFormFieldUpdate({
            action: {
              type: 'update-connection-schema',
              isSrv: false,
            },
            connectionStringUrl,
            connectionOptions: {
              connectionString: connectionStringUrl.toString(),
            },
          });
        });

        it('updates the host on the connectionStringUrl', function () {
          expect(updateResult.connectionStringUrl.hosts).to.deep.equal([
            'outerspace:27017',
          ]);
        });

        it('updates the schema on the connectionStringUrl', function () {
          expect(updateResult.connectionStringUrl.isSRV).to.equal(false);
        });

        it('updates the connection string', function () {
          expect(updateResult.connectionOptions.connectionString).to.equal(
            'mongodb://aa:bb@outerspace:27017/?ssl=true'
          );
        });

        it('returns no errors', function () {
          expect(updateResult.errors.length).to.equal(0);
        });
      });
    });

    describe('update-ssh-options action', function () {
      it('should handleUpdateConnectionOptions', function () {
        const connectionStringUrl = new ConnectionStringUrl(
          'mongodb://localhost:27019/?ssl=true&directConnection=false'
        );
        const {
          connectionOptions: { sshTunnel },
        } = handleConnectionFormFieldUpdate({
          action: {
            type: 'update-ssh-options',
            currentTab: 'password',
            key: 'host',
            value: 'localhost',
          },
          connectionOptions: {
            connectionString: connectionStringUrl.toString(),
          },
          connectionStringUrl: connectionStringUrl,
          initialErrors: [],
        });

        expect(sshTunnel).to.not.be.undefined;
        expect(sshTunnel.host).to.equal('localhost');
      });
    });

    describe('update-search-param action', function () {
      it('should handle update of search param value', function () {
        const connectionStringUrl = new ConnectionStringUrl(
          'mongodb://localhost:27019/'
        );
        const { connectionStringUrl: connectionUrl } =
          handleConnectionFormFieldUpdate({
            action: {
              type: 'update-search-param',
              currentKey: 'w',
              value: 'localhost',
            },
            connectionOptions: {
              connectionString: connectionStringUrl.toString(),
            },
            connectionStringUrl: connectionStringUrl,
            initialErrors: [],
          });
        expect(connectionUrl.searchParams.get('w')).to.equal('localhost');
      });
      it('should handle update of search param key - with existing value', function () {
        const connectionStringUrl = new ConnectionStringUrl(
          'mongodb://localhost:27019/?w=w-value'
        );
        const { connectionStringUrl: connectionUrl } =
          handleConnectionFormFieldUpdate({
            action: {
              type: 'update-search-param',
              currentKey: 'w',
              newKey: 'journal',
            },
            connectionOptions: {
              connectionString: connectionStringUrl.toString(),
            },
            connectionStringUrl: connectionStringUrl,
            initialErrors: [],
          });
        expect(connectionUrl.searchParams.get('journal')).to.equal('w-value');
        expect(connectionUrl.searchParams.get('w')).to.not.be.true;
      });
      it('should handle update of search param key - with new value', function () {
        const connectionStringUrl = new ConnectionStringUrl(
          'mongodb://localhost:27019/w=w-value'
        );
        const { connectionStringUrl: connectionUrl } =
          handleConnectionFormFieldUpdate({
            action: {
              type: 'update-search-param',
              currentKey: 'w',
              newKey: 'journal',
              value: 'j-value',
            },
            connectionOptions: {
              connectionString: connectionStringUrl.toString(),
            },
            connectionStringUrl: connectionStringUrl,
            initialErrors: [],
          });
        expect(connectionUrl.searchParams.get('journal')).to.equal('j-value');
      });
    });

    describe('delete-search-param action', function () {
      it('should handle delete of search param', function () {
        const connectionStringUrl = new ConnectionStringUrl(
          'mongodb://localhost:27019/?w=hello&journal=hi'
        );
        const { connectionStringUrl: connectionUrl } =
          handleConnectionFormFieldUpdate({
            action: {
              type: 'delete-search-param',
              key: 'w',
            },
            connectionOptions: {
              connectionString: connectionStringUrl.toString(),
            },
            connectionStringUrl: connectionStringUrl,
            initialErrors: [],
          });
        expect(connectionUrl.searchParams.get('w')).to.not.be.true;
        expect(connectionUrl.searchParams.get('journal')).to.equal('hi');
      });
    });

    describe('update-connection-path action', function () {
      it('should udpate connection path - to input value', function () {
        const connectionStringUrl = new ConnectionStringUrl(
          'mongodb://localhost:27019/admin'
        );
        const { connectionStringUrl: connectionUrl } =
          handleConnectionFormFieldUpdate({
            action: {
              type: 'update-connection-path',
              value: 'awesome',
            },
            connectionOptions: {
              connectionString: connectionStringUrl.toString(),
            },
            connectionStringUrl: connectionStringUrl,
            initialErrors: [],
          });
        expect(connectionUrl.pathname).to.equal('/awesome');
      });

      it('should udpate connection path - to empty value', function () {
        const connectionStringUrl = new ConnectionStringUrl(
          'mongodb://localhost:27019/admin'
        );
        const { connectionStringUrl: connectionUrl } =
          handleConnectionFormFieldUpdate({
            action: {
              type: 'update-connection-path',
              value: '',
            },
            connectionOptions: {
              connectionString: connectionStringUrl.toString(),
            },
            connectionStringUrl: connectionStringUrl,
            initialErrors: [],
          });
        expect(connectionUrl.pathname).to.equal('');
      });
    });
  });
});
