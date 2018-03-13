import React from 'react';
import { mount } from 'enzyme';

import PipelineBuilderToolbar from 'components/pipeline-builder-toolbar';
import styles from './pipeline-builder-toolbar.less';

describe('PipelineBuilderToolbar [Component]', () => {
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

    component = mount(
      <PipelineBuilderToolbar
        stageAdded={stageAddedSpy}
        viewChanged={viewChangedSpy}
        savePipelineModalToggle={saveSpy}
        copyToClipboard={copyToClipboardSpy} />
    );
  });

  afterEach(() => {
    component = null;
  });

  it('renders the wrapper div', () => {
    expect(component.find(`.${styles['pipeline-builder-toolbar']}`)).to.be.present();
  });

  it('renders the add stage button', () => {
    expect(component.find(`.${styles['pipeline-builder-toolbar-add-stage-button']}`)).
      to.have.text('Add Stage');
  });

  it('renders the copy to clipboard button', () => {
    expect(component.find(`.${styles['pipeline-builder-toolbar-copy-to-clipboard-button']}`)).
      to.be.present();
  });
});
