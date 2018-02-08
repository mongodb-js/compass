import React from 'react';
import { shallow } from 'enzyme';

import PipelinePreviewToolbar from 'components/pipeline-preview-toolbar';
import styles from './pipeline-preview-toolbar.less';

describe('PipelinePreviewToolbar [Component]', () => {
  let component;

  beforeEach(() => {
    component = shallow(<PipelinePreviewToolbar />);
  });

  afterEach(() => {
    component = null;
  });

  it('renders the wrapper div', () => {
    expect(component.find(`.${styles['pipeline-preview-toolbar']}`)).to.be.present();
  });
});
