import React from 'react';
import { mount } from 'enzyme';
import sinon from 'sinon';
import { expect } from 'chai';

import { StageCollapser } from './stage-collapser';

describe('StageCollaper [Component]', function() {
  context('when the stage is expanded', function() {
    let component;
    const spy = sinon.spy();

    beforeEach(function() {
      component = mount(
        <StageCollapser
          isExpanded
          index={1}
          onChange={spy} />
      );
    });

    afterEach(function() {
      component = null;
    });

    it('renders the correct root classname', function() {
      expect(component.find('StageCollapser')).to.be.present();
    });

    it('renders the collapse text', function() {
      expect(component.find('button')).to.have.prop('title', 'Collapse');
    });

    it('renders the collapse button', function() {
      expect(component.find('Icon').first()).to.have.prop('glyph', 'ChevronDown');
    });
  });

  context('when the stage is collapsed', function() {
    let component;
    const spy = sinon.spy();

    beforeEach(function() {
      component = mount(
        <StageCollapser
          isExpanded={false}
          index={1}
          onChange={spy} />
      );
    });

    afterEach(function() {
      component = null;
    });

    it('renders the expand text', function() {
      expect(component.find('button')).to.have.prop('title', 'Expand');
    });

    it('renders the expand button', function() {
      expect(component.find('Icon').first()).to.have.prop('glyph', 'ChevronRight');
    });
  });

  context('when clicking on the button', function() {
    let component;
    const spy = sinon.spy();

    beforeEach(function() {
      component = mount(
        <StageCollapser
          isExpanded={false}
          index={1}
          onChange={spy} />
      );
    });

    afterEach(function() {
      component = null;
    });

    it('toggles the expansion and sets as modified', function() {
      component.find('button').simulate('click');
      expect(spy.calledWith(1)).to.equal(true);
    });
  });
});
