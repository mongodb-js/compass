import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import { expect } from 'chai';

import InputBuilderToolbar from '../input-builder-toolbar';
import InputCollapser from '../input-collapser';
import styles from './input-builder-toolbar.module.less';

describe('InputBuilderToolbar [Component]', function() {
  let component;
  let toggleSpy;
  let refreshSpy;

  beforeEach(function() {
    toggleSpy = sinon.spy();
    refreshSpy = sinon.spy();

    component = shallow(
      <InputBuilderToolbar
        refreshInputDocuments={refreshSpy}
        toggleInputDocumentsCollapsed={toggleSpy}
        isExpanded
        count={20} />
    );
  });

  afterEach(function() {
    component = null;
  });

  it('renders the wrapper div', function() {
    expect(component.find(`.${styles['input-builder-toolbar']}`)).to.be.present();
  });

  it('renders the collapser', function() {
    expect(component.find(`.${styles['input-builder-toolbar']}`)).
      to.have.descendants(InputCollapser);
  });
});
