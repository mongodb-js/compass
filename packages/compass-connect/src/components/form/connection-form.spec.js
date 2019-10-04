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
  context('when active tab is Hostname', () => {
    context('when connection string was not changed', () => {
      const appRegistry = new AppRegistry();
      const connection = {
        authStrategy: 'MONGODB',
        isSrvRecord: false,
        readPreference: 'primaryPreferred',
        attributes: { hostanme: 'localhost' }
      };
      const isHostChanged = false;
      const isPortChanged = false;
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
          <ConnectionForm
            currentConnection={connection}
            isHostChanged={isHostChanged}
            isPortChanged={isPortChanged}
            isValid />
        );
      });

      afterEach(() => {
        component = null;
      });

      it('renders empry host input', () => {
        const hostInput = component.find('HostInput');

        expect(hostInput).to.be.present();
        expect(hostInput.prop('hostname')).to.equal(undefined);
        expect(hostInput.prop('isHostChanged')).to.equal(false);
      });

      it('renders empry port input', () => {
        const portInput = component.find('PortInput');

        expect(portInput).to.be.present();
        expect(portInput.prop('port')).to.equal(undefined);
        expect(portInput.prop('isPortChanged')).to.equal(false);
      });

      it('renders SRV input with false value', () => {
        const srvInput = component.find('SRVInput');

        expect(srvInput).to.be.present();
        expect(srvInput.prop('isSrvRecord')).to.equal(false);
      });

      it('renders authentication section', () => {
        const authentication = component.find('Authentication');

        expect(authentication).to.be.present();
        expect(authentication.prop('currentConnection')).to.deep.equal(connection);
        expect(authentication.prop('isValid')).to.equal(true);
      });
    });

    context('when SRV input was toggled', () => {
      const appRegistry = new AppRegistry();
      const connection = {
        authStrategy: 'MONGODB',
        isSrvRecord: true,
        readPreference: 'primaryPreferred',
        attributes: { hostanme: 'localhost' }
      };
      const isHostChanged = true;
      const isPortChanged = true;
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
          <ConnectionForm
            currentConnection={connection}
            isHostChanged={isHostChanged}
            isPortChanged={isPortChanged}
            isValid />
        );
      });

      afterEach(() => {
        component = null;
      });

      it('renders empry host input', () => {
        expect(component.find('HostInput').prop('isHostChanged')).to.equal(true);
      });

      it('renders empry port input', () => {
        expect(component.find('PortInput')).to.be.not.present();
      });

      it('renders SRV input with true value', () => {
        const srvInput = component.find('SRVInput');

        expect(srvInput).to.be.present();
        expect(srvInput.prop('isSrvRecord')).to.equal(true);
      });
    });
  });

  context('when active tab is More Options', () => {
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
      expect(component.find('ReplicaSetInput')).to.be.present();
    });

    it('renders read preference select', () => {
      expect(component.find('ReadPreferenceSelect')).to.be.present();
    });

    it('renders SSLMethod input', () => {
      expect(component.find('SSLMethod')).to.be.present();
    });

    it('renders SSHTunnel input', () => {
      expect(component.find('SSHTunnel')).to.be.present();
    });

    it('renders form actions', () => {
      expect(component.find('FormActions')).to.be.present();
    });
  });
});
