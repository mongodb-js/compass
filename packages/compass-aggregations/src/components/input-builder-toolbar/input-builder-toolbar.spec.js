import React from 'react';
import { shallow } from 'enzyme';

import InputBuilderToolbar from 'components/input-builder-toolbar';
import styles from './input-builder-toolbar.less';

describe('InputBuilderToolbar [Component]', () => {
  let component;

  beforeEach(() => {
    component = shallow(
      <InputBuilderToolbar />
    );
  });

  afterEach(() => {
    component = null;
  });

  it('renders the wrapper div', () => {
    expect(component.find(`.${styles['input-builder-toolbar']}`)).to.be.present();
  });
});
