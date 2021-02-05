import React from 'react';
import { mount } from 'enzyme';
import AppRegistry from 'hadron-app-registry';
import hadronApp from 'hadron-app';

import Authentication from './authentication';

import styles from '../../connect.less';

describe('Authentication [Component]', () => {
  const connectionModel = { authStrategy: 'MONGODB' };
  const appRegistry = new AppRegistry();
  let component;

  before(() => {
    global.hadronApp = hadronApp;
    global.hadronApp.appRegistry = appRegistry;
  });

  beforeEach(() => {
    component = mount(
      <Authentication connectionModel={connectionModel} isValid />
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
