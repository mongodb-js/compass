import React from 'react';
import { mount } from 'enzyme';

import ImportExport from 'components/import-export';
import store from 'stores';
import styles from './import-export.less';

describe('ImportExport [Component]', () => {
  let component;

  beforeEach(() => {
    component = mount(<ImportExport store={store} />);
  });

  afterEach(() => {
    component = null;
  });

  it('renders the correct root classname', () => {
    expect(component.find(`.${styles['import-export']}`)).to.be.present();
  });
});
