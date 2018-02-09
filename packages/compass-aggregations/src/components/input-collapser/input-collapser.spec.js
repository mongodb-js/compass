import React from 'react';
import { shallow } from 'enzyme';

import InputCollapser from 'components/input-collapser';
import styles from './input-collapser.less';

describe('InputBuilderToolbar [Component]', () => {
  let component;
  let toggleSpy;

  beforeEach(() => {
    toggleSpy = sinon.spy();
    component = shallow(
      <InputCollapser
        toggleInputDocumentsCollapsed={toggleSpy}
        isExpanded />
    );
  });

  afterEach(() => {
    component = null;
  });

  it('renders the wrapper div', () => {
    expect(component.find(`.${styles['input-collapser']}`)).to.be.present();
  });

  it('renders the button', () => {
    expect(component.find(`.${styles['input-collapser']} button`)).to.be.present();
  });

  context('when clicking the collapse button', () => {
    beforeEach(() => {
      component.find(`.${styles['input-collapser']} button`).simulate('click');
    });

    it('toggles the expanded state', () => {
      expect(toggleSpy.calledOnce).to.equal(true);
    });
  });
});
