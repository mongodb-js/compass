import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';
import ConnectionStringUrl from 'mongodb-connection-string-url';
import { ConnectionOptions } from 'mongodb-data-service';

import SSHTunnelTab from './ssh-tunnel-tab';

describe('SSHTunnelTab', function () {
  let updateConnectionFormFieldSpy: sinon.SinonSpy;

  beforeEach(function () {
    const connectionStringUrl = new ConnectionStringUrl(
      'mongodb+srv://0ranges:p!neapp1es@localhost/?ssl=true'
    );

    updateConnectionFormFieldSpy = sinon.spy();

    render(
      <SSHTunnelTab
        errors={[]}
        connectionOptions={{} as ConnectionOptions}
        connectionStringUrl={connectionStringUrl}
        updateConnectionFormField={updateConnectionFormFieldSpy}
      />
    );
  });

  it('renders SSH none tab by default', function () {
    const noneTab = screen.getByTestId('none-tab-content');
    expect(noneTab).to.exist;
  });

  it('renders tab when selected', function () {
    ['none', 'password', 'identity'].forEach(function (type) {
      const tabButton = screen.getByTestId(`${type}-tab-button`);
      fireEvent.click(tabButton);
      const tabContent = screen.getByTestId(`${type}-tab-content`);
      expect(tabContent, `${type} tab should be selected`).to.exist;
    });
  });
});
