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
        hideError={(errorIndex: number) => {
          console.log(errorIndex);
        }}
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

  // eslint-disable-next-line mocha/no-setup-in-describe
  ['none', 'password', 'identity'].forEach(function (type) {
    it(`renders ${type} tab when selected`, function () {
      const tabButton = screen.getByTestId(`${type}-tab-button`);
      fireEvent.click(tabButton);
      const tabContent = screen.getByTestId(`${type}-tab-content`);
      expect(tabContent).to.exist;
    });
  });

  describe('calls updateConnectionFormField on password tab', function () {
    beforeEach(function () {
      const tabButton = screen.getByTestId('password-tab-button');
      fireEvent.click(tabButton);
    });

    // eslint-disable-next-line mocha/no-setup-in-describe
    [
      {
        key: 'host',
        value: 'host',
      },
      {
        key: 'port',
        value: 2222,
      },
      {
        key: 'username',
        value: 'username',
      },
      {
        key: 'password',
        value: 'password',
      },
    ].forEach(function ({ key, value }) {
      it(`when ${key} field on password form changes`, function () {
        fireEvent.change(screen.getByTestId(key), { target: { value } });
        expect(updateConnectionFormFieldSpy.args[0][0]).to.deep.equal({
          type: 'update-connection-options',
          currentTab: 'password',
          key,
          value,
        });
      });
    });
  });

  describe('calls updateConnectionFormField on identity tab', function () {
    beforeEach(function () {
      const tabButton = screen.getByTestId('identity-tab-button');
      fireEvent.click(tabButton);
    });

    // eslint-disable-next-line mocha/no-setup-in-describe
    [
      {
        key: 'host',
        value: 'host',
      },
      {
        key: 'port',
        value: 2222,
      },
      {
        key: 'username',
        value: 'username',
      },
      {
        key: 'identityKeyFile',
        value: 'passphrase file',
      },
      {
        key: 'identityKeyPassphrase',
        value: 'passphrase',
      },
    ].forEach(function ({ key, value }) {
      it(`when ${key} field on identity form changes`, function () {
        const target =
          key === 'identityKeyFile'
            ? {
                files: [
                  {
                    path: value,
                  },
                ],
              }
            : { value };
        fireEvent.change(screen.getByTestId(key), { target });
        expect(updateConnectionFormFieldSpy.args[0][0]).to.deep.equal({
          type: 'update-connection-options',
          currentTab: 'identity',
          key,
          value,
        });
      });
    });
  });
});
