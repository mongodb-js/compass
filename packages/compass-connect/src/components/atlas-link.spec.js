import React from 'react';
import { mount } from 'enzyme';
import AtlasLink from './atlas-link';

import styles from './connect.less';

describe('AtlasLink [Component]', () => {
  let component;

  beforeEach(() => {
    component = mount(<AtlasLink />);
  });

  afterEach(() => {
    component = null;
  });

  it('renders AtlasLink component', () => {
    expect(component.find(`.${styles['connect-atlas']}`)).to.be.present();
  });
});
