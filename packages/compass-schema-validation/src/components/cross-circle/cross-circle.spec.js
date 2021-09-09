import React from 'react';
import { mount } from 'enzyme';
import CrossCircle from '../cross-circle';

import styles from './cross-circle.module.less';

describe('CrossCircle [Component]', () => {
  let component;

  beforeEach(() => {
    component = mount(
      <CrossCircle />
    );
  });

  afterEach(() => {
    component = null;
  });

  it('renders the wrapper div', () => {
    expect(component.find(`.${styles['cross-circle']}`)).to.be.present();
  });
});
