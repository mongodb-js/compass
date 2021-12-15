import { expect } from 'chai';
import ConnectionStringUrl from 'mongodb-connection-string-url';

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
              hostIndexToAddAfter: 0,
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
              hostIndexToAddAfter: 1,
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
              hostIndexToAddAfter: 0,
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
              hostIndexToRemove: 1,
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
              hostIndexToRemove: 0,
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

    // TODO: Update host tests
    // Single host, srv host, multi hosts
    // Add invalid character
    // Make empty (backspace)

    // describe('update-host action', function () {
    //   describe('with multiple hosts and a host without port', function () {
    //     const connectionStringUrl = new ConnectionStringUrl(
    //       'mongodb://outerspace:123,backyard,cruiseship:1234,catch:22'
    //     );

    //     let updateResult: ReturnType<typeof handleConnectionFormFieldUpdate>;
    //     beforeEach(function () {
    //       updateResult = handleConnectionFormFieldUpdate({
    //         action: {
    //           type: 'update-host',
    //           hostIndexToRemove: 1,
    //         },
    //         connectionStringUrl,
    //         connectionOptions: {
    //           connectionString: connectionStringUrl.toString(),
    //         },
    //       });
    //     });

    //     it('removes the host on the connectionStringUrl', function () {
    //       expect(updateResult.connectionStringUrl.hosts).to.deep.equal([
    //         'outerspace:123',
    //         'cruiseship:1234',
    //         'catch:22',
    //       ]);
    //     });

    //     it('updates the connection string to not have the host', function () {
    //       expect(updateResult.connectionOptions.connectionString).to.equal(
    //         'mongodb://outerspace:123,cruiseship:1234,catch:22/'
    //       );
    //     });
    //   });

    //   describe('removing a host leaving only an empty host', function () {
    //     const connectionStringUrl = new ConnectionStringUrl(
    //       'mongodb://outerspace:27019,/?ssl=true&directConnection=true'
    //     );

    //     let updateResult: ReturnType<typeof handleConnectionFormFieldUpdate>;
    //     beforeEach(function () {
    //       updateResult = handleConnectionFormFieldUpdate({
    //         action: {
    //           type: 'update-host',
    //           hostIndexToRemove: 0,
    //         },
    //         connectionStringUrl,
    //         connectionOptions: {
    //           connectionString: connectionStringUrl.toString(),
    //         },
    //       });
    //     });

    //     it('removes the host on the connectionStringUrl, but sets the last host to default', function () {
    //       expect(updateResult.connectionStringUrl.hosts).to.deep.equal([
    //         'localhost:27017',
    //       ]);
    //     });

    //     it('updates the connection string to have one default host', function () {
    //       expect(updateResult.connectionOptions.connectionString).to.equal(
    //         'mongodb://localhost:27017/'
    //       );
    //     });
    //   });
    // });
  });
});
