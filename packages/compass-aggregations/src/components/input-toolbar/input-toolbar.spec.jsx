import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import { expect } from 'chai';

import InputToolbar from '../input-toolbar';
import InputBuilderToolbar from '../input-builder-toolbar';
import InputPreviewToolbar from '../input-preview-toolbar';

import styles from './input-toolbar.module.less';

describe('InputToolbar [Component]', function() {
  let component;
  let toggleSpy;
  let refreshSpy;

  beforeEach(function() {
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

  afterEach(function() {
    component = null;
  });

  it('renders the wrapper div', function() {
    expect(component.find(`.${styles['input-toolbar']}`)).to.be.present();
  });

  it('renders the input builder toolbar', function() {
    expect(component.find(`.${styles['input-toolbar']}`))
      .to.have.descendants(InputBuilderToolbar);
  });

  it('renders the input preview toolbar', function() {
    expect(component.find(`.${styles['input-toolbar']}`))
      .to.have.descendants(InputPreviewToolbar);
  });
});
