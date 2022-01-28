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

  it('should have the tab with an error have the error', function () {
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
        updateConnectionFormField={updateConnectionFormFieldSpy}
      />
    );

    ['General', 'Authentication', 'TLS/SSL', 'Proxy/SSH Tunnel'].forEach(
      (tabName) => {
        expect(
          screen
            .getAllByTestId(`${tabName}-tab`)[0]
            .getAttribute('data-has-error')
        ).to.equal('false');
      }
    );
    expect(
      screen.getAllByTestId('Advanced-tab')[0].getAttribute('data-has-error')
    ).to.equal('true');
  });
});
