import React from 'react';
import { mount } from 'enzyme';
import sinon from 'sinon';
import { expect } from 'chai';

import OverviewToggler from './overview-toggler';
import styles from './overview-toggler.module.less';

describe('OverviewToggler [Component]', function() {
  context('when expanded', function() {
    let component;
    const spy = sinon.spy();

    beforeEach(function() {
      component = mount(
        <OverviewToggler
          isOverviewOn={false}
          overviewToggled={spy}
          toggleOverview={spy}
        />
      );
    });

    afterEach(function() {
      component = null;
    });

    it('renders the correct root classname', function() {
      expect(component.find(`.${styles['overview-toggler']}`)).to.be.present();
    });

    it('renders the collapse text', function() {
      expect(component.find('button')).to.have.prop(
        'title',
        'Collapse all stages'
      );
    });

    it('renders the collapse button', function() {
      expect(component.find('.fa-angle-down')).to.be.present();
    });
  });

  context('when is off (all stages collapsed)', function() {
    let component;
    const spy = sinon.spy();

    beforeEach(function() {
      component = mount(
        <OverviewToggler
          isOverviewOn
          overviewToggled={spy}
          toggleOverview={spy}
        />
      );
    });

    afterEach(function() {
      component = null;
    });

    it('renders the expand text', function() {
      expect(component.find('button')).to.have.prop(
        'title',
        'Expand all stages'
      );
    });

    it('renders the expand button', function() {
      expect(component.find('.fa-angle-right')).to.be.present();
    });
  });

  context('when clicking on the button', function() {
    let component;
    const spy = sinon.spy();

    beforeEach(function() {
      component = mount(
        <OverviewToggler
          isOverviewOn
          overviewToggled={spy}
          toggleOverview={spy}
        />
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
