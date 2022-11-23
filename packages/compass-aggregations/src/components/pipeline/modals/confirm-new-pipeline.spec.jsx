import React from 'react';
import { mount } from 'enzyme';
import sinon from 'sinon';
import { expect } from 'chai';

import ConfirmNewPipeline from './confirm-new-pipeline';

describe('ConfirmNewPipeline [Component]', function() {
  let component;
  let isNewPipelineConfirmSpy;
  let setIsNewPipelineConfirmSpy;
  let newPipelineSpy;

  beforeEach(function() {
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

  afterEach(function() {
    component = null;
    setIsNewPipelineConfirmSpy = null;
    newPipelineSpy = null;
  });

  it('renders the title text', function() {
    expect(component.find('h1')).to.have.text(
      'Are you sure you want to create a new pipeline?'
    );
  });

  it('renders the note text', function() {
    expect(component).to.contain.text(
      'Creating this pipeline will abandon unsaved changes to the current pipeline.'
    );
  });

  context('when clicking on the cancel button', function() {
    it('calls the action', function() {
      component.find('button').at(1).hostNodes().simulate('click');
      expect(setIsNewPipelineConfirmSpy.calledOnce).to.equal(true);
    });
  });

  context('when clicking on the confirm button', function() {
    it('calls the action', function() {
      component.find('button').at(0).hostNodes().simulate('click');
      expect(setIsNewPipelineConfirmSpy.calledOnce).to.equal(true);
      expect(newPipelineSpy.calledOnce).to.equal(true);
    });
  });
});
