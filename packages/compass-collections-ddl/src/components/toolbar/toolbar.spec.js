import React from 'react';
import { mount } from 'enzyme';

import Toolbar from 'components/toolbar';
import styles from './toolbar.less';

describe('Toolbar [Component]', () => {
  context('when the distribution is readonly', () => {
    let component;
    let toggleIsVisibleSpy;
    let changeDatabaseNameSpy;
    let resetSpy;

    beforeEach(() => {
      toggleIsVisibleSpy = sinon.spy();
      resetSpy = sinon.spy();
      changeDatabaseNameSpy = sinon.spy();
      component = mount(
        <Toolbar
          isReadonly
          databaseName="test"
          changeDatabaseName={changeDatabaseNameSpy}
          toggleIsVisible={toggleIsVisibleSpy}
          reset={resetSpy} />
      );
    });

    afterEach(() => {
      toggleIsVisibleSpy = null;
      resetSpy = null;
      component = null;
    });

    it('renders the correct root classname', () => {
      expect(component.find(`.${styles.toolbar}`)).to.be.present();
    });

    it('does not render the create collection button', () => {
      expect(component.find('[text="Create Collection"]')).to.not.be.present();
    });
  });

  context('when the distribution is not readonly', () => {
    let component;
    let toggleIsVisibleSpy;
    let changeDatabaseNameSpy;
    let resetSpy;

    beforeEach(() => {
      toggleIsVisibleSpy = sinon.spy();
      changeDatabaseNameSpy = sinon.spy();
      resetSpy = sinon.spy();
      component = mount(
        <Toolbar
          isReadonly={false}
          databaseName="test"
          changeDatabaseName={changeDatabaseNameSpy}
          toggleIsVisible={toggleIsVisibleSpy}
          reset={resetSpy} />
      );
    });

    afterEach(() => {
      toggleIsVisibleSpy = null;
      resetSpy = null;
      component = null;
    });

    it('renders the correct root classname', () => {
      expect(component.find(`.${styles.toolbar}`)).to.be.present();
    });

    it('renders the create collection button', () => {
      expect(component.find('[text="Create Collection"]')).to.be.present();
    });
  });
});
