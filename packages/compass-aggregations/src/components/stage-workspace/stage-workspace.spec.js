import React from 'react';
import { shallow } from 'enzyme';

import StageWorkspace from 'components/stage-workspace';
import styles from './stage-workspace.less';

describe('StageWorkspace [Component]', () => {
  let component;
  let stageChangedSpy;

  beforeEach(() => {
    stageChangedSpy = sinon.spy();

    component = shallow(
      <StageWorkspace
        stage={{}}
        index={0}
        serverVersion="3.6.0"
        fields={[]}
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
