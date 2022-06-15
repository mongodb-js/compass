import React from 'react';
import { mount } from 'enzyme';
import AppRegistry from 'hadron-app-registry';
import { expect } from 'chai';

import CompassSchemaValidation from '../compass-schema-validation';
import configureStore from '../../stores';
import styles from './compass-schema-validation.module.less';

describe('CompassSchemaValidation [Component]', function() {
  let component;
  let store;
  const appRegistry = new AppRegistry();

  beforeEach(function() {
    store = configureStore({
      localAppRegistry: appRegistry
    });
    component = mount(<CompassSchemaValidation store={store} />);
  });

  afterEach(function() {
    store = null;
    component = null;
  });

  it('renders the correct root classname', function() {
    expect(component.find(`.${styles.root}`)).to.be.present();
  });
});
