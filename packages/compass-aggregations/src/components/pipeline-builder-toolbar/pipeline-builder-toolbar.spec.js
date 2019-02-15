import React from 'react';
import { mount } from 'enzyme';

import PipelineBuilderToolbar from './pipeline-builder-toolbar';
import styles from './pipeline-builder-toolbar.less';

describe('PipelineBuilderToolbar [Component]', () => {
  let component;
  let savedPipelinesListToggleSpy;
  let getSavedPipelinesSpy;
  let exportToLanguageSpy;
  let newPipelineSpy;
  let newPipelineFromTextSpy;
  let clonePipelineSpy;
  let nameChangedSpy;
  let saveSpy;
  let setIsModifiedSpy;
  let collationCollapseSpy;
  let toggleOverviewSpy;

  beforeEach(() => {
    savedPipelinesListToggleSpy = sinon.spy();
    getSavedPipelinesSpy = sinon.spy();
    exportToLanguageSpy = sinon.spy();
    newPipelineSpy = sinon.spy();
    newPipelineFromTextSpy = sinon.spy();
    clonePipelineSpy = sinon.spy();
    nameChangedSpy = sinon.spy();
    saveSpy = sinon.spy();
    setIsModifiedSpy = sinon.spy();
    collationCollapseSpy = sinon.spy();
    toggleOverviewSpy = sinon.spy();

    component = mount(
      <PipelineBuilderToolbar
        savedPipelinesListToggle={savedPipelinesListToggleSpy}
        getSavedPipelines={getSavedPipelinesSpy}
        saveCurrentPipeline={saveSpy}
        savedPipeline={{ isListVisible: true }}
        newPipeline={newPipelineSpy}
        newPipelineFromText={newPipelineFromTextSpy}
        clonePipeline={clonePipelineSpy}
        nameChanged={nameChangedSpy}
        name=""
        isModified
        isCollationExpanded
        isOverviewOn={false}
        toggleOverview={toggleOverviewSpy}
        setIsModified={setIsModifiedSpy}
        collationCollapseToggled={collationCollapseSpy}
        exportToLanguage={exportToLanguageSpy}
      />
    );
  });

  afterEach(() => {
    component = null;
    savedPipelinesListToggleSpy = null;
    getSavedPipelinesSpy = null;
    exportToLanguageSpy = null;
    newPipelineSpy = null;
    newPipelineFromTextSpy = null;
    clonePipelineSpy = null;
    nameChangedSpy = null;
    saveSpy = null;
    setIsModifiedSpy = null;
    toggleOverviewSpy = null;
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
