import React from 'react';
import { mount } from 'enzyme';

import Ddl from 'components/ddl';
import store from 'stores';
import styles from './ddl.less';

describe('Ddl [Component]', () => {
  let component;

  beforeEach(() => {
    component = mount(<Ddl store={store} />);
  });

  afterEach(() => {
    component = null;
  });

  it('renders the correct root classname', () => {
    expect(component.find(`.${styles.ddl}`)).to.be.present();
  });

  it('should contain the data-test-id', () => {
    expect(component.find('[data-test-id="databases-table"]')).to.be.present();
  });
});
