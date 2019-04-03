import React from 'react';
import { mount } from 'enzyme';

import Splitter from './splitter';
import styles from './splitter.less';

describe('Splitter [Component]', () => {
  let component;

  afterEach(() => {
    component = null;
  });

  it('renders the wrapper div', () => {
    component = mount(<Splitter />);
    expect(component.find(`.${styles.splitter}`)).to.be.present();
  });
  it('renders as expanded', () => {
    component = mount(<Splitter isCollationExpanded />);
    expect(component.find(`.${styles['splitter-expanded']}`)).to.be.present();
  });
});
