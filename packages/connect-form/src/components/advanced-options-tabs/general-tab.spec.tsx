import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';
import ConnectionStringUrl from 'mongodb-connection-string-url';

import GeneralTab from './general-tab';
import { parseConnectFormFieldStateFromConnectionUrl } from '../../hooks/use-connect-form';

describe('GeneralTab', function () {
  let setConnectionFieldSpy: sinon.SinonSpy;
  let setConnectionStringUrlSpy: sinon.SinonSpy;

  beforeEach(function () {
    setConnectionFieldSpy = sinon.spy();
    setConnectionStringUrlSpy = sinon.spy();
  });

  afterEach(cleanup);

  describe('with a srv connection string schema (mongodb+srv://)', function () {
    beforeEach(function () {
      const connectionStringUrl = new ConnectionStringUrl(
        'mongodb+srv://0ranges:p!neapp1es@localhost/?ssl=true'
      );
      const fields =
        parseConnectFormFieldStateFromConnectionUrl(connectionStringUrl);
      render(
        <GeneralTab
          connectionStringUrl={connectionStringUrl}
          fields={fields}
          setConnectionField={setConnectionFieldSpy}
          setConnectionStringUrl={setConnectionStringUrlSpy}
        />
      );
    });

    it('should not render the direct connection input', function () {
      expect(screen.queryByText('Direct Connection')).to.not.exist;
    });

    it('should render the schema input', function () {
      expect(screen.getByText('Schema')).to.be.visible;
    });

    it('should render the hostname input', function () {
      expect(screen.getByText('Hostname')).to.be.visible;
    });
  });

  describe('with a standard connection string schema (mongodb://) with one host', function () {
    beforeEach(function () {
      const connectionStringUrl = new ConnectionStringUrl(
        'mongodb://0ranges:p!neapp1es@localhost:27107/?ssl=true'
      );
      const fields =
        parseConnectFormFieldStateFromConnectionUrl(connectionStringUrl);
      render(
        <GeneralTab
          connectionStringUrl={connectionStringUrl}
          fields={fields}
          setConnectionField={setConnectionFieldSpy}
          setConnectionStringUrl={setConnectionStringUrlSpy}
        />
      );
    });

    it('should render the direct connection input', function () {
      expect(screen.getByText('Direct Connection')).to.be.visible;
    });
  });

  describe('with a standard connection string schema (mongodb://) with multiple hosts', function () {
    beforeEach(function () {
      const connectionStringUrl = new ConnectionStringUrl(
        'mongodb://0ranges:p!neapp1es@localhost:27017,localhost:27019/?ssl=true'
      );
      const fields =
        parseConnectFormFieldStateFromConnectionUrl(connectionStringUrl);
      render(
        <GeneralTab
          connectionStringUrl={connectionStringUrl}
          fields={fields}
          setConnectionField={setConnectionFieldSpy}
          setConnectionStringUrl={setConnectionStringUrlSpy}
        />
      );
    });

    it('should not render the direct connection input', function () {
      expect(screen.queryByText('Direct Connection')).to.not.exist;
    });
  });

  describe('standard schema (mongodb://) with multiple hosts and directConnection=true', function () {
    beforeEach(function () {
      const connectionStringUrl = new ConnectionStringUrl(
        'mongodb://0ranges:p!neapp1es@localhost:27017,localhost:27019/?ssl=true&directConnection=true'
      );
      const fields =
        parseConnectFormFieldStateFromConnectionUrl(connectionStringUrl);
      render(
        <GeneralTab
          connectionStringUrl={connectionStringUrl}
          fields={fields}
          setConnectionField={setConnectionFieldSpy}
          setConnectionStringUrl={setConnectionStringUrlSpy}
        />
      );
    });

    it('should not render the direct connection input', function () {
      expect(screen.queryByText('Direct Connection')).to.be.visible;
    });
  });
});
