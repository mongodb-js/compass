import React from 'react';
import { mount } from 'enzyme';

import License from 'components/license';
import styles from './license.less';

describe('License [Component]', () => {
  context('when the license is visible', () => {
    let component;

    beforeEach(() => {
      component = mount(<License isVisible />);
    });

    afterEach(() => {
      component = null;
    });

    it('renders the correct root classname', () => {
      expect(component.find(`.${styles.modal}`)).to.be.present();
    });
  });

  context('when the license is not visible', () => {

  });
});
