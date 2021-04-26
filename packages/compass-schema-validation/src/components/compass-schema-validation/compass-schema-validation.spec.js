import React from 'react';
import { mount } from 'enzyme';
import AppRegistry from 'hadron-app-registry';

import CompassSchemaValidation from 'components/compass-schema-validation';
import configureStore from 'stores';
import styles from './compass-schema-validation.less';

describe('CompassSchemaValidation [Component]', () => {
  let component;
  let store;
  const appRegistry = new AppRegistry();

  beforeEach(() => {
    store = configureStore({
      localAppRegistry: appRegistry
    });
    component = mount(<CompassSchemaValidation store={store} />);
  });

  afterEach(() => {
    store = null;
    component = null;
  });

  it('renders the correct root classname', () => {
    expect(component.find(`.${styles.root}`)).to.be.present();
  });
});
