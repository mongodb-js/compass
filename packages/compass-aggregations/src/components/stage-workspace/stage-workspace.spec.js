import React from 'react';
import { shallow } from 'enzyme';

import StageWorkspace from 'components/stage-workspace';
import styles from './stage-workspace.less';

describe('StageWorkspace [Component]', () => {
  let component;
  let stageChangedSpy;
  let runStageSpy;

  beforeEach(() => {
    stageChangedSpy = sinon.spy();
    runStageSpy = sinon.spy();

    component = shallow(
      <StageWorkspace
        stage={{}}
        index={0}
        serverVersion="3.6.0"
        fields={[]}
        runStage={runStageSpy}
        stageChanged={stageChangedSpy} />
    );
  });

  afterEach(() => {
    component = null;
  });

  it('renders the wrapper div', () => {
    expect(component.find(`.${styles['stage-workspace']}`)).to.be.present();
  });
});
