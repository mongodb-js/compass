import React from 'react';
import { mount } from 'enzyme';

import InputBuilder from '../input-builder';
import styles from './input-builder.module.less';

describe('InputBuilder [Component]', () => {
  let component;

  beforeEach(() => {
    component = mount(<InputBuilder openLink={sinon.spy()} />);
  });

  afterEach(() => {
    component = null;
  });

  it('renders the wrapper div', () => {
    expect(component.find(`.${styles['input-builder']}`)).to.be.present();
  });
});
