import React from 'react';
import { mount } from 'enzyme';

import Toolbar from 'components/toolbar';
import styles from './toolbar.less';

describe('Toolbar [Component]', () => {
  context('when the distribution is readonly', () => {
    let component;
    let showCreateDatabaseSpy;
    let clearErrorSpy;

    beforeEach(() => {
      showCreateDatabaseSpy = sinon.spy();
      clearErrorSpy = sinon.spy();
      component = mount(
        <Toolbar
          isReadonly
          showCreateDatabase={showCreateDatabaseSpy}
          clearError={clearErrorSpy} />
      );
    });

    afterEach(() => {
      showCreateDatabaseSpy = null;
      clearErrorSpy = null;
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
    let clearErrorSpy;

    beforeEach(() => {
      showCreateDatabaseSpy = sinon.spy();
      clearErrorSpy = sinon.spy();
      component = mount(
        <Toolbar
          isReadonly={false}
          showCreateDatabase={showCreateDatabaseSpy}
          clearError={clearErrorSpy} />
      );
    });

    afterEach(() => {
      showCreateDatabaseSpy = null;
      clearErrorSpy = null;
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
