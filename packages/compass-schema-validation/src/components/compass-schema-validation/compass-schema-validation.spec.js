import React from 'react';
import { mount } from 'enzyme';

import CompassSchemaValidation from 'components/compass-schema-validation';
import store from 'stores';
import styles from './compass-schema-validation.less';

describe('CompassSchemaValidation [Component]', () => {
  let component;

  beforeEach(() => {
    component = mount(<CompassSchemaValidation store={store} />);
  });

  afterEach(() => {
    component = null;
  });

  it('renders the correct root classname', () => {
    expect(component.find(`.${styles.root}`)).to.be.present();
  });
});
