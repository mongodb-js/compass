import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import { expect } from 'chai';

import LegacyPipelineToolbar from './legacy-pipeline-toolbar';
import PipelineBuilderToolbar from './pipeline-builder-toolbar';
import PipelinePreviewToolbar from './pipeline-preview-toolbar';

import styles from './pipeline-toolbar.module.less';

describe('LegacyPipelineToolbar [Component]', function () {
  let component;
  let savedPipelinesListToggleSpy;
  let getSavedPipelinesSpy;
  let setIsNewPipelineConfirmSpy;
  let newPipelineFromTextSpy;
  let clonePipelineSpy;
  let nameChangedSpy;
  let stageAddedSpy;
  let exportToLanguageSpy;
  let saveSpy;
  let setIsModifiedSpy;
  let toggleCommentsSpy;
  let toggleSampleSpy;
  let toggleAutoPreviewSpy;
  let collationCollapseToggledSpy;
  let toggleOverviewSpy;
  let toggleFullscreenSpy;
  let toggleSettingsIsExpandedSpy;
  let savingPipelineOpenSpy;
  let openCreateViewSpy;
  let isAtlasDeployedSpy;
  let updateViewSpy;

  beforeEach(function () {
    savedPipelinesListToggleSpy = sinon.spy();
    getSavedPipelinesSpy = sinon.spy();
    stageAddedSpy = sinon.spy();
    exportToLanguageSpy = sinon.spy();
    setIsNewPipelineConfirmSpy = sinon.spy();
    newPipelineFromTextSpy = sinon.spy();
    clonePipelineSpy = sinon.spy();
    nameChangedSpy = sinon.spy();
    saveSpy = sinon.spy();
    setIsModifiedSpy = sinon.spy();
    toggleCommentsSpy = sinon.spy();
    toggleSampleSpy = sinon.spy();
    toggleAutoPreviewSpy = sinon.spy();
    collationCollapseToggledSpy = sinon.spy();
    toggleOverviewSpy = sinon.spy();
    toggleFullscreenSpy = sinon.spy();
    toggleSettingsIsExpandedSpy = sinon.spy();
    savingPipelineOpenSpy = sinon.spy();
    openCreateViewSpy = sinon.spy();
    isAtlasDeployedSpy = false;
    updateViewSpy = sinon.spy();

    component = shallow(
      <LegacyPipelineToolbar
        savedPipelinesListToggle={savedPipelinesListToggleSpy}
        getSavedPipelines={getSavedPipelinesSpy}
        stageAdded={stageAddedSpy}
        saveCurrentPipeline={saveSpy}
        savedPipeline={{ isNameValid: true }}
        setIsNewPipelineConfirm={setIsNewPipelineConfirmSpy}
        newPipelineFromText={newPipelineFromTextSpy}
        clonePipeline={clonePipelineSpy}
        toggleComments={toggleCommentsSpy}
        toggleSample={toggleSampleSpy}
        toggleAutoPreview={toggleAutoPreviewSpy}
        nameChanged={nameChangedSpy}
        setIsModified={setIsModifiedSpy}
        collationCollapseToggled={collationCollapseToggledSpy}
        toggleOverview={toggleOverviewSpy}
        isModified
        isCommenting
        isSampling
        isAutoPreviewing
        isOverviewOn={false}
        name=""
        exportToLanguage={exportToLanguageSpy}
        isCollationExpanded={false}
        isFullscreenOn={false}
        toggleFullscreen={toggleFullscreenSpy}
        toggleSettingsIsExpanded={toggleSettingsIsExpandedSpy}
        serverVersion="4.0.0"
        savingPipelineOpen={savingPipelineOpenSpy}
        openCreateView={openCreateViewSpy}
        isAtlasDeployed={isAtlasDeployedSpy}
        updateView={updateViewSpy}
      />
    );
  });

  afterEach(function () {
    component = null;
  });

  it('renders the wrapper div', function () {
    expect(component.find(`.${styles['pipeline-toolbar']}`)).to.be.present();
  });

  it('renders the builder toolbar', function () {
    expect(
      component.find(`.${styles['pipeline-toolbar']}`)
    ).to.have.descendants(PipelineBuilderToolbar);
  });

  it('renders the preview toolbar', function () {
    expect(
      component.find(`.${styles['pipeline-toolbar']}`)
    ).to.have.descendants(PipelinePreviewToolbar);
  });
});
