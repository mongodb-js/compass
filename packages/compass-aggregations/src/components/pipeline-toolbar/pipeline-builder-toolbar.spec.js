import React from 'react';
import { mount } from 'enzyme';

import PipelineBuilderToolbar from './pipeline-builder-toolbar';
import styles from './pipeline-builder-toolbar.less';

describe('PipelineBuilderToolbar [Component]', () => {
  let component;
  let savedPipelinesListToggleSpy;
  let getSavedPipelinesSpy;
  let exportToLanguageSpy;
  let setIsNewPipelineConfirmSpy;
  let newPipelineFromTextSpy;
  let clonePipelineSpy;
  let nameChangedSpy;
  let saveSpy;
  let setIsModifiedSpy;
  let collationCollapseSpy;
  let toggleOverviewSpy;
  let savingPipelineOpenSpy;
  let openCreateViewSpy;
  let updateViewSpy;

  beforeEach(() => {
    savedPipelinesListToggleSpy = sinon.spy();
    getSavedPipelinesSpy = sinon.spy();
    exportToLanguageSpy = sinon.spy();
    setIsNewPipelineConfirmSpy = sinon.spy();
    newPipelineFromTextSpy = sinon.spy();
    clonePipelineSpy = sinon.spy();
    nameChangedSpy = sinon.spy();
    saveSpy = sinon.spy();
    setIsModifiedSpy = sinon.spy();
    collationCollapseSpy = sinon.spy();
    toggleOverviewSpy = sinon.spy();
    savingPipelineOpenSpy = sinon.spy();
    openCreateViewSpy = sinon.spy();
    updateViewSpy = sinon.spy();

    component = mount(
      <PipelineBuilderToolbar
        savedPipelinesListToggle={savedPipelinesListToggleSpy}
        getSavedPipelines={getSavedPipelinesSpy}
        saveCurrentPipeline={saveSpy}
        savedPipeline={{ isListVisible: true }}
        setIsNewPipelineConfirm={setIsNewPipelineConfirmSpy}
        newPipelineFromText={newPipelineFromTextSpy}
        clonePipeline={clonePipelineSpy}
        nameChanged={nameChangedSpy}
        name=""
        isAtlasDeployed={false}
        isModified
        isCollationExpanded
        isOverviewOn={false}
        toggleOverview={toggleOverviewSpy}
        setIsModified={setIsModifiedSpy}
        collationCollapseToggled={collationCollapseSpy}
        exportToLanguage={exportToLanguageSpy}
        serverVersion="4.0.0"
        savingPipelineOpen={savingPipelineOpenSpy}
        openCreateView={openCreateViewSpy}
        updateView={updateViewSpy}
      />
    );
  });

  afterEach(() => {
    component = null;
    savedPipelinesListToggleSpy = null;
    getSavedPipelinesSpy = null;
    exportToLanguageSpy = null;
    setIsNewPipelineConfirmSpy = null;
    newPipelineFromTextSpy = null;
    clonePipelineSpy = null;
    nameChangedSpy = null;
    saveSpy = null;
    setIsModifiedSpy = null;
    toggleOverviewSpy = null;
    updateViewSpy = null;
  });

  it('renders the wrapper div', () => {
    expect(
      component.find(`.${styles['pipeline-builder-toolbar']}`)
    ).to.be.present();
  });

  it('renders the save pipeline button', () => {
    expect(
      component.find(
        `.${styles['pipeline-builder-toolbar-save-pipeline-button']}`
      )
    ).to.be.present();
  });

  it('renders the dropdown menu', () => {
    expect(component.find('.dropdown-toggle')).to.be.present();
  });
});
