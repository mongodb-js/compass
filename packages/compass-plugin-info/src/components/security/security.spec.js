import React from 'react';
import { mount } from 'enzyme';

import Security from 'components/security';
import styles from './security.less';
import pluginStyles from '../plugin/plugin.less';
import { corePlugin } from '../../../test/renderer/fixtures';

describe('Security [Component]', () => {
  describe('#render', () => {
    context('when the component is visible', () => {
      let component;

      beforeEach(() => {
        component = mount(<Security isVisible plugins={[ corePlugin ]} />);
      });

      afterEach(() => {
        component = null;
      });

      it('renders the root component', () => {
        expect(component.find(`.${styles['security-is-visible']}`)).to.be.present();
      });

      it('renders the plugins', () => {
        expect(component.find(`.${pluginStyles.plugin}`)).to.have.length(1);
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
