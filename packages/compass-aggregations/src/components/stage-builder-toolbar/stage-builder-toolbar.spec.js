import React from 'react';
import { shallow } from 'enzyme';

import StageBuilderToolbar from 'components/stage-builder-toolbar';
import styles from './stage-builder-toolbar.less';

describe('StageBuilderToolbar [Component]', () => {
  let component;

  beforeEach(() => {
    component = shallow(<StageBuilderToolbar />);
  });

  afterEach(() => {
    component = null;
  });

  it('renders the wrapper div', () => {
    expect(component.find(`.${styles['stage-builder-toolbar']}`)).to.be.present();
  });
});
