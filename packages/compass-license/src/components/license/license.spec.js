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

    it('renders the visible modal', () => {
      expect(component.find(`.${styles['modal-is-visible']}`)).to.be.present();
    });
  });

  context('when the license is not visible', () => {
    let component;

    beforeEach(() => {
      component = mount(<License isVisible={false} />);
    });

    afterEach(() => {
      component = null;
    });

    it('renders the modal as hidden', () => {
      expect(component.find(`.${styles['modal-is-visible']}`)).to.not.be.present();
    });

    it('renders the default modal class', () => {
      expect(component.find(`.${styles.modal}`)).to.be.present();
    });
  });
});
