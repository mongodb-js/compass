import React from 'react';
import { mount } from 'enzyme';

import ConfirmImportPipeline from './confirm-import-pipeline';
import styles from './confirm-import-pipeline.module.less';

describe('ConfirmImportPipeline [Component]', () => {
  let component;
  let confirmNewSpy;
  let runStageSpy;
  let closeImportSpy;

  beforeEach(() => {
    confirmNewSpy = sinon.spy();
    runStageSpy = sinon.spy();
    closeImportSpy = sinon.spy();
    component = mount(
      <ConfirmImportPipeline
        closeImport={closeImportSpy}
        confirmNew={confirmNewSpy}
        runStage={runStageSpy}
        isAutoPreviewing
        isConfirmationNeeded />
    );
  });

  afterEach(() => {
    component = null;
    confirmNewSpy = null;
    runStageSpy = null;
    closeImportSpy = null;
  });

  it('renders the title text', () => {
    expect(component.find('h1')).to.have.text(
      'Are you sure you want to create a new pipeline?'
    );
  });

  it('renders the note text', () => {
    expect(component.find(`.${styles['confirm-import-pipeline-note']}`)).to.have.text(
      'Creating this pipeline will abandon unsaved changes to the current pipeline.'
    );
  });

  context('when clicking on the cancel button', () => {
    it('calls the action', () => {
      component.find('button').at(1).hostNodes().simulate('click');
      expect(closeImportSpy.calledOnce).to.equal(true);
    });
  });

  context('when clicking on the confirm button', () => {
    it('calls the action', () => {
      component.find('button').at(0).hostNodes().simulate('click');
      expect(confirmNewSpy.calledOnce).to.equal(true);
      expect(runStageSpy.calledOnce).to.equal(true);
    });
  });
});
