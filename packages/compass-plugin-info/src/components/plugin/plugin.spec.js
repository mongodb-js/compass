import React from 'react';
import { mount } from 'enzyme';

import Plugin from 'components/plugin';
import styles from './plugin.less';
import errorStyles from '../plugin-error/plugin-error.less';
import { corePlugin, errPlugin } from '../../../test/renderer/fixtures';

describe('Plugin [Component]', () => {
  describe('#render', () => {
    context('when the plugin has no error', () => {
      let component;

      beforeEach(() => {
        component = mount(<Plugin metadata={corePlugin.metadata} isActivated />);
      });

      afterEach(() => {
        component = null;
      });

      it('renders the plugin div', () => {
        expect(component.find(`.${styles.plugin}`)).to.be.present();
      });
    });

    context('when the plugin has an error', () => {
      context('when the plugin is expanded', () => {
        let component;

        beforeEach(() => {
          component = mount(
            <Plugin metadata={errPlugin.metadata} isActivated error={errPlugin.error} />
          );
          component.setState({ isExpanded: true });
        });

        afterEach(() => {
          component = null;
        });

        it('renders the plugin div', () => {
          expect(component.find(`.${styles.plugin}`)).to.be.present();
        });

        it('renders the plugin error div', () => {
          expect(component.find(`.${errorStyles['plugin-error']}`)).to.be.present();
        });
      });

      context('when the plugin is not expanded', () => {
        let component;

        beforeEach(() => {
          component = mount(
            <Plugin metadata={errPlugin.metadata} isActivated error={errPlugin.error} />
          );
        });

        afterEach(() => {
          component = null;
        });

        it('does not render the plugin error div', () => {
          expect(component.find(`.${errorStyles['plugin-error']}`)).to.not.be.present();
        });
      });
    });
  });
});
