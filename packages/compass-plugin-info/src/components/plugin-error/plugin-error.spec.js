import React from 'react';
import { mount } from 'enzyme';

import PluginError from 'components/plugin-error';
import styles from './plugin-error.less';
import { errPlugin } from '../../../test/renderer/fixtures';

describe('PluginError [Component]', () => {
  describe('#render', () => {
    let component;

    beforeEach(() => {
      component = mount(<PluginError error={errPlugin.error} />);
    });

    afterEach(() => {
      component = null;
    });

    it('renders the plugin error div', () => {
      expect(component.find(`.${styles['plugin-error']}`)).to.be.present();
    });

    it('renders the plugin error message', () => {
      expect(component.find(`.${styles['plugin-error-message']}`)).
        to.have.text(errPlugin.error.message);
    });

    it('renders the plugin error stack', () => {
      expect(component.find(`.${styles['plugin-error-stack']}`)).
        to.have.text(errPlugin.error.stack);
    });
  });
});
