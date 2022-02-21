import React from 'react';
import { mount } from 'enzyme';
import sinon from 'sinon';
import { expect } from 'chai';

import ImportPipeline from './import-pipeline';
import styles from './import-pipeline.module.less';

describe('ImportPipeline [Component]', function() {
  let component;
  let createNewSpy;
  let closeImportSpy;
  let changeTextSpy;

  beforeEach(function() {
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

  afterEach(function() {
    component = null;
    createNewSpy = null;
    closeImportSpy = null;
    changeTextSpy = null;
  });

  it('renders the title text', function() {
    expect(component.find('h1')).to.have.text(
      'New Pipeline From Plain Text'
    );
  });

  it('renders the note text', function() {
    expect(component.find(`.${styles['import-pipeline-note']}`)).to.have.text(
      'Supports MongoDB Shell syntax. Pasting a pipeline will create a new pipeline.'
    );
  });

  context('when clicking on the cancel button', function() {
    it('calls the action', function() {
      component.find('button').at(1).hostNodes().simulate('click');
      expect(closeImportSpy.calledOnce).to.equal(true);
    });
  });

  context('when clicking on the confirm import button', function() {
    it('calls the action', function() {
      component.find('button').at(0).hostNodes().simulate('click');
      expect(createNewSpy.calledOnce).to.equal(true);
    });
  });
});
