import React from 'react';
import { mount } from 'enzyme';

import Toolbar from 'components/toolbar';
import styles from './toolbar.less';

describe('Toolbar [Component]', () => {
  context('when the distribution is readonly', () => {
    let component;
    let openSpy;

    beforeEach(() => {
      openSpy = sinon.spy();
      component = mount(
        <Toolbar
          isReadonly
          databaseName="test"
          open={openSpy} />
      );
    });

    afterEach(() => {
      openSpy = null;
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
    let openSpy;

    beforeEach(() => {
      openSpy = sinon.spy();
      component = mount(
        <Toolbar
          isReadonly={false}
          databaseName="test"
          open={openSpy} />
      );
    });

    afterEach(() => {
      openSpy = null;
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
