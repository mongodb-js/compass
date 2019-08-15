import React from 'react';
import { mount } from 'enzyme';
import AppRegistry from 'hadron-app-registry';
import hadronApp from 'hadron-app';
import ConnectionForm from './connection-form';

class TestComponent extends React.Component {
  render() {
    return (<div id="TestComponent" />);
  }
}

describe('ConnectionForm [Component]', () => {
  context('tab is Hostname', () => {
    const appRegistry = new AppRegistry();
    const connection = {
      authStrategy: 'MONGODB',
      isSrvRecord: false,
      readPreference: 'primaryPreferred',
      attributes: { hostanme: 'localhost' }
    };
    const AUTH_ROLE = {
      name: 'MONGODB',
      component: TestComponent,
      selectOption: { 'MONGODB': 'Username / Password' }
    };
    let component;

    before(() => {
      global.hadronApp = hadronApp;
      global.hadronApp.appRegistry = appRegistry;
      global.hadronApp.appRegistry.registerRole('Connect.AuthStrategy', AUTH_ROLE);
    });

    after(() => {
      global.hadronApp.appRegistry.deregisterRole('Connect.AuthStrategy', AUTH_ROLE);
    });

    beforeEach(() => {
      component = mount(
        <ConnectionForm currentConnection={connection} isValid />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('renders host input', () => {
      const hostInput = component.find('HostInput');

      expect(hostInput).to.be.present();
    });

    it('renders SRV input', () => {
      const hostInput = component.find('SRVInput');

      expect(hostInput).to.be.present();
    });

    it('renders authentication section', () => {
      const hostInput = component.find('Authentication');

      expect(hostInput).to.be.present();
    });
  });

  context('tab is More Options', () => {
    const appRegistry = new AppRegistry();
    const connection = {
      authStrategy: 'MONGODB',
      isSrvRecord: false,
      readPreference: 'primaryPreferred',
      attributes: { hostanme: 'localhost' },
      sslMethod: 'SYSTEMCA',
      sshTunnel: 'SERVER',
      replicaSet: 'myrs'
    };
    const AUTH_ROLE = {
      name: 'MONGODB',
      component: TestComponent,
      selectOption: { 'MONGODB': 'Username / Password' }
    };
    const SYSTEM_CA_SSL_ROLE = {
      name: 'SYSTEMCA',
      selectOption: { SYSTEMCA: 'System CA / Atlas Deployment' }
    };
    const SERVER_VALIDATION_SSL_ROLE = {
      name: 'SERVER',
      selectOption: { SERVER: 'Server Validation' },
      component: TestComponent
    };
    let component;

    before(() => {
      global.hadronApp = hadronApp;
      global.hadronApp.appRegistry = appRegistry;
      global.hadronApp.appRegistry.registerRole('Connect.AuthStrategy', AUTH_ROLE);
      global.hadronApp.appRegistry.registerRole('Connect.SSLMethod', SYSTEM_CA_SSL_ROLE);
      global.hadronApp.appRegistry.registerRole('Connect.SSHTunnel', SERVER_VALIDATION_SSL_ROLE);
    });

    after(() => {
      global.hadronApp.appRegistry.deregisterRole('Connect.AuthStrategy', AUTH_ROLE);
      global.hadronApp.appRegistry.deregisterRole('Connect.SSLMethod', SYSTEM_CA_SSL_ROLE);
      global.hadronApp.appRegistry.deregisterRole('Connect.SSHTunnel', SERVER_VALIDATION_SSL_ROLE);
    });

    beforeEach(() => {
      component = mount(
        <ConnectionForm currentConnection={connection} isValid />
      );
      component.setState({ activeTab: 1 });
    });

    afterEach(() => {
      component = null;
    });

    it('renders replica set input', () => {
      const hostInput = component.find('ReplicaSetInput');

      expect(hostInput).to.be.present();
    });

    it('renders read preference select', () => {
      const hostInput = component.find('ReadPreferenceSelect');

      expect(hostInput).to.be.present();
    });

    it('renders SSLMethod input', () => {
      const hostInput = component.find('SSLMethod');

      expect(hostInput).to.be.present();
    });

    it('renders SSHTunnel input', () => {
      const hostInput = component.find('SSHTunnel');

      expect(hostInput).to.be.present();
    });

    it('renders form actions', () => {
      const hostInput = component.find('FormActions');

      expect(hostInput).to.be.present();
    });
  });
});
