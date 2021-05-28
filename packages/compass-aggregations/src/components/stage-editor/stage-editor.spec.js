import React from 'react';
import { mount } from 'enzyme';

import StageEditor from '../stage-editor';
import styles from './stage-editor.less';

describe('StageEditor [Component]', () => {
  let component;
  const spy = sinon.spy();
  const runStageSpy = sinon.spy();
  const setIsModifiedSpy = sinon.spy();
  const stage = '{ name: "testing" }';
  const stageOperator = '$match';
  const isValid = true;
  const projectionsChangedSpy = sinon.spy();
  const newPipelineFromPasteSpy = sinon.spy();

  beforeEach(() => {
    component = mount(
      <StageEditor
        stage={stage}
        stageOperator={stageOperator}
        isValid={isValid}
        index={0}
        isAutoPreviewing
        fromStageOperators={false}
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

  afterEach(() => {
    component = null;
  });

  it('renders the wrapper div', () => {
    expect(component.find(`.${styles['stage-editor']}`)).to.be.present();
  });
});
