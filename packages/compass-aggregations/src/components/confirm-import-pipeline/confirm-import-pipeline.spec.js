import React from 'react';
import { mount } from 'enzyme';

import ConfirmImportPipeline from 'components/confirm-import-pipeline';
import styles from './confirm-import-pipeline.less';

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
    expect(component.find('h4')).to.have.text(
      'Are you sure you want to create a new pipeline?'
    );
  });

  it('renders the note text', () => {
    expect(component.find(`.${styles['confirm-import-pipeline-note']}`)).to.have.text(
      'Creating this pipeine will abandon unsaved changes to the current pipeline.'
    );
  });

  context('when clicking on the cancel button', () => {
    it('calls the action', () => {
      component.find('#cancel-confirm-import-pipeline').hostNodes().simulate('click');
      expect(closeImportSpy.calledOnce).to.equal(true);
    });
  });

  context('when clicking on the confirm button', () => {
    it('calls the action', () => {
      component.find('#confirm-import-pipeline').hostNodes().simulate('click');
      expect(confirmNewSpy.calledOnce).to.equal(true);
      expect(runStageSpy.calledOnce).to.equal(true);
    });
  });
});
