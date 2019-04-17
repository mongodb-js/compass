import React from 'react';
import { mount } from 'enzyme';

import CompassSchema from 'components/compass-schema';
import styles from './compass-schema.less';

describe('CompassSchema [Component]', () => {
  let component;

  beforeEach(() => {
    component = mount(<CompassSchema />);
  });

  afterEach(() => {
    component = null;
  });

  it('renders the correct root classname', () => {
    expect(component.find(`.${styles.root}`)).to.be.present();
  });
});
