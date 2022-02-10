import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';
import ConnectionStringUrl from 'mongodb-connection-string-url';
import type { ConnectionOptions } from 'mongodb-data-service';

import ProxyAndSshTunnelTab from './proxy-and-ssh-tunnel-tab';
import type { ProxyOptions } from 'mongodb';

const renderWithOptionsAndUrl = (
  connectionOptions: ConnectionOptions,
  connectionStringUrl: ConnectionStringUrl,
  updateConnectionFormField: sinon.SinonSpy<any[], any>
) => {
  return render(
    <ProxyAndSshTunnelTab
      errors={[]}
      connectionOptions={connectionOptions}
      connectionStringUrl={connectionStringUrl}
      updateConnectionFormField={updateConnectionFormField}
    />
  );
};

const proxyOptions: NonNullable<keyof ProxyOptions>[] = [
  'proxyHost',
  'proxyPort',
  'proxyUsername',
  'proxyPassword',
];

describe('SSHTunnelTab', function () {
  let updateConnectionFormFieldSpy: sinon.SinonSpy;

  beforeEach(function () {
    const connectionStringUrl = new ConnectionStringUrl(
      'mongodb+srv://0ranges:p!neapp1es@localhost/?ssl=true'
    );

    updateConnectionFormFieldSpy = sinon.spy();

    renderWithOptionsAndUrl(
      {} as ConnectionOptions,
      connectionStringUrl,
      updateConnectionFormFieldSpy
    );
  });

  it('renders SSH none tab by default', function () {
    const noneTab = screen.getByTestId('none-tab-content');
    expect(noneTab).to.exist;
  });

  it('renders tab when selected', function () {
    ['none', 'ssh-password', 'ssh-identity'].forEach(function (type) {
      const tabButton = screen.getByTestId(`${type}-tab-button`);
      fireEvent.click(tabButton);
      const tabContent = screen.getByTestId(`${type}-tab-content`);
      expect(tabContent, `${type} tab should be selected`).to.exist;
    });
  });

  describe('renders tabs correctly', function () {
    let connectionStringUrl: ConnectionStringUrl;
    beforeEach(function () {
      updateConnectionFormFieldSpy = sinon.spy();
      connectionStringUrl = new ConnectionStringUrl(
        'mongodb+srv://0ranges:p!neapp1es@localhost/?ssl=true'
      );
      cleanup();
    });

    // eslint-disable-next-line mocha/no-setup-in-describe
    proxyOptions.forEach((proxyKey) => {
      it(`renders socks tab when any of socks option is selected - ${proxyKey}`, function () {
        connectionStringUrl.searchParams.set(proxyKey, 'random-value');
        renderWithOptionsAndUrl(
          {} as ConnectionOptions,
          connectionStringUrl,
          updateConnectionFormFieldSpy
        );
        expect(screen.getByTestId('socks-tab-content')).to.exist;
      });
    });

    // eslint-disable-next-line mocha/no-setup-in-describe
    ['identityKeyPassphrase', 'identityKeyFile'].forEach((identityOption) => {
      it(`renders identity tab when any of identity option is selected - ${identityOption}`, function () {
        const connectionOptions: ConnectionOptions = {
          sshTunnel: {
            host: '',
            port: 0,
            username: '',
            [identityOption]: 'some-value',
          },
          connectionString: connectionStringUrl.toString(),
        };
        renderWithOptionsAndUrl(
          connectionOptions,
          connectionStringUrl,
          updateConnectionFormFieldSpy
        );
        expect(screen.getByTestId('ssh-identity-tab-content')).to.exist;
      });
    });

    it('renders password tab when any of password option is selected', function () {
      const connectionOptions: ConnectionOptions = {
        sshTunnel: {
          host: '',
          port: 0,
          username: '',
          password: '***',
        },
        connectionString: connectionStringUrl.toString(),
      };
      renderWithOptionsAndUrl(
        connectionOptions,
        connectionStringUrl,
        updateConnectionFormFieldSpy
      );
      expect(screen.getByTestId('ssh-password-tab-content')).to.exist;
    });

    it('renders none tab when sshTunnel and proxy option is not defined', function () {
      const connectionOptions: ConnectionOptions = {
        sshTunnel: undefined,
        connectionString: connectionStringUrl.toString(),
      };
      proxyOptions.forEach((key) =>
        connectionStringUrl.searchParams.delete(key)
      );
      renderWithOptionsAndUrl(
        connectionOptions,
        connectionStringUrl,
        updateConnectionFormFieldSpy
      );
      expect(screen.getByTestId('none-tab-content')).to.exist;
    });

    it('renders none tab when sshTunnel has empty values and proxy option is not defined', function () {
      const connectionOptions: ConnectionOptions = {
        sshTunnel: {
          host: '',
          port: 0,
          username: '',
          identityKeyFile: '',
          identityKeyPassphrase: '',
          password: '',
        },
        connectionString: connectionStringUrl.toString(),
      };
      proxyOptions.forEach((key) =>
        connectionStringUrl.searchParams.delete(key)
      );
      renderWithOptionsAndUrl(
        connectionOptions,
        connectionStringUrl,
        updateConnectionFormFieldSpy
      );
      expect(screen.getByTestId('none-tab-content')).to.exist;
    });
  });

  describe('clears ssh/socks tunnel options as user switches between tabs', function () {
    let connectionStringUrl: ConnectionStringUrl;
    beforeEach(function () {
      updateConnectionFormFieldSpy = sinon.spy();
      connectionStringUrl = new ConnectionStringUrl(
        'mongodb+srv://0ranges:p!neapp1es@localhost/?ssl=true'
      );
      cleanup();
    });
    // eslint-disable-next-line mocha/no-setup-in-describe
    ['none', 'ssh-password', 'ssh-identity'].forEach((tab) => {
      it(`removes proxy options when user clicks ${tab} tab`, function () {
        connectionStringUrl.searchParams.set('proxyHost', 'hello');
        renderWithOptionsAndUrl(
          {} as ConnectionOptions,
          connectionStringUrl,
          updateConnectionFormFieldSpy
        );
        fireEvent.click(screen.getByTestId(`${tab}-tab-button`));
        expect(updateConnectionFormFieldSpy).to.have.been.called;
        expect(updateConnectionFormFieldSpy.args[0][0]).to.deep.equal({
          type: 'remove-proxy-options',
        });
      });
    });

    // eslint-disable-next-line mocha/no-setup-in-describe
    ['none', 'socks'].forEach((tab) => {
      it(`removes sshTunnel when user clicks ${tab} tab`, function () {
        renderWithOptionsAndUrl(
          {
            sshTunnel: {
              host: '',
              port: 22,
              username: '',
              password: '1234',
            },
          } as ConnectionOptions,
          connectionStringUrl,
          updateConnectionFormFieldSpy
        );
        fireEvent.click(screen.getByTestId(`${tab}-tab-button`));
        expect(updateConnectionFormFieldSpy).to.have.been.called;
        expect(updateConnectionFormFieldSpy.args[0][0]).to.deep.equal({
          type: 'remove-ssh-options',
        });
      });
    });

    it('removes proxyOptions when user navigates from socks tab to none', function () {
      connectionStringUrl.searchParams.set('proxyHost', 'hello');
      renderWithOptionsAndUrl(
        {} as ConnectionOptions,
        connectionStringUrl,
        updateConnectionFormFieldSpy
      );
      fireEvent.click(screen.getByTestId('none-tab-button'));
      expect(updateConnectionFormFieldSpy).to.have.been.calledOnce;
      expect(updateConnectionFormFieldSpy.args[0][0]).to.deep.equal({
        type: 'remove-proxy-options',
      });
    });

    it('removes sshTunnel options when user navigates from password tab to none', function () {
      renderWithOptionsAndUrl(
        {
          sshTunnel: {
            host: '',
            port: 22,
            username: '',
            password: '1234',
          },
        } as ConnectionOptions,
        connectionStringUrl,
        updateConnectionFormFieldSpy
      );
      fireEvent.click(screen.getByTestId('none-tab-button'));
      expect(updateConnectionFormFieldSpy).to.have.been.calledOnce;
      expect(updateConnectionFormFieldSpy.args[0][0]).to.deep.equal({
        type: 'remove-ssh-options',
      });
    });

    it('removes sshTunnel options when user navigates from identity tab to none', function () {
      renderWithOptionsAndUrl(
        {
          sshTunnel: {
            host: '',
            port: 22,
            username: '',
            identityKeyFile: '1234',
          },
        } as ConnectionOptions,
        connectionStringUrl,
        updateConnectionFormFieldSpy
      );
      fireEvent.click(screen.getByTestId('none-tab-button'));
      expect(updateConnectionFormFieldSpy).to.have.been.calledOnce;
      expect(updateConnectionFormFieldSpy.args[0][0]).to.deep.equal({
        type: 'remove-ssh-options',
      });
    });
  });
});
