import React from 'react';
import { mount } from 'enzyme';
import sinon from 'sinon';
import { expect } from 'chai';

import StageEditor from '../stage-editor';
import styles from './stage-editor.module.less';

describe('StageEditor [Component]', function() {
  let component;
  const spy = sinon.spy();
  const runStageSpy = sinon.spy();
  const setIsModifiedSpy = sinon.spy();
  const stage = '{ name: "testing" }';
  const stageOperator = '$match';
  const isValid = true;
  const projectionsChangedSpy = sinon.spy();
  const newPipelineFromPasteSpy = sinon.spy();

  beforeEach(function() {
    component = mount(
      <StageEditor
        stage={stage}
        stageOperator={stageOperator}
        isValid={isValid}
        index={0}
        isAutoPreviewing
        fields={[]}
        serverVersion="3.6.0"
        runStage={runStageSpy}
        setIsModified={setIsModifiedSpy}
        stageChanged={spy}
        projectionsChanged={projectionsChangedSpy}
        newPipelineFromPaste={newPipelineFromPasteSpy}
      />
    );
  });

  afterEach(function() {
    component = null;
  });

  it('renders the wrapper div', function() {
    expect(component.find(`.${styles['stage-editor']}`)).to.be.present();
  });
});
