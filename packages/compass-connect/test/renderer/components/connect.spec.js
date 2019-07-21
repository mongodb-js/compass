import React from 'react';
import { shallow } from 'enzyme';
import Connection, { ConnectionCollection } from 'mongodb-connection-model';
import Connect from 'components/connect';
import AppRegistry from 'hadron-app-registry';
import hadronApp from 'hadron-app';

import styles from '../../../src/components/connect.less';

describe('Connect [Component]', () => {
  const connection = new Connection();
  const connections = new ConnectionCollection();
  const appRegistry = new AppRegistry();

  class StatusPlugin extends React.Component {
    render() {
      return (<div id="statusPlugin">Status</div>);
    }
  }

  const ROLE = {
    name: 'Status',
    component: StatusPlugin
  };

  context('when no error is present', () => {
    context('when the app is not connected', () => {
      let component;

      beforeEach(() => {
        component = shallow(
          <Connect currentConnection={connection} connections={connections} />
        );
      });

      afterEach(() => {
        component = null;
      });

      before(() => {
        global.hadronApp = hadronApp;
        global.hadronApp.appRegistry = appRegistry;
        global.hadronApp.appRegistry.registerRole('Application.Status', ROLE);
      });

      it('renders the container', () => {
        expect(component.find(`.${styles.connect}`)).to.exist;
      });

      it('renders the header', () => {
        expect(component.find('h2').text()).to.be.equal('Connect to Host');
      });

      it('renders the form container', () => {
        expect(component.find(`.${styles['form-container']}`)).to.exist;
      });
    });

    context('when the app is connected', () => {
      let component;

      beforeEach(() => {
        component = shallow(
          <Connect
            currentConnection={connection}
            connections={connections}
            isConnected />
        );
      });

      afterEach(() => {
        component = null;
      });

      before(() => {
        global.hadronApp = hadronApp;
        global.hadronApp.appRegistry = appRegistry;
        global.hadronApp.appRegistry.registerRole('Application.Status', ROLE);
      });

      it('renders the success header', () => {
        expect(component.find('.success')).to.exist;
      });
    });
  });

  context('when an error is present', () => {
    let component;

    beforeEach(() => {
      component = shallow(
        <Connect
          currentConnection={connection}
          connections={connections}
          errorMessage="Error message" />
      );
    });

    afterEach(() => {
      component = null;
    });

    before(() => {
      global.hadronApp = hadronApp;
      global.hadronApp.appRegistry = appRegistry;
      global.hadronApp.appRegistry.registerRole('Application.Status', ROLE);
    });

    it('renders the header', () => {
      const errorText = component.find(`.${styles.error}`).text();

      expect(errorText).to.be.equal('Error message');
    });
  });
});
