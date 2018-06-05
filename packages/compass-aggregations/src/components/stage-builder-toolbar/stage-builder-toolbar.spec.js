import React from 'react';
import { shallow } from 'enzyme';

import StageBuilderToolbar from 'components/stage-builder-toolbar';
import StageGrabber from 'components/stage-grabber';
import StageCollapser from 'components/stage-collapser';
import StageOperatorSelect from 'components/stage-operator-select';
import ToggleStage from 'components/toggle-stage';
import AddAfterStage from 'components/add-after-stage';
import DeleteStage from 'components/delete-stage';
import styles from './stage-builder-toolbar.less';

describe('StageBuilderToolbar [Component]', () => {
  let component;
  let stageCollapseToggledSpy;
  let stageOperatorSelectedSpy;
  let stageToggledSpy;
  let stageAddedAfterSpy;
  let stageDeletedSpy;
  let runStageSpy;
  let setIsModifiedSpy;
  let openLinkSpy;

  beforeEach(() => {
    stageCollapseToggledSpy = sinon.spy();
    stageOperatorSelectedSpy = sinon.spy();
    stageToggledSpy = sinon.spy();
    stageAddedAfterSpy = sinon.spy();
    stageDeletedSpy = sinon.spy();
    runStageSpy = sinon.spy();
    setIsModifiedSpy = sinon.spy();
    openLinkSpy = sinon.spy();

    component = shallow(
      <StageBuilderToolbar
        stage={{ isEnabled: true }}
        index={0}
        stageCollapseToggled={stageCollapseToggledSpy}
        stageOperatorSelected={stageOperatorSelectedSpy}
        runStage={runStageSpy}
        serverVersion="3.6.0"
        stageToggled={stageToggledSpy}
        setIsModified={setIsModifiedSpy}
        openLink={openLinkSpy}
        isCommenting
        stageAddedAfter={stageAddedAfterSpy}
        stageDeleted={stageDeletedSpy} />
    );
  });

  afterEach(() => {
    component = null;
    stageCollapseToggledSpy = null;
    stageOperatorSelectedSpy = null;
    stageToggledSpy = null;
    stageAddedAfterSpy = null;
    stageDeletedSpy = null;
    runStageSpy = null;
    setIsModifiedSpy = null;
    openLinkSpy = null;
  });

  it('renders the wrapper div', () => {
    expect(component.find(`.${styles['stage-builder-toolbar']}`)).to.be.present();
  });

  it('renders the grabber', () => {
    expect(component.find(`.${styles['stage-builder-toolbar']}`)).
      to.have.descendants(StageGrabber);
  });

  it('renders the collapser', () => {
    expect(component.find(`.${styles['stage-builder-toolbar']}`)).
      to.have.descendants(StageCollapser);
  });

  it('renders the operator select', () => {
    expect(component.find(`.${styles['stage-builder-toolbar']}`)).
      to.have.descendants(StageOperatorSelect);
  });

  it('renders the toggle', () => {
    expect(component.find(`.${styles['stage-builder-toolbar']}`)).
      to.have.descendants(ToggleStage);
  });

  it('renders the delete button', () => {
    expect(component.find(`.${styles['stage-builder-toolbar']}`)).
      to.have.descendants(DeleteStage);
  });

  it('renders the add after button', () => {
    expect(component.find(`.${styles['stage-builder-toolbar']}`)).
      to.have.descendants(AddAfterStage);
  });
});
