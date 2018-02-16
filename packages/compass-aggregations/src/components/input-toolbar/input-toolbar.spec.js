import React from 'react';
import { shallow } from 'enzyme';

import InputToolbar from 'components/input-toolbar';
import InputBuilderToolbar from 'components/input-builder-toolbar';
import InputPreviewToolbar from 'components/input-preview-toolbar';

import styles from './input-toolbar.less';

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
