import React from 'react';
import { mount } from 'enzyme';

import Security from 'components/security';
import styles from './security.less';

describe('Security [Component]', () => {
  let component;

  beforeEach(() => {
    component = mount(<Security />);
  });

  afterEach(() => {
    component = null;
  });

  it('renders the correct root classname', () => {
    expect(component.find(`.${styles.security}`)).to.be.present();
  });
});
