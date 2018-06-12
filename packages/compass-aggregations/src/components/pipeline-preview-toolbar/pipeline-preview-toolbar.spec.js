import React from 'react';
import { mount } from 'enzyme';

import PipelinePreviewToolbar from 'components/pipeline-preview-toolbar';
import styles from './pipeline-preview-toolbar.less';

describe('PipelinePreviewToolbar [Component]', () => {
  let component;
  let toggleCommentsSpy;
  let toggleSampleSpy;

  beforeEach(() => {
    toggleCommentsSpy = sinon.spy();
    toggleSampleSpy = sinon.spy();
    component = mount(
      <PipelinePreviewToolbar
        toggleComments={toggleCommentsSpy}
        toggleSample={toggleSampleSpy}
        isModified
        isSampling
        isCommenting />
    );
  });

  afterEach(() => {
    component = null;
    toggleCommentsSpy = null;
    toggleSampleSpy = null;
  });

  it('renders the wrapper div', () => {
    expect(component.find(`.${styles['pipeline-preview-toolbar']}`)).to.be.present();
  });

  it('renders the comment mode text', () => {
    expect(component.find(`.${styles['pipeline-preview-toolbar-comment-mode']}`).hostNodes()).
      to.have.text('Comment Mode');
  });

  it('renders the sample mode text', () => {
    expect(component.find(`.${styles['pipeline-preview-toolbar-sample-mode']}`).hostNodes()).
      to.have.text('Sample Mode');
  });

  context('when toggling comments', () => {
    it('calls the action', () => {
      component.find(`.${styles['pipeline-preview-toolbar-toggle-comments-button']}`).hostNodes().simulate('click');
      expect(toggleCommentsSpy.calledOnce).to.equal(true);
    });
  });

  context('when toggling sampling', () => {
    it('calls the action', () => {
      component.find(`.${styles['pipeline-preview-toolbar-toggle-sample-button']}`).hostNodes().simulate('click');
      expect(toggleSampleSpy.calledOnce).to.equal(true);
    });
  });
});
