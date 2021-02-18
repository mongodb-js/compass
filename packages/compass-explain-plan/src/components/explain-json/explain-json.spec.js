import React from 'react';
import { mount } from 'enzyme';
import ExplainJSON from 'components/explain-json';
import AppRegistry from 'hadron-app-registry';
import hadronApp from 'hadron-app';

import styles from './explain-json.less';

describe('ExplainJSON [Component]', () => {
  let component;
  const rawExplainObject = { originalData: {} };
  const appRegistry = new AppRegistry();

  beforeEach(() => {
    component = mount(
      <ExplainJSON rawExplainObject={rawExplainObject} />
    );
  });

  afterEach(() => {
    component = null;
  });

  before(function() {
    global.hadronApp = hadronApp;
    global.hadronApp.appRegistry = appRegistry;
  });

  it('renders the correct root classname', () => {
    expect(component.find(`.${styles['explain-json']}`)).to.be.present();
  });
});
