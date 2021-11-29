import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
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
        'mongodb+srv://outerspace/?ssl=true'
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

    // To test:
    // - Update host
    // - Change character to invalid value
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

  // describe('connection string standard schema (mongodb://)', function () {

  // });

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
