import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';
import sinon from 'sinon';
import ConnectionStringUrl from 'mongodb-connection-string-url';

import HostInput from './host-input';
import { parseConnectFormFieldStateFromConnectionUrl } from '../../../hooks/use-connect-form';

describe('HostInput', function () {
  let setConnectionFieldSpy: sinon.SinonSpy;
  let setConnectionStringUrlSpy: sinon.SinonSpy;

  beforeEach(function () {
    setConnectionFieldSpy = sinon.spy();
    setConnectionStringUrlSpy = sinon.spy();
  });

  afterEach(cleanup);

  describe('connection string srv schema (mongodb+srv://)', function () {
    beforeEach(function () {
      const connectionStringUrl = new ConnectionStringUrl(
        'mongodb+srv://0ranges:p!neapp1es@outerspace/?ssl=true'
      );
      const { hosts } =
        parseConnectFormFieldStateFromConnectionUrl(connectionStringUrl);
      render(
        <HostInput
          connectionStringUrl={connectionStringUrl}
          hosts={hosts}
          setConnectionField={setConnectionFieldSpy}
          setConnectionStringUrl={setConnectionStringUrlSpy}
        />
      );
    });

    it('renders a host input', function () {
      expect(screen.getByRole('textbox')).to.exist;
    });

    it('renders the host value in the input', function () {
      expect(screen.getByRole('textbox').getAttribute('value')).to.equal(
        'outerspace'
      );
    });

    it('does not render a plus button to add more hosts', function () {
      expect(screen.queryByRole('button')).to.not.exist;
    });

    describe('when the host is updated', function () {
      beforeEach(function () {
        userEvent.tab();
        userEvent.keyboard('s');
      });

      it('should call to update the connection string url', function () {
        expect(setConnectionStringUrlSpy.callCount).to.equal(1);
        expect(setConnectionStringUrlSpy.firstCall.args[0].isSRV).to.equal(
          true
        );
        expect(setConnectionStringUrlSpy.firstCall.args[0].toString()).to.equal(
          'mongodb+srv://0ranges:p!neapp1es@outerspaces/?ssl=true'
        );
      });

      it('should not call to update the host fields (as they will be derived from the valid connection string)', function () {
        expect(setConnectionFieldSpy.callCount).to.equal(0);
      });
    });

    describe('when the host is updated to an invalid value', function () {
      beforeEach(function () {
        userEvent.tab();
        userEvent.keyboard('@');
      });

      it('should call to update the connection string url', function () {
        expect(setConnectionFieldSpy.callCount).to.equal(1);
        expect(setConnectionFieldSpy.firstCall.args[0]).to.deep.equal({
          type: 'set-connection-string-field',
          fieldName: 'hosts',
          value: {
            value: ['outerspace@'],
            error: "Invalid character in host: '@'",
          },
        });
      });

      it('should not call to update the connection string url', function () {
        expect(setConnectionStringUrlSpy.callCount).to.equal(0);
      });
    });
  });

  describe('when the host has an error', function () {
    beforeEach(function () {
      const connectionStringUrl = new ConnectionStringUrl(
        'mongodb://0ranges:p!neapp1es@outerspace:27017,outerspace:27099,outerspace:27098,localhost:27098/?ssl=true'
      );
      const { hosts } =
        parseConnectFormFieldStateFromConnectionUrl(connectionStringUrl);
      hosts.error = 'Eeeee!!!';
      render(
        <HostInput
          connectionStringUrl={connectionStringUrl}
          hosts={hosts}
          setConnectionField={setConnectionFieldSpy}
          setConnectionStringUrl={setConnectionStringUrlSpy}
        />
      );
    });

    it('renders the error', function () {
      expect(screen.getByText('Eeeee!!!')).to.be.visible;
    });
  });

  describe('connection string standard schema (mongodb://)', function () {
    describe('with a single host', function () {
      beforeEach(function () {
        const connectionStringUrl = new ConnectionStringUrl(
          'mongodb://0ranges:p!neapp1es@outerspace:27019/?ssl=true'
        );
        const { hosts } =
          parseConnectFormFieldStateFromConnectionUrl(connectionStringUrl);
        render(
          <HostInput
            connectionStringUrl={connectionStringUrl}
            hosts={hosts}
            setConnectionField={setConnectionFieldSpy}
            setConnectionStringUrl={setConnectionStringUrlSpy}
          />
        );
      });

      it('does not render the remove host', function () {
        expect(screen.queryByLabelText('Remove host')).to.not.exist;
      });

      describe('when the host is changed', function () {
        beforeEach(function () {
          const hostInput = screen.getByRole('textbox');
          userEvent.click(hostInput);
          userEvent.keyboard('7');
        });

        it('should call to update the connection string url with the updated host', function () {
          expect(setConnectionStringUrlSpy.callCount).to.equal(1);
          expect(
            setConnectionStringUrlSpy.firstCall.args[0].toString()
          ).to.equal(
            'mongodb://0ranges:p!neapp1es@outerspace:270197/?ssl=true'
          );
        });

        it('should not call to update the host fields', function () {
          expect(setConnectionFieldSpy.callCount).to.equal(0);
        });
      });
    });

    describe('with multiple hosts', function () {
      beforeEach(function () {
        const connectionStringUrl = new ConnectionStringUrl(
          'mongodb://0ranges:p!neapp1es@outerspace:27017,outerspace:27098,outerspace:27099,localhost:27098/?ssl=true'
        );
        const { hosts } =
          parseConnectFormFieldStateFromConnectionUrl(connectionStringUrl);
        render(
          <HostInput
            connectionStringUrl={connectionStringUrl}
            hosts={hosts}
            setConnectionField={setConnectionFieldSpy}
            setConnectionStringUrl={setConnectionStringUrlSpy}
          />
        );
      });

      it('renders inputs for all of the hosts', function () {
        expect(screen.getAllByRole('textbox').length).to.equal(4);
      });

      describe('when the remove host button is clicked', function () {
        beforeEach(function () {
          const removeHostButton = screen.getAllByLabelText('Remove host')[2];
          fireEvent.click(removeHostButton);
        });

        it('should call to update the connection string url without the host', function () {
          expect(setConnectionStringUrlSpy.callCount).to.equal(1);
          expect(
            setConnectionStringUrlSpy.firstCall.args[0].toString()
          ).to.equal(
            'mongodb://0ranges:p!neapp1es@outerspace:27017,outerspace:27098,localhost:27098/?ssl=true'
          );
        });

        it('should not call to update the host fields', function () {
          expect(setConnectionFieldSpy.callCount).to.equal(0);
        });
      });

      describe('when the add host button is clicked', function () {
        beforeEach(function () {
          const addHostButton = screen.getAllByLabelText('Add new host')[2];
          fireEvent.click(addHostButton);
        });

        it('should call to update the connection string url with a new host at the location', function () {
          expect(setConnectionStringUrlSpy.callCount).to.equal(1);
          expect(
            setConnectionStringUrlSpy.firstCall.args[0].toString()
          ).to.equal(
            'mongodb://0ranges:p!neapp1es@outerspace:27017,outerspace:27098,outerspace:27099,outerspace:27100,localhost:27098/?ssl=true'
          );
        });

        it('should not call to update the host fields', function () {
          expect(setConnectionFieldSpy.callCount).to.equal(0);
        });
      });

      describe('when a host is changed', function () {
        beforeEach(function () {
          const hostInput = screen.getAllByRole('textbox')[2];
          userEvent.click(hostInput);
          userEvent.keyboard('8');
        });

        it('should call to update the connection string url with the updated host', function () {
          expect(setConnectionStringUrlSpy.callCount).to.equal(1);
          expect(
            setConnectionStringUrlSpy.firstCall.args[0].toString()
          ).to.equal(
            'mongodb://0ranges:p!neapp1es@outerspace:27017,outerspace:27098,outerspace:270998,localhost:27098/?ssl=true'
          );
        });

        it('should not call to update the host fields', function () {
          expect(setConnectionFieldSpy.callCount).to.equal(0);
        });
      });

      describe('when a host is changed to an invalid value', function () {
        beforeEach(function () {
          const hostInput = screen.getAllByRole('textbox')[1];
          userEvent.click(hostInput);
          userEvent.keyboard('@');
        });

        it('should not call to update the connection string url', function () {
          expect(setConnectionStringUrlSpy.callCount).to.equal(0);
        });

        it('should update the host fields with the invalid value and an error', function () {
          expect(setConnectionFieldSpy.callCount).to.equal(1);
          expect(setConnectionFieldSpy.firstCall.args[0]).to.deep.equal({
            type: 'set-connection-string-field',
            fieldName: 'hosts',
            value: {
              value: [
                'outerspace:27017',
                'outerspace:27098@',
                'outerspace:27099',
                'localhost:27098',
              ],
              error: "Invalid character in host: '@'",
            },
          });
        });
      });
    });

    describe('when a host is removed to only have one host with an empty value', function () {
      beforeEach(function () {
        const connectionStringUrl = new ConnectionStringUrl(
          'mongodb://0ranges:p!neapp1es@,outerspace:27098/?ssl=true'
        );
        const { hosts } =
          parseConnectFormFieldStateFromConnectionUrl(connectionStringUrl);
        render(
          <HostInput
            connectionStringUrl={connectionStringUrl}
            hosts={hosts}
            setConnectionField={setConnectionFieldSpy}
            setConnectionStringUrl={setConnectionStringUrlSpy}
          />
        );

        const removeHostButton = screen.getAllByLabelText('Remove host')[1];
        fireEvent.click(removeHostButton);
      });

      it('should call to update the connection string url with a default host', function () {
        expect(setConnectionStringUrlSpy.callCount).to.equal(1);
        expect(setConnectionStringUrlSpy.firstCall.args[0].toString()).to.equal(
          'mongodb://0ranges:p!neapp1es@localhost:27017/?ssl=true'
        );
      });

      it('should not call to update the host fields', function () {
        expect(setConnectionFieldSpy.callCount).to.equal(0);
      });
    });

    describe('when editing a host to an empty value', function () {
      beforeEach(function () {
        const connectionStringUrl = new ConnectionStringUrl(
          'mongodb://0ranges:p!neapp1es@a/?ssl=true'
        );
        const { hosts } =
          parseConnectFormFieldStateFromConnectionUrl(connectionStringUrl);
        render(
          <HostInput
            connectionStringUrl={connectionStringUrl}
            hosts={hosts}
            setConnectionField={setConnectionFieldSpy}
            setConnectionStringUrl={setConnectionStringUrlSpy}
          />
        );

        const removeHostButton = screen.getByRole('textbox');
        userEvent.click(removeHostButton);
        userEvent.keyboard('{backspace}');
      });

      it('should not call to update the connection string url', function () {
        expect(setConnectionStringUrlSpy.callCount).to.equal(0);
      });

      it('should update the host fields with the invalid value and an error', function () {
        expect(setConnectionFieldSpy.callCount).to.equal(1);
        expect(setConnectionFieldSpy.firstCall.args[0]).to.deep.equal({
          type: 'set-connection-string-field',
          fieldName: 'hosts',
          value: {
            value: [''],
            error:
              'Invalid URL: mongodb://__this_is_a_placeholder__@/?ssl=true',
          },
        });
      });
    });
  });

  describe('when the host fields and connection string differ', function () {
    beforeEach(function () {
      const connectionStringUrl = new ConnectionStringUrl(
        'mongodb://0ranges:p!neapp1es@a/?ssl=true'
      );
      render(
        <HostInput
          connectionStringUrl={connectionStringUrl}
          hosts={{
            value: ['1', '2'],
            error: null,
          }}
          setConnectionField={setConnectionFieldSpy}
          setConnectionStringUrl={setConnectionStringUrlSpy}
        />
      );
    });

    it('should render the host in the fields', function () {
      expect(screen.getAllByRole('textbox').length).to.equal(2);
    });
  });

  describe('when a host is added when directConnection = true', function () {
    beforeEach(function () {
      const connectionStringUrl = new ConnectionStringUrl(
        'mongodb://0ranges:p!neapp1es@outerspace:27777/?ssl=true&directConnection=true'
      );
      const { hosts } =
        parseConnectFormFieldStateFromConnectionUrl(connectionStringUrl);
      render(
        <HostInput
          connectionStringUrl={connectionStringUrl}
          hosts={hosts}
          setConnectionField={setConnectionFieldSpy}
          setConnectionStringUrl={setConnectionStringUrlSpy}
        />
      );

      const addHostButton = screen.getByLabelText('Add new host');
      fireEvent.click(addHostButton);
    });

    it('the updated connection string should not have directConnection set', function () {
      expect(
        setConnectionStringUrlSpy.firstCall.args[0].searchParams.get(
          'directConnection'
        )
      ).to.equal(null);
    });

    it('should call to update the connection string url with a new host', function () {
      expect(setConnectionStringUrlSpy.callCount).to.equal(1);
      expect(setConnectionStringUrlSpy.firstCall.args[0].toString()).to.equal(
        'mongodb://0ranges:p!neapp1es@outerspace:27777,outerspace:27778/?ssl=true'
      );
    });

    it('should not call to update the host fields', function () {
      expect(setConnectionFieldSpy.callCount).to.equal(0);
    });
  });
});
