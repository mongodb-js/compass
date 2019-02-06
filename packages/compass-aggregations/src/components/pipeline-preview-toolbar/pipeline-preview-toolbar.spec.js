import React from 'react';
import { mount } from 'enzyme';

import PipelinePreviewToolbar from 'components/pipeline-preview-toolbar';
import styles from './pipeline-preview-toolbar.less';

describe('PipelinePreviewToolbar [Component]', () => {
  let component;
  let toggleCommentsSpy;
  let toggleSampleSpy;
  let toggleAutoPreviewSpy;

  beforeEach(() => {
    toggleCommentsSpy = sinon.spy();
    toggleSampleSpy = sinon.spy();
    toggleAutoPreviewSpy = sinon.spy();
    component = mount(
      <PipelinePreviewToolbar
        toggleComments={toggleCommentsSpy}
        toggleSample={toggleSampleSpy}
        toggleAutoPreview={toggleAutoPreviewSpy}
        isModified
        isSampling
        isAutoPreviewing
        isCommenting
      />
    );
  });

  afterEach(() => {
    component = null;
    toggleCommentsSpy = null;
    toggleSampleSpy = null;
    toggleAutoPreviewSpy = null;
  });

  it('renders the wrapper div', () => {
    expect(
      component.find(`.${styles['pipeline-preview-toolbar']}`)
    ).to.be.present();
  });

  it('renders the comment mode text', () => {
    expect(
      component
        .find(`.${styles['pipeline-preview-toolbar-comment-mode']}`)
        .hostNodes()
    ).to.have.text('Comment Mode');
  });

  describe('Sample Mode', () => {
    it('renders the sample mode text', () => {
      expect(
        component
          .find(`.${styles['pipeline-preview-toolbar-sample-mode']}`)
          .hostNodes()
      ).to.have.text('Sample Mode');
    });
    it('renders the tooltip', () => {
      const toggleClassName = styles['pipeline-preview-toolbar-toggle-sample'];
      expect(
        component.find(`.${toggleClassName} .hadron-tooltip`)
      ).to.be.present();
    });
  });
  describe('Auto-Preview', () => {
    it('renders the auto preview mode text', () => {
      expect(
        component
          .find(`.${styles['pipeline-preview-toolbar-auto-preview-mode']}`)
          .hostNodes()
      ).to.have.text('Auto Preview');
    });
    it('renders the tooltip', () => {
      const toggleClassName =
        styles['pipeline-preview-toolbar-toggle-auto-preview'];
      expect(
        component.find(`.${toggleClassName} .hadron-tooltip`)
      ).to.be.present();
    });
  });

  context('when toggling comments', () => {
    it('calls the action', () => {
      component
        .find(`.${styles['pipeline-preview-toolbar-toggle-comments-button']}`)
        .hostNodes()
        .simulate('click');
      expect(toggleCommentsSpy.calledOnce).to.equal(true);
    });
  });

  context('when toggling sampling', () => {
    it('calls the action', () => {
      component
        .find(`.${styles['pipeline-preview-toolbar-toggle-sample-button']}`)
        .hostNodes()
        .simulate('click');
      expect(toggleSampleSpy.calledOnce).to.equal(true);
    });
  });

  context('when toggling auto previewing', () => {
    it('calls the action', () => {
      component
        .find(
          `.${styles['pipeline-preview-toolbar-toggle-auto-preview-button']}`
        )
        .hostNodes()
        .simulate('click');
      expect(toggleAutoPreviewSpy.calledOnce).to.equal(true);
    });
  });
});
