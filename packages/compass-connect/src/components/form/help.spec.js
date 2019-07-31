import React from 'react';
import { mount } from 'enzyme';
import Help from './help';

import styles from '../connect.less';

describe('HostInput [Component]', () => {
  let component;

  beforeEach(() => {
    component = mount(<Help viewType="connectionString" />);
  });

  afterEach(() => {
    component = null;
  });

  it('renders the wrapper div', () => {
    expect(component.find(`.${styles['help-container']}`)).to.be.present();
  });
});
