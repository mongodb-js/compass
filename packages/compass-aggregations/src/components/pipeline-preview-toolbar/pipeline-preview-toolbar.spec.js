import React from 'react';
import { mount } from 'enzyme';

import PipelinePreviewToolbar from 'components/pipeline-preview-toolbar';
import styles from './pipeline-preview-toolbar.less';

describe('PipelinePreviewToolbar [Component]', () => {
  let component;
  let stageAddedSpy;

  beforeEach(() => {
    stageAddedSpy = sinon.spy();
    component = mount(<PipelinePreviewToolbar stageAdded={stageAddedSpy} isModified />);
  });

  afterEach(() => {
    component = null;
    stageAddedSpy = null;
  });

  it('renders the wrapper div', () => {
    expect(component.find(`.${styles['pipeline-preview-toolbar']}`)).to.be.present();
  });

  it('renders the add stage button', () => {
    expect(component.find(`.${styles['pipeline-preview-toolbar-add-stage-button']}`).hostNodes()).
      to.have.text('Add Stage');
  });

  context('when clicking the add stage button', () => {
    it('calls the action', () => {
      component.find(`.${styles['pipeline-preview-toolbar-add-stage-button']}`).hostNodes().simulate('click');
      expect(stageAddedSpy.calledOnce).to.equal(true);
    });
  });
});
