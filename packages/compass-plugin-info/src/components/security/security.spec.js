import React from 'react';
import { mount } from 'enzyme';

import Security from 'components/security';
import styles from './security.less';

describe('Security [Component]', () => {
  describe('#render', () => {
    context('when the component is visible', () => {
      let component;

      beforeEach(() => {
        component = mount(<Security isVisible />);
      });

      afterEach(() => {
        component = null;
      });

      it('renders the root component', () => {
        expect(component.find(`.${styles['security-is-visible']}`)).to.be.present();
      });
    });

    context('when the component is not visible', () => {
      let component;

      beforeEach(() => {
        component = mount(<Security isVisible={false} />);
      });

      afterEach(() => {
        component = null;
      });

      it('renders the root component as hidden', () => {
        expect(component.find(`.${styles['security-is-visible']}`)).to.not.be.present();
      });
    });
  });
});
