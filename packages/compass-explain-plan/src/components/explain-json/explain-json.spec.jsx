import React from 'react';
import { mount } from 'enzyme';
import AppRegistry from 'hadron-app-registry';
import hadronApp from 'hadron-app';
import { expect } from 'chai';

import ExplainJSON from '../explain-json';

import styles from './explain-json.module.less';

describe('ExplainJSON [Component]', function() {
  let component;
  const originalExplainData = {};
  const appRegistry = new AppRegistry();

  beforeEach(function() {
    component = mount(
      <ExplainJSON rawExplainObject={originalExplainData} />
    );
  });

  afterEach(function() {
    component = null;
  });

  before(function() {
    global.hadronApp = hadronApp;
    global.hadronApp.appRegistry = appRegistry;
  });

  it('renders the correct root classname', function() {
    expect(component.find(`.${styles['explain-json']}`)).to.be.present();
  });
});
