import React from 'react';
import { shallow } from 'enzyme';

import Input from 'components/input';
import styles from './input.less';

describe('Input [Component]', () => {
  let component;

  beforeEach(() => {
    component = shallow(<Input />);
  });

  afterEach(() => {
    component = null;
  });

  it('renders the wrapper div', () => {
    expect(component.find(`.${styles.input}`)).to.be.present();
  });
});
