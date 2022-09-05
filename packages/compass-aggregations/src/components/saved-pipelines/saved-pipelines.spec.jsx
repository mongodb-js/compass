import React from 'react';
import { mount } from 'enzyme';
import sinon from 'sinon';
import { expect } from 'chai';

import { SavedPipelines } from './saved-pipelines';

const emptyStateTestId = '[data-testid="saved-pipelines-empty-state"]';

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
          namespace="test.test123"
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

    it('renders an empty state', function() {
      expect(
        component.find(emptyStateTestId)
      ).to.be.present();
    });

    it('it calls to close when the close button is clicked', function() {
      expect(spy.calledOnce).to.equal(false);
      component.find(
        'button'
      ).at(0).hostNodes().simulate('click');
      expect(spy.calledOnce).to.equal(true);
    });

    it('renders the namespace', function () {

      expect(
        component.find('[data-testid="saved-pipeline-header-title-namespace"]').first()
      ).to.contain.text('test.test123');
    });
  });

  context('rendered with pipelines', function() {
    let component;
    const savedPipelines = [{
      name: 'test name',
      id: 'test id'
    }];
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

    it('renders pipeline item', function() {
      expect(
        component.find('[data-pipeline-object-id="test id"]')
      ).to.contain.text('test name');
    });

    it('does not render the empty state', function() {
      expect(
        component.find(emptyStateTestId)
      ).to.not.be.present();
    });
  });
});
