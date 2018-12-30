import React from 'react';
import { mount } from 'enzyme';

import Toolbar from 'components/toolbar';
import styles from './toolbar.less';

describe('Toolbar [Component]', () => {
  context('when the distribution is readonly', () => {
    let component;
    let showCreateDatabaseSpy;

    beforeEach(() => {
      showCreateDatabaseSpy = sinon.spy();
      component = mount(<Toolbar isReadonly showCreateDatabase={showCreateDatabaseSpy} />);
    });

    afterEach(() => {
      showCreateDatabaseSpy = null;
      component = null;
    });

    it('renders the correct root classname', () => {
      expect(component.find(`.${styles.toolbar}`)).to.be.present();
    });

    it('does not render the create database button', () => {
      expect(component.find('[text="Create Database"]')).to.not.be.present();
    });
  });

  context('when the distribution is not readonly', () => {
    let component;
    let showCreateDatabaseSpy;

    beforeEach(() => {
      showCreateDatabaseSpy = sinon.spy();
      component = mount(<Toolbar isReadonly={false} showCreateDatabase={showCreateDatabaseSpy} />);
    });

    afterEach(() => {
      showCreateDatabaseSpy = null;
      component = null;
    });

    it('renders the correct root classname', () => {
      expect(component.find(`.${styles.toolbar}`)).to.be.present();
    });

    it('renders the create database button', () => {
      expect(component.find('[text="Create Database"]')).to.be.present();
    });

    context('when clicking on the button', () => {
      it.skip('calls the show create database action creator', () => {
        component.find('[text="Create Database"]').simulate('click');
        expect(showCreateDatabaseSpy.calledOnce).to.equal(true);
      });
    });
  });
});
