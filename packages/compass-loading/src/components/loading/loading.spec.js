import React from 'react';
import { mount } from 'enzyme';

import { Loading } from 'components/loading';
import styles from './loading.less';

describe('Loading [Component]', () => {
  let component;

  beforeEach(() => {
    component = mount(<Loading />);
  });

  afterEach(() => {
    component = null;
  });

  it('renders the correct root classname', () => {
    expect(component.find(`.${styles.loading}`)).to.be.present();
  });
});
