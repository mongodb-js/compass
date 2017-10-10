import React from 'react';
import { mount } from 'enzyme';

import License from 'components/license';
import styles from './license.less';

describe('License [Component]', () => {
  let component;

  beforeEach(() => {
    component = mount(<License />);
  });

  afterEach(() => {
    component = null;
  });

  it('renders the correct root classname', () => {
    expect(component.find(`.${styles.root}`)).to.have.length(1);
  });

  it('should contain one <h2> tag', () => {
    expect(component.find('h2')).to.have.length(1);
  });
});
