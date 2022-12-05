import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import { expect } from 'chai';

import InputCollapser from '../input-collapser';

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

  context('when clicking the  button', function() {
    beforeEach(function() {
      component.simulate('click');
    });

    it('toggles the expanded state', function() {
      expect(toggleSpy.calledOnce).to.equal(true);
    });
  });
});
