import React from 'react';
import { mount } from 'enzyme';
import AppRegistry from 'hadron-app-registry';
import hadronApp from 'hadron-app';

import SSLMethod from './ssl-method';

import styles from '../connect.less';

describe('SSLMethod [Component]', () => {
  const connection = { sslMethod: 'NONE' };
  const appRegistry = new AppRegistry();
  let component;

  before(() => {
    global.hadronApp = hadronApp;
    global.hadronApp.appRegistry = appRegistry;
  });

  beforeEach(() => {
    component = mount(
      <SSLMethod connectionModel={connection} isValid />
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
