import React from 'react';
import { shallow } from 'enzyme';

import StageBuilderToolbar from 'components/stage-builder-toolbar';
import styles from './stage-builder-toolbar.less';

describe('StageBuilderToolbar [Component]', () => {
  let component;
  let stageCollapseToggledSpy;
  let stageOperatorSelectedSpy;
  let stageToggledSpy;
  let stageDeletedSpy;

  beforeEach(() => {
    stageCollapseToggledSpy = sinon.spy();
    stageOperatorSelectedSpy = sinon.spy();
    stageToggledSpy = sinon.spy();
    stageDeletedSpy = sinon.spy();

    component = shallow(
      <StageBuilderToolbar
        stage={{}}
        index={0}
        stageCollapseToggled={stageCollapseToggledSpy}
        stageOperatorSelected={stageOperatorSelectedSpy}
        stageToggled={stageToggledSpy}
        stageDeleted={stageDeletedSpy} />
    );
  });

  afterEach(() => {
    component = null;
  });

  it('renders the wrapper div', () => {
    expect(component.find(`.${styles['stage-builder-toolbar']}`)).to.be.present();
  });
});
