import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';

import AdvancedOptionsTabs from './advanced-options-tabs';
import { ConnectionFormPreferencesContext } from '../../hooks/use-connect-form-preferences';

const testUrl = 'mongodb+srv://0ranges:p!neapp1es@localhost/?ssl=true';

const tabs = [
  { name: 'General', id: 'general' },
  {
    name: 'Authentication',
    id: 'authentication',
  },
  { name: 'TLS/SSL', id: 'tls' },
  { name: 'Proxy/SSH', id: 'proxy' },
  { name: 'In-Use Encryption', id: 'csfle' },
  { name: 'Advanced', id: 'advanced' },
];

describe('AdvancedOptionsTabs Component', function () {
  let updateConnectionFormFieldSpy: sinon.SinonSpy;

  beforeEach(function () {
    updateConnectionFormFieldSpy = sinon.spy();
  });

  afterEach(cleanup);

  it('should render all of the tabs', function () {
    render(
      <AdvancedOptionsTabs
        connectionOptions={{
          connectionString: testUrl,
        }}
        errors={[]}
        updateConnectionFormField={updateConnectionFormFieldSpy}
      />
    );

    tabs.forEach((tab) => {
      expect(screen.getByText(tab.name)).to.be.visible;
    });
  });

  it('should have the tab with an error have the error', function () {
    render(
      <AdvancedOptionsTabs
        connectionOptions={{
          connectionString: testUrl,
        }}
        errors={[
          {
            fieldTab: 'advanced',
            fieldName: 'connectionString',
            message: 'oranges',
          },
        ]}
        updateConnectionFormField={updateConnectionFormFieldSpy}
      />
    );

    tabs
      .filter(({ id }) => id !== 'advanced')
      .forEach(({ id }) => {
        const tab = screen.getAllByTestId(`connection-${id}-tab`)[0];
        expect(tab.getAttribute('data-has-error')).to.equal('false');
      });
    expect(
      screen
        .getAllByTestId('connection-advanced-tab')[0]
        .getAttribute('data-has-error')
    ).to.equal('true');
  });

  it('should have an aria-label for the tab that shows the error count', function () {
    render(
      <AdvancedOptionsTabs
        connectionOptions={{
          connectionString: testUrl,
        }}
        errors={[
          {
            fieldTab: 'tls',
            fieldName: 'tls',
            message: 'oranges',
          },
          {
            fieldTab: 'tls',
            fieldName: 'tlsCertificateKeyFile',
            message: 'peaches',
          },
        ]}
        updateConnectionFormField={updateConnectionFormFieldSpy}
      />
    );

    tabs
      .filter(({ id }) => id !== 'tls')
      .forEach(({ id, name }) => {
        const tab = screen.getAllByTestId(`connection-${id}-tab`)[0];
        expect(tab.getAttribute('aria-label')).to.equal(name);
      });
    expect(
      screen.getAllByTestId('connection-tls-tab')[0].getAttribute('aria-label')
    ).to.equal('TLS/SSL (2 errors)');
  });

  it('should not render CSFLE when its set to false in the preferences', function () {
    render(
      <ConnectionFormPreferencesContext.Provider value={{ showCSFLE: false }}>
        <AdvancedOptionsTabs
          connectionOptions={{
            connectionString: testUrl,
          }}
          errors={[]}
          updateConnectionFormField={updateConnectionFormFieldSpy}
        />
      </ConnectionFormPreferencesContext.Provider>
    );

    const csfleTabName = tabs.find((tab) => tab.id === 'csfle')?.name;
    expect(csfleTabName).to.not.be.undefined;
    expect(screen.queryByText(csfleTabName as string)).to.not.exist;
  });
});
