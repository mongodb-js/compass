import React from 'react';
import { mount } from 'enzyme';

import SavePipeline from '../save-pipeline';
import styles from './save-pipeline.module.less';

describe('SavePipeline [Component]', () => {
  context('when the component is rendered', () => {
    let component;
    const savedPipeline = {
      pipelines: [],
      isListVisible: false,
      isModalVisible: false,
      isModalError: false
    };
    const spy = sinon.spy();
    const restorePipelineModalToggleSpy = sinon.spy();
    const restorePipelineFromSpy = sinon.spy();
    const deletePipelineSpy = sinon.spy();

    beforeEach(() => {
      component = mount(
        <SavePipeline
          restorePipelineModalToggle={restorePipelineModalToggleSpy}
          restorePipelineFrom={restorePipelineFromSpy}
          deletePipeline={deletePipelineSpy}
          savedPipeline={savedPipeline}
          savedPipelinesListToggle={spy} />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('renders the title text', () => {
      expect(component.find('#saved-pipeline-header-title')).to.contain.text('Saved Pipelines');
    });

    it('renders the pipeline cards parent div', () => {
      expect(component.find(`.${styles['save-pipeline-cards']}`)).to.be.present();
    });

    it('renders the correct root classname', () => {
      expect(component.find(`.${styles['save-pipeline']}`)).to.be.present();
    });

    it('renders the the fa close button', () => {
      expect(component.find('.fa-times')).to.be.present();
    });
  });

  context('when clicking on the button', () => {
    let component;
    const savedPipeline = {
      pipelines: [],
      isListVisible: false,
      isModalVisible: false,
      isModalError: false
    };
    const spy = sinon.spy();
    const restorePipelineModalToggleSpy = sinon.spy();
    const restorePipelineFromSpy = sinon.spy();
    const deletePipelineSpy = sinon.spy();

    beforeEach(() => {
      component = mount(
        <SavePipeline
          restorePipelineModalToggle={restorePipelineModalToggleSpy}
          restorePipelineFrom={restorePipelineFromSpy}
          deletePipeline={deletePipelineSpy}
          savedPipeline={savedPipeline}
          savedPipelinesListToggle={spy} />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('calls the action', () => {
      component.find('.fa.fa-times').simulate('click');
      expect(spy.calledOnce).to.equal(true);
    });
  });
});
