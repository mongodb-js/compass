import React from 'react';
import { shallow } from 'enzyme';

import Toolbar from 'components/toolbar';
import styles from './toolbar.less';

describe('Toolbar [Component]', () => {
  let component;

  beforeEach(() => {
    component = shallow(<Toolbar />);
  });

  afterEach(() => {
    component = null;
  });

  it('renders the wrapper div', () => {
    expect(component.find(`.${styles.toolbar}`)).to.be.present();
  });
});
