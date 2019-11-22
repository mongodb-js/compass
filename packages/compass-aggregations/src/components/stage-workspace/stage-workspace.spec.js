import React from 'react';
import { shallow } from 'enzyme';

import StageWorkspace from 'components/stage-workspace';
import styles from './stage-workspace.less';

describe('StageWorkspace [Component]', () => {
  let component;
  let stageChangedSpy;
  let runStageSpy;
  let setIsModifiedSpy;
  let runOutStageSpy;
  let gotoOutResultsSpy;
  let projectionsChangedSpy;
  let newPipelineFromPasteSpy;
  let gotoMergeResultsSpy;

  beforeEach(() => {
    stageChangedSpy = sinon.spy();
    runStageSpy = sinon.spy();
    setIsModifiedSpy = sinon.spy();
    runOutStageSpy = sinon.spy();
    gotoOutResultsSpy = sinon.spy();
    projectionsChangedSpy = sinon.spy();
    newPipelineFromPasteSpy = sinon.spy();
    gotoMergeResultsSpy = sinon.spy();

    component = shallow(
      <StageWorkspace
        stage=""
        isValid
        isLoading={false}
        isComplete
        isAutoPreviewing
        fromStageOperators={false}
        previewDocuments={[]}
        index={0}
        serverVersion="3.6.0"
        fields={[]}
        projections={[]}
        isEnabled
        runStage={runStageSpy}
        gotoOutResults={gotoOutResultsSpy}
        gotoMergeResults={gotoMergeResultsSpy}
        runOutStage={runOutStageSpy}
        setIsModified={setIsModifiedSpy}
        stageChanged={stageChangedSpy}
        projectionsChanged={projectionsChangedSpy}
        newPipelineFromPaste={newPipelineFromPasteSpy}
      />
    );
  });

  afterEach(() => {
    component = null;
  });

  it('renders the wrapper div', () => {
    expect(component.find(`.${styles['stage-workspace']}`)).to.be.present();
  });
});
