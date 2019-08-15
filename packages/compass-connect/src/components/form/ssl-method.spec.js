import React from 'react';
import { mount } from 'enzyme';
import SSLMethod from './ssl-method';
import AppRegistry from 'hadron-app-registry';
import hadronApp from 'hadron-app';

import styles from '../connect.less';

describe('SSLMethod [Component]', () => {
  const connection = { sslMethod: 'NONE' };
  const appRegistry = new AppRegistry();
  let component;

  class SSLMethodComponent extends React.Component {
    render() {
      return (<div id="SSLMethodComponent" />);
    }
  }

  const ROLE = {
    name: 'NONE',
    component: SSLMethodComponent,
    selectOption: { 'NONE': 'None' }
  };

  before(() => {
    global.hadronApp = hadronApp;
    global.hadronApp.appRegistry = appRegistry;
    global.hadronApp.appRegistry.registerRole('Connect.SSLMethod', ROLE);
  });

  after(() => {
    global.hadronApp.appRegistry.deregisterRole('Connect.SSLMethod', ROLE);
  });

  beforeEach(() => {
    component = mount(
      <SSLMethod currentConnection={connection} isValid />
    );
  });

  afterEach(() => {
    component = null;
  });

  it('renders the wrapper div', () => {
    expect(component.find(`.${styles['form-group']}`)).to.be.present();
  });

  it('renders the name', () => {
    expect(component.find('select[name="sslMethod"]')).to.have.value('NONE');
  });
});
