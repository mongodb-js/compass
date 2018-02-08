import React from 'react';
import { mount } from 'enzyme';

import InputBuilder from 'components/input-builder';
import styles from './input-builder.less';

describe('InputBuilder [Component]', () => {
  let component;

  beforeEach(() => {
    component = mount(<InputBuilder />);
  });

  afterEach(() => {
    component = null;
  });

  it('renders the wrapper div', () => {
    expect(component.find(`.${styles['input-builder']}`)).to.be.present();
  });
});
