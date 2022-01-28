import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';

import AdvancedOptionsTabs from './advanced-options-tabs';

const testUrl = 'mongodb+srv://0ranges:p!neapp1es@localhost/?ssl=true';

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
        warnings={[]}
        updateConnectionFormField={updateConnectionFormFieldSpy}
      />
    );

    [
      'General',
      'Authentication',
      'TLS/SSL',
      'Proxy/SSH Tunnel',
      'Advanced',
    ].forEach((tabName) => {
      expect(screen.getByText(tabName)).to.be.visible;
    });
  });

  it('should have only the tab with an error on it showing an error', function () {
    render(
      <AdvancedOptionsTabs
        connectionOptions={{
          connectionString: testUrl,
        }}
        errors={[
          {
            fieldTab: 'Advanced',
            message: 'oranges',
          },
        ]}
        warnings={[
          {
            message: 'pineapple',
          },
        ]}
        updateConnectionFormField={updateConnectionFormFieldSpy}
      />
    );

    ['General', 'Authentication', 'TLS/SSL', 'Proxy/SSH Tunnel'].forEach(
      (tabName) => {
        expect(screen.queryByTestId(`${tabName}-tab-has-error`)).to.not.exist;
      }
    );
    expect(screen.getAllByTestId('Advanced-tab-has-error')[0]).to.be.visible;
  });

  it('the tab with a warning should have the warning test id (and hopefully the visual indicator)', function () {
    render(
      <AdvancedOptionsTabs
        connectionOptions={{
          connectionString: testUrl,
        }}
        errors={[]}
        warnings={[
          {
            fieldTab: 'Authentication',
            message: 'pineapple',
          },
        ]}
        updateConnectionFormField={updateConnectionFormFieldSpy}
      />
    );

    ['General', 'TLS/SSL', 'Proxy/SSH Tunnel', 'Advanced'].forEach(
      (tabName) => {
        expect(screen.queryByTestId(`${tabName}-tab-has-warning`)).to.not.exist;
      }
    );
    expect(screen.getAllByTestId('Authentication-tab-has-warning')[0]).to.be
      .visible;
  });
});
