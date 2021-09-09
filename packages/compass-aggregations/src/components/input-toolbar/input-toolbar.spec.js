import React from 'react';
import { shallow } from 'enzyme';

import InputToolbar from '../input-toolbar';
import InputBuilderToolbar from '../input-builder-toolbar';
import InputPreviewToolbar from '../input-preview-toolbar';

import styles from './input-toolbar.module.less';

describe('InputToolbar [Component]', () => {
  let component;
  let toggleSpy;
  let refreshSpy;

  beforeEach(() => {
    toggleSpy = sinon.spy();
    refreshSpy = sinon.spy();

    component = shallow(
      <InputToolbar
        isExpanded
        count={0}
        refreshInputDocuments={refreshSpy}
        toggleInputDocumentsCollapsed={toggleSpy} />
    );
  });

  afterEach(() => {
    component = null;
  });

  it('renders the wrapper div', () => {
    expect(component.find(`.${styles['input-toolbar']}`)).to.be.present();
  });

  it('renders the input builder toolbar', () => {
    expect(component.find(`.${styles['input-toolbar']}`))
      .to.have.descendants(InputBuilderToolbar);
  });

  it('renders the input preview toolbar', () => {
    expect(component.find(`.${styles['input-toolbar']}`))
      .to.have.descendants(InputPreviewToolbar);
  });
});
