import React from 'react';
import {
  cleanup,
  render,
  screen,
  within,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import { ProxySettingsCustom } from './proxy-settings-custom';
import type { DevtoolsProxyOptions } from 'compass-preferences-model';
import sinon from 'sinon';

describe('ProxySettingsCustom', function () {
  let container: HTMLElement;
  let proxyOptions: DevtoolsProxyOptions;
  let setProxyOptions: sinon.SinonStub;

  let urlTextbox: HTMLElement;
  let usernameTextbox: HTMLElement;
  let passwordTextbox: HTMLElement;

  beforeEach(function () {
    proxyOptions = {};
    setProxyOptions = sinon
      .stub()
      .callsFake((arg: DevtoolsProxyOptions) => (proxyOptions = arg));
    const component = () => (
      <ProxySettingsCustom
        proxyOptions={proxyOptions}
        setProxyOptions={setProxyOptions}
        disabled={false}
      />
    );
    render(component());
    container = screen.getByTestId('proxy-settings-custom');
    urlTextbox = within(container).getByTestId('proxy-url');
    usernameTextbox = within(container).getByTestId('proxy-username');
    passwordTextbox = within(container).getByTestId('proxy-password');
  });

  afterEach(function () {
    cleanup();
  });

  it('can set a value for the proxy URL', function () {
    userEvent.type(urlTextbox, 'http://example.com');
    expect(proxyOptions).to.deep.equal({ proxy: 'http://example.com/' });
    expect(urlTextbox).to.have.attribute('aria-invalid', 'false');
  });

  it('will display a warning when the URL is invalid', function () {
    userEvent.type(urlTextbox, 'http://');
    expect(proxyOptions).to.deep.equal({});
    expect(urlTextbox).to.have.attribute('aria-invalid', 'true');
  });

  it('will fill username and password fields from url', function () {
    userEvent.type(urlTextbox, 'http://username:p4ssw0rd@example.com');
    expect(proxyOptions).to.deep.equal({
      proxy: 'http://username:p4ssw0rd@example.com/',
    });
    expect(urlTextbox).to.have.attribute('aria-invalid', 'false');
    expect(usernameTextbox).to.have.value('username');
    expect(passwordTextbox).to.have.value('p4ssw0rd');
  });

  it('will add username and password fields from fields to url, but not in the UI', function () {
    userEvent.type(urlTextbox, 'http://example.com');
    expect(proxyOptions).to.deep.equal({ proxy: 'http://example.com/' });
    userEvent.type(usernameTextbox, 'username');
    userEvent.type(passwordTextbox, 'p4ssw0rd');
    expect(proxyOptions).to.deep.equal({
      proxy: 'http://username:p4ssw0rd@example.com/',
    });
    expect(urlTextbox).to.have.attribute('aria-invalid', 'false');
    expect(urlTextbox).to.have.value('http://example.com/');
    expect(usernameTextbox).to.have.value('username');
    expect(passwordTextbox).to.have.value('p4ssw0rd');
  });

  it('will overwrite username and password if the url starts to contain one', function () {
    userEvent.type(urlTextbox, 'http://example.com');
    expect(proxyOptions).to.deep.equal({ proxy: 'http://example.com/' });
    userEvent.type(usernameTextbox, 'username');
    userEvent.type(passwordTextbox, 'p4ssw0rd');
    userEvent.clear(urlTextbox);
    userEvent.type(urlTextbox, 'http://foo:bar@otherhost.example.com');
    expect(proxyOptions).to.deep.equal({
      proxy: 'http://foo:bar@otherhost.example.com/',
    });
    expect(urlTextbox).to.have.attribute('aria-invalid', 'false');
    expect(urlTextbox).to.have.value('http://foo:bar@otherhost.example.com');
    expect(usernameTextbox).to.have.value('foo');
    expect(passwordTextbox).to.have.value('bar');
  });
});
