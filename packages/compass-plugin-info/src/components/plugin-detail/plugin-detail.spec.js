import React from 'react';
import { mount } from 'enzyme';

import PluginDetail from 'components/plugin-detail';
import styles from './plugin-detail.less';
import { corePlugin, errPlugin } from '../../../test/renderer/fixtures';

describe('PluginDetail [Component]', () => {
  describe('#render', () => {
    context('when the plugin has no error', () => {
      context('when the plugin is activated', () => {
        let component;

        beforeEach(() => {
          component = mount(
            <PluginDetail metadata={corePlugin.metadata} isActivated isExpanded={false} />
          );
        });

        afterEach(() => {
          component = null;
        });

        it('renders the plugin detail div', () => {
          expect(component.find(`.${styles['plugin-detail']}`)).to.be.present();
        });

        it('does not render the plugin error div', () => {
          expect(component.find(`.${styles['plugin-detail-has-error']}`)).to.not.be.present();
        });

        it('renders the expand div', () => {
          expect(component.find(`.${styles['plugin-detail-expand']}`)).to.be.present();
        });

        it('renders the product name div', () => {
          expect(component.find(`.${styles['plugin-detail-product-name']}`)).
            to.have.text(corePlugin.productName);
        });

        it('renders the name div', () => {
          expect(component.find(`.${styles['plugin-detail-name']}`)).
            to.have.text(corePlugin.name);
        });

        it('renders the version div', () => {
          expect(component.find(`.${styles['plugin-detail-version']}`)).
            to.have.text(corePlugin.version);
        });

        it('renders the description div', () => {
          expect(component.find(`.${styles['plugin-detail-description']}`)).
            to.have.text(corePlugin.description);
        });

        it('renders the activated div', () => {
          expect(component.find(`.${styles['plugin-detail-is-activated']}`)).to.be.present();
        });

        it('renders the activated icon', () => {
          expect(component.find('.fa-check-circle')).to.be.present();
        });
      });
    });

    context('when the plugin has an error', () => {
      context('when the plugin is expanded', () => {
        let component;

        beforeEach(() => {
          component = mount(
            <PluginDetail
              metadata={errPlugin.metadata}
              error={errPlugin.error}
              isActivated={false}
              isExpanded />
          );
        });

        afterEach(() => {
          component = null;
        });

        it('renders the plugin error div', () => {
          expect(component.find(`.${styles['plugin-detail-has-error']}`)).to.be.present();
        });

        it('renders the not activated icon', () => {
          expect(component.find('.fa-exclamation-circle')).to.be.present();
        });

        it('renders the collapse icon', () => {
          expect(component.find('.fa-minus-square-o')).to.be.present();
        });
      });

      context('when the plugin is not expanded', () => {
        let component;

        beforeEach(() => {
          component = mount(
            <PluginDetail
              metadata={errPlugin.metadata}
              error={errPlugin.error}
              isActivated={false}
              isExpanded={false} />
          );
        });

        afterEach(() => {
          component = null;
        });

        it('renders the expand icon', () => {
          expect(component.find('.fa-plus-square-o')).to.be.present();
        });
      });
    });
  });
});
