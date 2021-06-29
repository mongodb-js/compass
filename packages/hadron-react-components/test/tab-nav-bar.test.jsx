import React from 'react';
import chaiEnzyme from 'chai-enzyme';
import sinon from 'sinon';
import chai, { expect } from 'chai';
import { shallow, mount } from 'enzyme';

import { TabNavBar } from '../';

chai.use(chaiEnzyme());

describe('<TabNavBar />', () => {
  const tabs = [ 'one', 'two' ];
  const views = [
    <div className="tab-one" />,
    <div className="tab-two" />
  ];

  context('when using the defaults', () => {
    const component = shallow(
      <TabNavBar tabs={tabs} views={views} />
    );

    it('renders the light theme', () => {
      expect(component.find('.test-tab-nav-bar-tabs').props().darkMode).to.equal(false);
    });

    it('renders the tabs', () => {
      expect(component.find('.test-tab-nav-bar-tab')).to.have.length(2);
    });

    it('mounts all the tabs', () => {
      expect(component.find('.tab-one')).to.exist;
      expect(component.find('.tab-two')).to.exist;
    });

    it('defaults the active tab to the first', () => {
      expect(component.find('.test-tab-nav-bar-tabs').props().selected).to.equal(0);
    });
  });

  context('when setting darkMode true', () => {
    const component = shallow(
      <TabNavBar tabs={tabs} views={views} darkMode />
    );

    it('renders the supplied theme', () => {
      expect(component.find('.test-tab-nav-bar-tabs').props().darkMode).to.equal(true);
    });
  });

  context('when setting the active index', () => {
    const component = shallow(
      <TabNavBar tabs={tabs} views={views} activeTabIndex={1} />
    );

    it('defaults the active tab to the supplied index', () => {
      expect(component.find('.test-tab-nav-bar-tabs').props().selected).to.equal(1);
    });
  });

  context('when providing a tab clicked handler', () => {
    const clickSpy = sinon.spy();
    const component = mount(
      <TabNavBar
        tabs={tabs}
        views={views}
        onTabClicked={clickSpy}
        activeTabIndex={1}
      />
    );

    context('when clicking a tab', () => {
      before(() => {
        component.find('.test-tab-nav-bar-tab').first().find('button').simulate('click');
      });

      it('calls the click handler', () => {
        expect(clickSpy.called).to.be.true;
        expect(clickSpy.calledWith(0, 'one')).to.be.true;
      });
    });
  });
});
