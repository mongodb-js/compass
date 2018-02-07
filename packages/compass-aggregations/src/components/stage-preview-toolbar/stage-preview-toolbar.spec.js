import React from 'react';
import { shallow } from 'enzyme';

import StagePreviewToolbar from 'components/stage-preview-toolbar';
import styles from './stage-preview-toolbar.less';

describe('StagePreviewToolbar [Component]', () => {
  let component;

  beforeEach(() => {
    component = shallow(<StagePreviewToolbar />);
  });

  afterEach(() => {
    component = null;
  });

  it('renders the wrapper div', () => {
    expect(component.find(`.${styles['stage-preview-toolbar']}`)).to.be.present();
  });
});
