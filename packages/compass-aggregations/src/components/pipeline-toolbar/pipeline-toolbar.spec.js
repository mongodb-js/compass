import React from 'react';
import { shallow } from 'enzyme';

import PipelineToolbar from 'components/pipeline-toolbar';
import PipelineBuilderToolbar from 'components/pipeline-builder-toolbar';
import PipelinePreviewToolbar from 'components/pipeline-preview-toolbar';

import styles from './pipeline-toolbar.less';

describe('PipelineToolbar [Component]', () => {
  let component;
  let savedPipelinesListToggleSpy;
  let getSavedPipelinesSpy;
  let newPipelineSpy;
  let clonePipelineSpy;
  let nameChangedSpy;
  let stageAddedSpy;
  let copyToClipboardSpy;
  let saveSpy;
  let setIsModifiedSpy;
  let toggleCommentsSpy;

  beforeEach(() => {
    savedPipelinesListToggleSpy = sinon.spy();
    getSavedPipelinesSpy = sinon.spy();
    stageAddedSpy = sinon.spy();
    copyToClipboardSpy = sinon.spy();
    newPipelineSpy = sinon.spy();
    clonePipelineSpy = sinon.spy();
    nameChangedSpy = sinon.spy();
    saveSpy = sinon.spy();
    setIsModifiedSpy = sinon.spy();
    toggleCommentsSpy = sinon.spy();

    component = shallow(
      <PipelineToolbar
        savedPipelinesListToggle={savedPipelinesListToggleSpy}
        getSavedPipelines={getSavedPipelinesSpy}
        stageAdded={stageAddedSpy}
        saveCurrentPipeline={saveSpy}
        savedPipeline={{ isNameValid: true }}
        newPipeline={newPipelineSpy}
        clonePipeline={clonePipelineSpy}
        toggleComments={toggleCommentsSpy}
        nameChanged={nameChangedSpy}
        setIsModified={setIsModifiedSpy}
        isModified
        isCommenting
        name=""
        copyToClipboard={copyToClipboardSpy} />
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
