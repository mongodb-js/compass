import React from 'react';
import { mount } from 'enzyme';

import AutoUpdate from 'components/auto-update';
import store from 'stores';
import styles from './auto-update.less';

describe('AutoUpdate [Component]', () => {
  context('when the state is visible', () => {
    let component;

    beforeEach(() => {
      component = mount(<AutoUpdate store={store} version="1.12.0" isVisible />);
    });

    afterEach(() => {
      component = null;
    });

    it('renders the correct root classname', () => {
      expect(component.find(`.${styles['auto-update']}`)).to.be.present();
    });

    it('renders the banner as visible', () => {
      expect(component.find(`.${styles['auto-update-is-visible']}`)).to.be.present();
    });
  });

  context('when the state is not visible', () => {

  });
});
