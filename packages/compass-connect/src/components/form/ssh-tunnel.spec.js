import React from 'react';
import { mount } from 'enzyme';
import SSHTunnel from './ssh-tunnel';
import AppRegistry from 'hadron-app-registry';
import hadronApp from 'hadron-app';

import styles from '../connect.less';

describe('SSHTunnel [Component]', () => {
  const connection = { sshTunnel: 'NONE' };
  const appRegistry = new AppRegistry();
  let component;

  class SSHTunnelComponent extends React.Component {
    render() {
      return (<div id="SSHTunnelComponent" />);
    }
  }

  const ROLE = {
    name: 'NONE',
    component: SSHTunnelComponent,
    selectOption: { 'NONE': 'None' }
  };

  before(() => {
    global.hadronApp = hadronApp;
    global.hadronApp.appRegistry = appRegistry;
    global.hadronApp.appRegistry.registerRole('Connect.SSHTunnel', ROLE);
  });

  after(() => {
    global.hadronApp.appRegistry.deregisterRole('Connect.SSHTunnel', ROLE);
  });

  beforeEach(() => {
    component = mount(
      <SSHTunnel currentConnection={connection} isValid />
    );
  });

  afterEach(() => {
    component = null;
  });

  it('renders the wrapper div', () => {
    expect(component.find(`.${styles['form-group']}`)).to.be.present();
  });

  it('renders the name', () => {
    expect(component.find('select[name="sshTunnel"]')).to.have.value('NONE');
  });
});
