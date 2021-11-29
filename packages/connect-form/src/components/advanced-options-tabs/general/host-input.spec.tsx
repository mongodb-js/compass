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

        expect(setConnectionFieldSpy.firstCall.args[0]).to.equal('hosts');
        expect(setConnectionFieldSpy.firstCall.args[1]).to.deep.equal({
          value: ['outerspace@'],
          error: "Invalid character in host: '@'",
          warning: null,
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

  // describe('adding a hso', function () {

  // });

  describe('connection string standard schema (mongodb://)', function () {
    // describe('with a single host', function () {
    //   it('')
    //   const connectionStringUrl = new ConnectionStringUrl(
    //     'mongodb+srv://0ranges:p!neapp1es@outerspace/?ssl=true'
    //   );
    //   const { hosts } =
    //     parseConnectFormFieldStateFromConnectionUrl(connectionStringUrl);
    //   render(
    //     <HostInput
    //       connectionStringUrl={connectionStringUrl}
    //       hosts={hosts}
    //       setConnectionField={setConnectionFieldSpy}
    //       setConnectionStringUrl={setConnectionStringUrlSpy}
    //     />
    //   );
    // });

    describe('with multiple hosts', function () {
      beforeEach(function () {
        const connectionStringUrl = new ConnectionStringUrl(
          'mongodb://0ranges:p!neapp1es@outerspace:27017,outerspace:27099,outerspace:27098,localhost:27098/?ssl=true'
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

        it('should call to update the connection string url', function () {
          expect(setConnectionStringUrlSpy.callCount).to.equal(1);
          expect(
            setConnectionStringUrlSpy.firstCall.args[0].toString()
          ).to.equal(
            'mongodb://0ranges:p!neapp1es@outerspace:27017,outerspace:27099,localhost:27098/?ssl=true'
          );
        });

        it('should not call to update the host fields', function () {
          expect(setConnectionFieldSpy.callCount).to.equal(0);
        });
      });
    });
  });

  // To test:

  // __Is not srv__
  // Render states:
  // - Host has error
  // - One host
  // - Many hosts
  // Change tests:
  // - Added host to not srv
  // - Remove host from not srv
  // - Changed host (somewhere in middle of many)
  // - Changed single host
  // - Change to something that gives error
  // - ',' written
  // - Empty host

  // Underlying connection changes (hosts or connection string)
  // - Update schema
  // - Update value of host(s)
});
