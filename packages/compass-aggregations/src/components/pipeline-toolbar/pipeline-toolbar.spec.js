import React from 'react';
import { shallow } from 'enzyme';
import { CODE } from 'modules/view';

import PipelineToolbar from 'components/pipeline-toolbar';
import PipelineBuilderToolbar from 'components/pipeline-builder-toolbar';
import PipelinePreviewToolbar from 'components/pipeline-preview-toolbar';

import styles from './pipeline-toolbar.less';

describe('PipelineToolbar [Component]', () => {
  let component;
  let stageAddedSpy;
  let viewChangedSpy;
  let copyToClipboardSpy;
  let saveSpy;

  beforeEach(() => {
    stageAddedSpy = sinon.spy();
    viewChangedSpy = sinon.spy();
    copyToClipboardSpy = sinon.spy();
    saveSpy = sinon.spy();

    component = shallow(
      <PipelineToolbar
        view={CODE}
        stageAdded={stageAddedSpy}
        viewChanged={viewChangedSpy}
        saveCurrentPipeline={saveSpy}
        savedPipeline={{ isNameValid: true }}
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
