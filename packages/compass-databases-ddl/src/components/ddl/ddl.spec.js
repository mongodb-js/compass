import React from 'react';
import { mount } from 'enzyme';

import Ddl from 'components/ddl';
// import store from 'stores';
import styles from './ddl.less';

describe('Ddl [Component]', () => {
  let component;

  beforeEach(() => {
    component = mount(<Ddl />);
  });

  afterEach(() => {
    component = null;
  });

  it('renders the correct root classname', () => {
    expect(component.find(`.${styles.root}`)).to.be.present();
  });

  it('should contain one <h2> tag', () => {
    expect(component.find('h2')).to.have.length(1);
  });
});
