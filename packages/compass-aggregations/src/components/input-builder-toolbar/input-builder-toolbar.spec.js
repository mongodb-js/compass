import React from 'react';
import { shallow } from 'enzyme';

import InputBuilderToolbar from 'components/input-builder-toolbar';
import InputCollapser from 'components/input-collapser';
import styles from './input-builder-toolbar.less';

describe('InputBuilderToolbar [Component]', () => {
  let component;
  let toggleSpy;

  beforeEach(() => {
    toggleSpy = sinon.spy();
    component = shallow(
      <InputBuilderToolbar
        toggleInputDocumentsCollapsed={toggleSpy}
        isExpanded
        count={20} />
    );
  });

  afterEach(() => {
    component = null;
  });

  it('renders the wrapper div', () => {
    expect(component.find(`.${styles['input-builder-toolbar']}`)).to.be.present();
  });

  it('renders the collapser', () => {
    expect(component.find(`.${styles['input-builder-toolbar']}`)).
      to.have.descendants(InputCollapser);
  });

  it('renders the input count', () => {
    expect(component.find(`.${styles['input-builder-toolbar-count']}`)).
      to.have.text('20 Input Documents');
  });
});
