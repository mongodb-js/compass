import React from 'react';
import { mount } from 'enzyme';

import Toolbar from 'components/toolbar';
import styles from './toolbar.less';

describe('Toolbar [Component]', () => {
  context('when the distribution is readonly', () => {
    let component;
    let showCreateDatabaseSpy;
    let resetSpy;

    beforeEach(() => {
      showCreateDatabaseSpy = sinon.spy();
      resetSpy = sinon.spy();
      component = mount(
        <Toolbar
          isReadonly
          showCreateDatabase={showCreateDatabaseSpy}
          reset={resetSpy} />
      );
    });

    afterEach(() => {
      showCreateDatabaseSpy = null;
      resetSpy = null;
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
    let resetSpy;

    beforeEach(() => {
      showCreateDatabaseSpy = sinon.spy();
      resetSpy = sinon.spy();
      component = mount(
        <Toolbar
          isReadonly={false}
          showCreateDatabase={showCreateDatabaseSpy}
          reset={resetSpy} />
      );
    });

    afterEach(() => {
      showCreateDatabaseSpy = null;
      resetSpy = null;
      component = null;
    });

    it('renders the correct root classname', () => {
      expect(component.find(`.${styles.toolbar}`)).to.be.present();
    });

    it('renders the create database button', () => {
      expect(component.find('[text="Create Database"]')).to.be.present();
    });
  });
});
