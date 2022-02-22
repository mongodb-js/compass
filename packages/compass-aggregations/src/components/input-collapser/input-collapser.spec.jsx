import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import { expect } from 'chai';

import InputCollapser from '../input-collapser';
import styles from './input-collapser.module.less';

describe('InputBuilderToolbar [Component]', function() {
  let component;
  let toggleSpy;

  beforeEach(function() {
    toggleSpy = sinon.spy();
    component = shallow(
      <InputCollapser
        toggleInputDocumentsCollapsed={toggleSpy}
        isExpanded />
    );
  });

  afterEach(function() {
    component = null;
  });

  it('renders the wrapper div', function() {
    expect(component.find(`.${styles['input-collapser']}`)).to.be.present();
  });

  it('renders the button', function() {
    expect(component.find(`.${styles['input-collapser']} button`)).to.be.present();
  });

  context('when clicking the collapse button', function() {
    beforeEach(function() {
      component.find(`.${styles['input-collapser']} button`).simulate('click');
    });

    it('toggles the expanded state', function() {
      expect(toggleSpy.calledOnce).to.equal(true);
    });
  });
});
