import React from 'react';
import { mount } from 'enzyme';
import AppRegistry from 'hadron-app-registry';
import hadronApp from 'hadron-app';
import FieldStore from '@mongodb-js/compass-field-store';

import CompassSchemaValidation from 'components/compass-schema-validation';
import store from 'stores';
import styles from './compass-schema-validation.less';

describe('CompassSchemaValidation [Component]', () => {
  let component;
  const appRegistry = new AppRegistry();

  beforeEach(() => {
    component = mount(<CompassSchemaValidation store={store} />);
  });

  afterEach(() => {
    component = null;
  });

  before(function() {
    global.hadronApp = hadronApp;
    global.hadronApp.appRegistry = appRegistry;
    global.hadronApp.appRegistry.registerStore('Field.Store', FieldStore);
  });

  it('renders the correct root classname', () => {
    expect(component.find(`.${styles.root}`)).to.be.present();
  });
});
