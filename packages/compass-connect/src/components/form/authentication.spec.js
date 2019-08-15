import React from 'react';
import { mount } from 'enzyme';
import Authentication from './authentication';
import AppRegistry from 'hadron-app-registry';
import hadronApp from 'hadron-app';

import styles from '../connect.less';

describe('Authentication [Component]', () => {
  const connection = { authStrategy: 'MONGODB' };
  const appRegistry = new AppRegistry();
  let component;

  class AuthStrategyComponent extends React.Component {
    render() {
      return (<div id="AuthStrategyComponent" />);
    }
  }

  const ROLE = {
    name: 'MONGODB',
    component: AuthStrategyComponent,
    selectOption: { 'MONGODB': 'Username / Password' }
  };

  before(() => {
    global.hadronApp = hadronApp;
    global.hadronApp.appRegistry = appRegistry;
    global.hadronApp.appRegistry.registerRole('Connect.AuthStrategy', ROLE);
  });

  after(() => {
    global.hadronApp.appRegistry.deregisterRole('Connect.AuthStrategy', ROLE);
  });

  beforeEach(() => {
    component = mount(
      <Authentication currentConnection={connection} isValid />
    );
  });

  afterEach(() => {
    component = null;
  });

  it('renders the wrapper div', () => {
    expect(component.find(`.${styles['form-group']}`)).to.be.present();
  });

  it('renders the name', () => {
    expect(component.find('select[name="authStrategy"]')).to.have.value('MONGODB');
  });
});
