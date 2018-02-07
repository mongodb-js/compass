import React from 'react';
import { mount } from 'enzyme';
import { CODE } from 'modules/view';

import BuilderToolbar from 'components/builder-toolbar';
import styles from './builder-toolbar.less';

describe('BuilderToolbar [Component]', () => {
  let component;
  let stageAddedSpy;
  let viewChangedSpy;
  let copyToClipboardSpy;

  beforeEach(() => {
    stageAddedSpy = sinon.spy();
    viewChangedSpy = sinon.spy();
    copyToClipboardSpy = sinon.spy();

    component = mount(
      <BuilderToolbar
        view={CODE}
        stageAdded={stageAddedSpy}
        viewChanged={viewChangedSpy}
        copyToClipboard={copyToClipboardSpy} />
    );
  });

  afterEach(() => {
    component = null;
  });

  it('renders the wrapper div', () => {
    expect(component.find(`.${styles['builder-toolbar']}`)).to.be.present();
  });

  it('renders the view switcher', () => {
    expect(component.find('.view-switcher-label')).to.have.text('VIEW');
  });

  it('renders the add stage button', () => {
    expect(component.find(`.${styles['builder-toolbar-add-stage-button']}`)).
      to.have.text('Add Stage');
  });

  it('renders the copy to clipboard button', () => {
    expect(component.find(`.${styles['builder-toolbar-copy-to-clipboard-button']}`)).
      to.be.present();
  });
});
