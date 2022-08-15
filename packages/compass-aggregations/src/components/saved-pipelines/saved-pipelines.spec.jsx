import React from 'react';
import { mount } from 'enzyme';
import sinon from 'sinon';
import { expect } from 'chai';

import { SavedPipelines } from './saved-pipelines';

describe('SavedPipelines [Component]', function() {
  context('when the component is rendered', function() {
    let component;
    const savedPipelines = [];
    const spy = sinon.spy();
    const restorePipelineModalToggleSpy = sinon.spy();
    const restorePipelineFromSpy = sinon.spy();
    const deletePipelineSpy = sinon.spy();

    beforeEach(function() {
      component = mount(
        <SavedPipelines
          restorePipelineModalToggle={restorePipelineModalToggleSpy}
          restorePipelineFrom={restorePipelineFromSpy}
          deletePipeline={deletePipelineSpy}
          savedPipelines={savedPipelines}
          onSetShowSavedPipelines={spy}
        />
      );
    });

    afterEach(function() {
      component = null;
    });

    it('renders the title text', function() {
      expect(
        component.find('#saved-pipeline-header-title').first()
      ).to.contain.text('Saved Pipelines');
    });

    it('renders the close button', function() {
      expect(
        component.find('[data-testid="saved-pipelines-close-button"]')
      ).to.be.present();
    });
  });

  context('when clicking on the close button', function() {
    let component;
    const savedPipelines = [];
    const spy = sinon.spy();
    const restorePipelineModalToggleSpy = sinon.spy();
    const restorePipelineFromSpy = sinon.spy();
    const deletePipelineSpy = sinon.spy();

    beforeEach(function() {
      component = mount(
        <SavedPipelines
          restorePipelineModalToggle={restorePipelineModalToggleSpy}
          restorePipelineFrom={restorePipelineFromSpy}
          deletePipeline={deletePipelineSpy}
          savedPipelines={savedPipelines}
          onSetShowSavedPipelines={spy}
        />
      );
    });

    afterEach(function() {
      component = null;
    });

    it('calls the action', function() {
      component.find(
        'button'
      ).at(0).hostNodes().simulate('click');
      expect(spy.calledOnce).to.equal(true);
    });
  });
});
