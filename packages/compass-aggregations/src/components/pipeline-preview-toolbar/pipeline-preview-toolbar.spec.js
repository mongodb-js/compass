import React from 'react';
import { mount } from 'enzyme';

import PipelinePreviewToolbar from 'components/pipeline-preview-toolbar';
import styles from './pipeline-preview-toolbar.less';

describe('PipelinePreviewToolbar [Component]', () => {
  let component;
  let toggleCommentsSpy;

  beforeEach(() => {
    toggleCommentsSpy = sinon.spy();
    component = mount(
      <PipelinePreviewToolbar toggleComments={toggleCommentsSpy} isModified isCommenting />
    );
  });

  afterEach(() => {
    component = null;
    toggleCommentsSpy = null;
  });

  it('renders the wrapper div', () => {
    expect(component.find(`.${styles['pipeline-preview-toolbar']}`)).to.be.present();
  });

  it('renders the comment mode text', () => {
    expect(component.find(`.${styles['pipeline-preview-toolbar-comment-mode']}`).hostNodes()).
      to.have.text('Comment Mode');
  });

  context('when toggling comments', () => {
    it('calls the action', () => {
      component.find(`.${styles['pipeline-preview-toolbar-toggle-comments-button']}`).hostNodes().simulate('click');
      expect(toggleCommentsSpy.calledOnce).to.equal(true);
    });
  });
});
