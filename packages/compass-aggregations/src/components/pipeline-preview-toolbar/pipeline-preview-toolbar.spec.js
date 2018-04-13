import React from 'react';
import { mount } from 'enzyme';

import PipelinePreviewToolbar from 'components/pipeline-preview-toolbar';
import styles from './pipeline-preview-toolbar.less';

describe('PipelinePreviewToolbar [Component]', () => {
  let component;

  beforeEach(() => {
    component = mount(<PipelinePreviewToolbar />);
  });

  afterEach(() => {
    component = null;
  });

  it('renders the wrapper div', () => {
    expect(component.find(`.${styles['pipeline-preview-toolbar']}`)).to.be.present();
  });

  it('renders the add stage button', () => {
    expect(component.find(`.${styles['pipeline-preview-toolbar-add-stage-button']}`)).
      to.have.text('Add Stage');
  });
});
