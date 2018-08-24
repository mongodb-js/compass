import React from 'react';
import { mount } from 'enzyme';

import CollationCollapser from 'components/collation-collapser';
import styles from './collation-collapser.less';

describe('CollationCollaper [Component]', () => {
  context('when the collation is expanded', () => {
    let component;
    const spy = sinon.spy();

    beforeEach(() => {
      component = mount(
        <CollationCollapser
          isCollationExpanded
          collationCollapseToggled={spy} />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('renders the correct root classname', () => {
      expect(component.find(`.${styles['collation-collapser']}`)).to.be.present();
    });

    it('renders the collapse text', () => {
      expect(component.find('button')).to.have.prop('title', 'Collapse');
    });

    it('renders the collapse button', () => {
      expect(component.find('.fa-angle-down')).to.be.present();
    });
  });

  context('when the collation is collapsed', () => {
    let component;
    const spy = sinon.spy();

    beforeEach(() => {
      component = mount(
        <CollationCollapser
          isCollationExpanded={false}
          collationCollapseToggled={spy} />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('renders the expand text', () => {
      expect(component.find('button')).to.have.prop('title', 'Expand');
    });

    it('renders the expand button', () => {
      expect(component.find('.fa-angle-right')).to.be.present();
    });
  });

  context('when clicking on the button', () => {
    let component;
    const spy = sinon.spy();

    beforeEach(() => {
      component = mount(
        <CollationCollapser
          isCollationExpanded={false}
          collationCollapseToggled={spy} />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('toggles the expansion and sets as modified', () => {
      component.find('button').simulate('click');
      expect(spy.calledWith(1)).to.equal(false);
    });
  });
});
