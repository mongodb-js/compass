import React from 'react';
import { shallow } from 'enzyme';

import StageToolbar from 'components/stage-toolbar';
import styles from './stage-toolbar.less';

describe('StageToolbar [Component]', () => {
  let component;

  beforeEach(() => {
    component = shallow(<StageToolbar />);
  });

  afterEach(() => {
    component = null;
  });

  it('renders the wrapper div', () => {
    expect(component.find(`.${styles['stage-toolbar']}`)).to.be.present();
  });
});
