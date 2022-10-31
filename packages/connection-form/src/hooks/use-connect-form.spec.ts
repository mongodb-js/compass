import { expect } from 'chai';
import ConnectionStringUrl from 'mongodb-connection-string-url';
import { handleConnectionFormFieldUpdate } from './use-connect-form';
import { renderHook, act } from '@testing-library/react-hooks';
import { useConnectForm } from './use-connect-form';

describe('use-connect-form hook', function () {
  describe('isDirty', function () {
    const initialConnectionInfo = {
      id: 'turtle',
      connectionOptions: {
        connectionString: 'mongodb://turtle',
      },
      favorite: {
        name: 'turtles',
      },
    };
    beforeEach(function () {});
    it('should be false on first render', function () {
      const { result } = renderHook(() =>
        useConnectForm(initialConnectionInfo, null)
      );
      expect(result.current[0].isDirty).to.be.false;
    });
    it('should be true after connection string is updated', function () {
      const { result } = renderHook(() =>
        useConnectForm(initialConnectionInfo, null)
      );
      const initialState = result.current[0];
      const functions = result.current[1];
      expect(initialState.isDirty).to.be.false;
      act(() => {
        functions.updateConnectionFormField({
          type: 'update-connection-string',
          newConnectionStringValue: 'mongodb://localhost:27017',
        });
      });
      expect(result.current[0].isDirty).to.be.true;
    });
    it('should be true after ssh options are changed', function () {
      const { result } = renderHook(() =>
        useConnectForm(initialConnectionInfo, null)
      );
      const initialState = result.current[0];
      const functions = result.current[1];
      expect(initialState.isDirty).to.be.false;
      act(() => {
        functions.updateConnectionFormField({
          type: 'update-ssh-options',
          key: 'host',
          value: 'myproxy:22',
        });
      });
      expect(result.current[0].isDirty).to.be.true;
    });
  });

  describe('#handleConnectionFormFieldUpdate', function () {
    describe('add-new-host action', function () {
      describe('when directConnection is not set', function () {
        const connectionStringUrl = new ConnectionStringUrl(
          'mongodb://outerspace:123'
        );

        let updateResult: ReturnType<typeof handleConnectionFormFieldUpdate>;
        beforeEach(function () {
          updateResult = handleConnectionFormFieldUpdate(
            {
              type: 'add-new-host',
              fieldIndexToAddAfter: 0,
            },
            {
              connectionString: connectionStringUrl.toString(),
            }
          );
        });

        it('adds the host on the connectionStringUrl', function () {
          expect(
            new ConnectionStringUrl(
              updateResult.connectionOptions.connectionString
            ).hosts
          ).to.deep.equal(['outerspace:123', 'outerspace:124']);
        });

        it('updates the connection string with the new host', function () {
          expect(updateResult.connectionOptions.connectionString).to.equal(
            'mongodb://outerspace:123,outerspace:124/'
          );
        });

        it('returns no errors', function () {
          expect(updateResult.errors).to.equal(undefined);
        });
      });

      describe('with multiple hosts and a host without port', function () {
        const connectionStringUrl = new ConnectionStringUrl(
          'mongodb://outerspace:123,backyard,cruiseship:1234,catch:22'
        );

        let updateResult: ReturnType<typeof handleConnectionFormFieldUpdate>;
        beforeEach(function () {
          updateResult = handleConnectionFormFieldUpdate(
            {
              type: 'add-new-host',
              fieldIndexToAddAfter: 1,
            },
            {
              connectionString: connectionStringUrl.toString(),
            }
          );
        });

        it('adds the host on the connectionStringUrl', function () {
          expect(
            new ConnectionStringUrl(
              updateResult.connectionOptions.connectionString
            ).hosts
          ).to.deep.equal([
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
          updateResult = handleConnectionFormFieldUpdate(
            {
              type: 'add-new-host',
              fieldIndexToAddAfter: 0,
            },
            {
              connectionString: connectionStringUrl.toString(),
            }
          );
        });

        it('unsets direct connection when a host is added', function () {
          expect(
            new ConnectionStringUrl(
              updateResult.connectionOptions.connectionString
            ).searchParams.get('directConnection')
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
          updateResult = handleConnectionFormFieldUpdate(
            {
              type: 'remove-host',
              fieldIndexToRemove: 1,
            },
            {
              connectionString: connectionStringUrl.toString(),
            }
          );
        });

        it('removes the host on the connectionStringUrl', function () {
          expect(
            new ConnectionStringUrl(
              updateResult.connectionOptions.connectionString
            ).hosts
          ).to.deep.equal(['outerspace:123', 'cruiseship:1234', 'catch:22']);
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
          updateResult = handleConnectionFormFieldUpdate(
            {
              type: 'remove-host',
              fieldIndexToRemove: 0,
            },
            {
              connectionString: connectionStringUrl.toString(),
            }
          );
        });

        it('removes the host on the connectionStringUrl, but sets the last host to default', function () {
          expect(
            new ConnectionStringUrl(
              updateResult.connectionOptions.connectionString
            ).hosts
          ).to.deep.equal(['localhost:27017']);
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
          updateResult = handleConnectionFormFieldUpdate(
            {
              type: 'update-host',
              fieldIndex: 2,
              newHostValue: 'cruiseships:1234',
            },
            {
              connectionString: connectionStringUrl.toString(),
            }
          );
        });

        it('updates the host on the connectionStringUrl', function () {
          expect(
            new ConnectionStringUrl(
              updateResult.connectionOptions.connectionString
            ).hosts
          ).to.deep.equal([
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
          expect(updateResult.errors?.length).to.equal(0);
        });
      });

      describe('updating a single host', function () {
        const connectionStringUrl = new ConnectionStringUrl(
          'mongodb://cats:123/?bacon=true'
        );

        let updateResult: ReturnType<typeof handleConnectionFormFieldUpdate>;
        beforeEach(function () {
          updateResult = handleConnectionFormFieldUpdate(
            {
              type: 'update-host',
              fieldIndex: 0,
              newHostValue: 'dogs:1234',
            },
            {
              connectionString: connectionStringUrl.toString(),
            }
          );
        });

        it('updates the host on the connectionStringUrl', function () {
          expect(
            new ConnectionStringUrl(
              updateResult.connectionOptions.connectionString
            ).hosts
          ).to.deep.equal(['dogs:1234']);
        });

        it('updates the connection string with the updated host', function () {
          expect(updateResult.connectionOptions.connectionString).to.equal(
            'mongodb://dogs:1234/?bacon=true'
          );
        });

        it('returns no errors', function () {
          expect(updateResult.errors?.length).to.equal(0);
        });
      });

      describe('updating an srv host', function () {
        const connectionStringUrl = new ConnectionStringUrl(
          'mongodb+srv://backyard'
        );

        let updateResult: ReturnType<typeof handleConnectionFormFieldUpdate>;
        beforeEach(function () {
          updateResult = handleConnectionFormFieldUpdate(
            {
              type: 'update-host',
              fieldIndex: 0,
              newHostValue: 'backyards',
            },
            {
              connectionString: connectionStringUrl.toString(),
            }
          );
        });

        it('updates the host on the connectionStringUrl', function () {
          expect(
            new ConnectionStringUrl(
              updateResult.connectionOptions.connectionString
            ).hosts
          ).to.deep.equal(['backyards']);
        });

        it('updates the connection string with the updated host', function () {
          expect(updateResult.connectionOptions.connectionString).to.equal(
            'mongodb+srv://backyards/'
          );
        });

        it('returns no errors', function () {
          expect(updateResult.errors?.length).to.equal(0);
        });
      });

      describe('making a single host empty', function () {
        const connectionStringUrl = new ConnectionStringUrl(
          'mongodb://outerspace:27019/?ssl=true&directConnection=true'
        );

        let updateResult: ReturnType<typeof handleConnectionFormFieldUpdate>;
        beforeEach(function () {
          updateResult = handleConnectionFormFieldUpdate(
            {
              type: 'update-host',
              fieldIndex: 0,
              newHostValue: '',
            },
            {
              connectionString: connectionStringUrl.toString(),
            }
          );
        });

        it('does not add an error to the errors', function () {
          expect(updateResult.errors).to.deep.equal([]);
        });

        it('produces a well formed connection string', function () {
          expect(
            new ConnectionStringUrl(
              updateResult.connectionOptions.connectionString,
              { looseValidation: true }
            ).hosts
          ).to.deep.equal(['']);
          expect(updateResult.connectionOptions.connectionString).to.equal(
            'mongodb:///?ssl=true&directConnection=true'
          );
        });
      });

      describe('updating a host to have an @', function () {
        const connectionStringUrl = new ConnectionStringUrl(
          'mongodb://outerspace:27019,spaces:123/?ssl=true&directConnection=true'
        );

        let updateResult: ReturnType<typeof handleConnectionFormFieldUpdate>;
        beforeEach(function () {
          updateResult = handleConnectionFormFieldUpdate(
            {
              type: 'update-host',
              fieldIndex: 1,
              newHostValue: 'spaces:123@',
            },
            {
              connectionString: connectionStringUrl.toString(),
            }
          );
        });

        it('adds an error to the errors with a message and the host field name', function () {
          expect(updateResult.errors).to.deep.equal([
            {
              fieldName: 'hosts',
              fieldTab: 'general',
              fieldIndex: 1,
              message: "Invalid character in host: '@'",
            },
          ]);
        });

        it('keeps the connection string and url the same', function () {
          expect(
            new ConnectionStringUrl(
              updateResult.connectionOptions.connectionString
            ).hosts
          ).to.deep.equal(['outerspace:27019', 'spaces:123']);
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
          updateResult = handleConnectionFormFieldUpdate(
            {
              type: 'update-host',
              fieldIndex: 0,
              newHostValue: 'outerspace:27019/',
            },
            {
              connectionString: connectionStringUrl.toString(),
            }
          );
        });

        it('adds an error to the errors with a message and the host field name', function () {
          expect(updateResult.errors).to.deep.equal([
            {
              fieldName: 'hosts',
              fieldIndex: 0,
              fieldTab: 'general',
              message: "Invalid character in host: '/'",
            },
          ]);
        });

        it('keeps the connection string and url the same', function () {
          expect(
            new ConnectionStringUrl(
              updateResult.connectionOptions.connectionString
            ).hosts
          ).to.deep.equal(['outerspace:27019']);
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
          updateResult = handleConnectionFormFieldUpdate(
            {
              type: 'update-host',
              fieldIndex: 0,
              newHostValue: 'outerspace:',
            },
            {
              connectionString: connectionStringUrl.toString(),
            }
          );
        });

        it('adds an error to the errors with a message and the host field name', function () {
          expect(updateResult.errors).to.deep.equal([
            {
              fieldName: 'hosts',
              fieldIndex: 0,
              fieldTab: 'general',
              message: "Invalid character in host: ':'",
            },
          ]);
        });

        it('keeps the connection string and url the same', function () {
          expect(
            new ConnectionStringUrl(
              updateResult.connectionOptions.connectionString
            ).hosts
          ).to.deep.equal(['outerspace']);
          expect(updateResult.connectionOptions.connectionString).to.equal(
            'mongodb+srv://outerspace/?ssl=true'
          );
        });
      });
    });

    describe('update-connection-scheme action', function () {
      describe('setting standard to srv', function () {
        const connectionStringUrl = new ConnectionStringUrl(
          'mongodb://a:b@cruiseship:123,backyard,cruiseship:1234,catch:22/?ssl=true'
        );

        let updateResult: ReturnType<typeof handleConnectionFormFieldUpdate>;
        beforeEach(function () {
          updateResult = handleConnectionFormFieldUpdate(
            {
              type: 'update-connection-scheme',
              isSrv: true,
            },
            {
              connectionString: connectionStringUrl.toString(),
            }
          );
        });

        it('updates the host on the connectionStringUrl', function () {
          expect(
            new ConnectionStringUrl(
              updateResult.connectionOptions.connectionString
            ).hosts
          ).to.deep.equal(['cruiseship']);
        });

        it('updates the schema on the connectionStringUrl', function () {
          expect(
            new ConnectionStringUrl(
              updateResult.connectionOptions.connectionString
            ).isSRV
          ).to.equal(true);
        });

        it('updates the connection string', function () {
          expect(updateResult.connectionOptions.connectionString).to.equal(
            'mongodb+srv://a:b@cruiseship/?ssl=true'
          );
        });

        it('returns no errors', function () {
          expect(updateResult.errors?.length).to.equal(0);
        });
      });

      describe('setting standard with directConnection to srv', function () {
        const connectionStringUrl = new ConnectionStringUrl(
          'mongodb://outerspace:123/?directConnection=true'
        );

        let updateResult: ReturnType<typeof handleConnectionFormFieldUpdate>;
        beforeEach(function () {
          updateResult = handleConnectionFormFieldUpdate(
            {
              type: 'update-connection-scheme',
              isSrv: true,
            },
            {
              connectionString: connectionStringUrl.toString(),
            }
          );
        });

        it('removes the host on the connectionStringUrl', function () {
          expect(
            new ConnectionStringUrl(
              updateResult.connectionOptions.connectionString
            ).hosts
          ).to.deep.equal(['outerspace']);
        });

        it('updates the schema on the connectionStringUrl', function () {
          expect(
            new ConnectionStringUrl(
              updateResult.connectionOptions.connectionString
            ).isSRV
          ).to.equal(true);
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
          updateResult = handleConnectionFormFieldUpdate(
            {
              type: 'update-connection-scheme',
              isSrv: false,
            },
            {
              connectionString: connectionStringUrl.toString(),
            }
          );
        });

        it('updates the host on the connectionStringUrl', function () {
          expect(
            new ConnectionStringUrl(
              updateResult.connectionOptions.connectionString
            ).hosts
          ).to.deep.equal(['outerspace:27017']);
        });

        it('updates the schema on the connectionStringUrl', function () {
          expect(
            new ConnectionStringUrl(
              updateResult.connectionOptions.connectionString
            ).isSRV
          ).to.equal(false);
        });

        it('updates the connection string', function () {
          expect(updateResult.connectionOptions.connectionString).to.equal(
            'mongodb://aa:bb@outerspace:27017/?ssl=true'
          );
        });

        it('returns no errors', function () {
          expect(updateResult.errors?.length).to.equal(0);
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
        } = handleConnectionFormFieldUpdate(
          {
            type: 'update-ssh-options',
            key: 'host',
            value: 'localhost',
          },
          {
            connectionString: connectionStringUrl.toString(),
          }
        );

        expect(sshTunnel).to.not.be.undefined;
        expect(sshTunnel?.host).to.equal('localhost');
      });
    });

    describe('update-search-param action', function () {
      it('should handle update of search param value', function () {
        const connectionStringUrl = new ConnectionStringUrl(
          'mongodb://localhost:27019/'
        );
        const { connectionOptions } = handleConnectionFormFieldUpdate(
          {
            type: 'update-search-param',
            currentKey: 'w',
            value: 'localhost',
          },
          {
            connectionString: connectionStringUrl.toString(),
          }
        );
        expect(
          new ConnectionStringUrl(
            connectionOptions.connectionString
          ).searchParams.get('w')
        ).to.equal('localhost');
      });
      it('should handle update of search param key - with existing value', function () {
        const connectionStringUrl = new ConnectionStringUrl(
          'mongodb://localhost:27019/?w=w-value'
        );
        const { connectionOptions } = handleConnectionFormFieldUpdate(
          {
            type: 'update-search-param',
            currentKey: 'w',
            newKey: 'journal',
          },
          {
            connectionString: connectionStringUrl.toString(),
          }
        );
        expect(
          new ConnectionStringUrl(
            connectionOptions.connectionString
          ).searchParams.get('journal')
        ).to.equal('w-value');
        expect(
          new ConnectionStringUrl(
            connectionOptions.connectionString
          ).searchParams.get('w')
        ).to.not.be.true;
      });
      it('should handle update of search param key - with new value', function () {
        const connectionStringUrl = new ConnectionStringUrl(
          'mongodb://localhost:27019/w=w-value'
        );
        const { connectionOptions } = handleConnectionFormFieldUpdate(
          {
            type: 'update-search-param',
            currentKey: 'w',
            newKey: 'journal',
            value: 'j-value',
          },
          {
            connectionString: connectionStringUrl.toString(),
          }
        );
        expect(
          new ConnectionStringUrl(
            connectionOptions.connectionString
          ).searchParams.get('journal')
        ).to.equal('j-value');
      });
    });

    describe('delete-search-param action', function () {
      it('should handle delete of search param', function () {
        const connectionStringUrl = new ConnectionStringUrl(
          'mongodb://localhost:27019/?w=hello&journal=hi'
        );
        const { connectionOptions } = handleConnectionFormFieldUpdate(
          {
            type: 'delete-search-param',
            key: 'w',
          },
          {
            connectionString: connectionStringUrl.toString(),
          }
        );
        expect(
          new ConnectionStringUrl(
            connectionOptions.connectionString
          ).searchParams.get('w')
        ).to.not.be.true;
        expect(
          new ConnectionStringUrl(
            connectionOptions.connectionString
          ).searchParams.get('journal')
        ).to.equal('hi');
      });
    });

    describe('update-connection-path action', function () {
      it('should udpate connection path - to input value', function () {
        const connectionStringUrl = new ConnectionStringUrl(
          'mongodb://localhost:27019/admin'
        );
        const { connectionOptions } = handleConnectionFormFieldUpdate(
          {
            type: 'update-connection-path',
            value: 'awesome',
          },
          {
            connectionString: connectionStringUrl.toString(),
          }
        );
        expect(
          new ConnectionStringUrl(connectionOptions.connectionString).pathname
        ).to.equal('/awesome');
      });

      it('should udpate connection path - to empty value', function () {
        const connectionStringUrl = new ConnectionStringUrl(
          'mongodb://localhost:27019/admin'
        );
        const { connectionOptions } = handleConnectionFormFieldUpdate(
          {
            type: 'update-connection-path',
            value: '',
          },
          {
            connectionString: connectionStringUrl.toString(),
          }
        );
        expect(
          new ConnectionStringUrl(connectionOptions.connectionString).pathname
        ).to.equal('/');
      });
    });

    describe('update-username action', function () {
      it('should update the username', function () {
        const connectionStringUrl = new ConnectionStringUrl(
          'mongodb://localhost:27019'
        );
        const { connectionOptions } = handleConnectionFormFieldUpdate(
          {
            type: 'update-username',
            username: 'aa',
          },
          {
            connectionString: connectionStringUrl.toString(),
          }
        );
        expect(
          new ConnectionStringUrl(connectionOptions.connectionString).username
        ).to.equal('aa');
      });
    });

    describe('update-password action', function () {
      it('should update the password', function () {
        const connectionStringUrl = new ConnectionStringUrl(
          'mongodb://a123:b123@localhost:27019'
        );
        const { connectionOptions } = handleConnectionFormFieldUpdate(
          {
            type: 'update-password',
            password: 'a@!1()',
          },
          {
            connectionString: connectionStringUrl.toString(),
          }
        );
        expect(
          new ConnectionStringUrl(connectionOptions.connectionString).password
        ).to.equal('a%40!1()');
      });
    });

    describe('update-auth-mechanism action', function () {
      it('should update the username', function () {
        const connectionStringUrl = new ConnectionStringUrl(
          'mongodb://localhost:27019'
        );
        const { connectionOptions } = handleConnectionFormFieldUpdate(
          {
            type: 'update-auth-mechanism',
            authMechanism: 'PLAIN',
          },
          {
            connectionString: connectionStringUrl.toString(),
          }
        );
        expect(
          new ConnectionStringUrl(
            connectionOptions.connectionString
          ).searchParams.get('authMechanism')
        ).to.equal('PLAIN');
      });
    });
  });
});
