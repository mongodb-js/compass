import React from 'react';
import { shallow } from 'enzyme';

import PipelineToolbar from './pipeline-toolbar';
import PipelineBuilderToolbar from './pipeline-builder-toolbar';
import PipelinePreviewToolbar from './pipeline-preview-toolbar';

import styles from './pipeline-toolbar.less';

describe('PipelineToolbar [Component]', () => {
  let component;
  let savedPipelinesListToggleSpy;
  let getSavedPipelinesSpy;
  let newPipelineSpy;
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

  beforeEach(() => {
    savedPipelinesListToggleSpy = sinon.spy();
    getSavedPipelinesSpy = sinon.spy();
    stageAddedSpy = sinon.spy();
    exportToLanguageSpy = sinon.spy();
    newPipelineSpy = sinon.spy();
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

    component = shallow(
      <PipelineToolbar
        savedPipelinesListToggle={savedPipelinesListToggleSpy}
        getSavedPipelines={getSavedPipelinesSpy}
        stageAdded={stageAddedSpy}
        saveCurrentPipeline={saveSpy}
        savedPipeline={{ isNameValid: true }}
        newPipeline={newPipelineSpy}
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
      />
    );
  });

  afterEach(() => {
    component = null;
  });

  it('renders the wrapper div', () => {
    expect(component.find(`.${styles['pipeline-toolbar']}`)).to.be.present();
  });

  it('renders the builder toolbar', () => {
    expect(component.find(`.${styles['pipeline-toolbar']}`)).to.have.descendants(PipelineBuilderToolbar);
  });

  it('renders the preview toolbar', () => {
    expect(component.find(`.${styles['pipeline-toolbar']}`)).to.have.descendants(PipelinePreviewToolbar);
  });
});
