import React from 'react';
import { mount } from 'enzyme';

import ImportPipeline from './import-pipeline';
import styles from './import-pipeline.less';

describe('ImportPipeline [Component]', () => {
  let component;
  let createNewSpy;
  let closeImportSpy;
  let changeTextSpy;

  beforeEach(() => {
    createNewSpy = sinon.spy();
    closeImportSpy = sinon.spy();
    changeTextSpy = sinon.spy();
    component = mount(
      <ImportPipeline
        closeImport={closeImportSpy}
        createNew={createNewSpy}
        changeText={changeTextSpy}
        text="testing"
        isOpen />
    );
  });

  afterEach(() => {
    component = null;
    createNewSpy = null;
    closeImportSpy = null;
    changeTextSpy = null;
  });

  it('renders the title text', () => {
    expect(component.find('h4')).to.have.text(
      'New Pipeline From Plain Text'
    );
  });

  it('renders the note text', () => {
    expect(component.find(`.${styles['import-pipeline-note']}`)).to.have.text(
      'Supports MongoDB Shell syntax. Pasting a pipeline will create a new pipeline.'
    );
  });

  context('when clicking on the cancel button', () => {
    it('calls the action', () => {
      component.find('#cancel-import-pipeline-from-text').hostNodes().simulate('click');
      expect(closeImportSpy.calledOnce).to.equal(true);
    });
  });

  context('when clicking on the  button', () => {
    it('calls the action', () => {
      component.find('#import-pipeline-from-text').hostNodes().simulate('click');
      expect(createNewSpy.calledOnce).to.equal(true);
    });
  });
});
