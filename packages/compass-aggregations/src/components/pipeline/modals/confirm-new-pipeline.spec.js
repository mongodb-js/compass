import React from 'react';
import { mount } from 'enzyme';

import ConfirmNewPipeline from './confirm-new-pipeline';
import styles from './confirm-new-pipeline.less';

describe('ConfirmNewPipeline [Component]', () => {
  let component;
  let isNewPipelineConfirmSpy;
  let setIsNewPipelineConfirmSpy;
  let newPipelineSpy;

  beforeEach(() => {
    isNewPipelineConfirmSpy = true;
    setIsNewPipelineConfirmSpy = sinon.spy();
    newPipelineSpy = sinon.spy();
    component = mount(
      <ConfirmNewPipeline
        isNewPipelineConfirm={isNewPipelineConfirmSpy}
        setIsNewPipelineConfirm={setIsNewPipelineConfirmSpy}
        newPipeline={newPipelineSpy} />
    );
  });

  afterEach(() => {
    component = null;
    setIsNewPipelineConfirmSpy = null;
    newPipelineSpy = null;
  });

  it('renders the title text', () => {
    expect(component.find('h4')).to.have.text(
      'Are you sure you want to create a new pipeline?'
    );
  });

  it('renders the note text', () => {
    expect(component.find(`.${styles['confirm-new-pipeline-note']}`)).to.have.text(
      'Creating this pipeline will abandon unsaved changes to the current pipeline.'
    );
  });

  context('when clicking on the cancel button', () => {
    it('calls the action', () => {
      component.find('#cancel-confirm-new-pipeline').hostNodes().simulate('click');
      expect(setIsNewPipelineConfirmSpy.calledOnce).to.equal(true);
    });
  });

  context('when clicking on the confirm button', () => {
    it('calls the action', () => {
      component.find('#confirm-new-pipeline').hostNodes().simulate('click');
      expect(setIsNewPipelineConfirmSpy.calledOnce).to.equal(true);
      expect(newPipelineSpy.calledOnce).to.equal(true);
    });
  });
});
