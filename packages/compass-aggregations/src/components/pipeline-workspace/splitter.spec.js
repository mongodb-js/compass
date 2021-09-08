import React from 'react';
import { mount } from 'enzyme';

import Splitter from './splitter';
import styles from './splitter.module.less';

describe('Splitter [Component]', () => {
  let component;

  afterEach(() => {
    component = null;
  });

  it('renders the wrapper div', () => {
    component = mount(<Splitter />);
    expect(component.find(`.${styles.splitter}`)).to.be.present();
  });
});
