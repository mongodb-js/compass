import React from 'react';
import { mount } from 'enzyme';
import sinon from 'sinon';
import { expect } from 'chai';

import CollationCollapser from './collation-collapser';
import styles from './collation-collapser.module.less';

describe('CollationCollaper [Component]', function() {
  context('when the collation is expanded', function() {
    let component;
    const spy = sinon.spy();

    beforeEach(function() {
      component = mount(
        <CollationCollapser
          isCollationExpanded
          collationCollapseToggled={spy} />
      );
    });

    afterEach(function() {
      component = null;
    });

    it('renders the correct root classname', function() {
      expect(component.find(`.${styles['collation-collapser']}`)).to.be.present();
    });

    it('renders the collapse text', function() {
      expect(component.find('button')).to.have.prop('title', 'Collapse');
    });

    it('renders the collapse button', function() {
      expect(component.find('.fa-caret-down')).to.be.present();
    });
  });

  context('when the collation is collapsed', function() {
    let component;
    const spy = sinon.spy();

    beforeEach(function() {
      component = mount(
        <CollationCollapser
          isCollationExpanded={false}
          collationCollapseToggled={spy} />
      );
    });

    afterEach(function() {
      component = null;
    });

    it('renders the expand text', function() {
      expect(component.find('button')).to.have.prop('title', 'Expand');
    });

    it('renders the expand button', function() {
      expect(component.find('.fa-caret-right')).to.be.present();
    });
  });

  context('when clicking on the button', function() {
    let component;
    const spy = sinon.spy();

    beforeEach(function() {
      component = mount(
        <CollationCollapser
          isCollationExpanded={false}
          collationCollapseToggled={spy} />
      );
    });

    afterEach(function() {
      component = null;
    });

    it('toggles the expansion and sets as modified', function() {
      component.find('button').simulate('click');
      expect(spy.calledWith(1)).to.equal(false);
    });
  });
});
