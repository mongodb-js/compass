import React from 'react';
import { mount } from 'enzyme';
import CheckCircle from 'components/check-circle';

import styles from './check-circle.less';

describe('CheckCircle [Component]', () => {
  let component;

  beforeEach(() => {
    component = mount(
      <CheckCircle />
    );
  });

  afterEach(() => {
    component = null;
  });

  it('renders the wrapper div', () => {
    expect(component.find(`.${styles['check-circle']}`)).to.be.present();
  });
});
