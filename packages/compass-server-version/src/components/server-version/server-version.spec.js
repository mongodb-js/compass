import React from 'react';
import { mount } from 'enzyme';

import ServerVersion from 'components/server-version';
import styles from './server-version.less';

describe('ServerVersion [Component]', () => {
  context('when the version number is null', () => {
    const component = mount(<ServerVersion versionDistro="Community" />);

    it('does not render', () => {
      expect(component.find(`.${styles['server-version']}`)).to.not.be.present();
    });
  });

  context('when the distro is null', () => {
    const component = mount(<ServerVersion versionNumber="3.4.6" />);

    it('does not render', () => {
      expect(component.find(`.${styles['server-version']}`)).to.not.be.present();
    });
  });

  context('when the version number and distro are provided', () => {
    const component = mount(<ServerVersion versionNumber="3.4.6" versionDistro="Community" />);

    it('renders the version number and distro', () => {
      expect(component.find(`.${styles['server-version']}`)).to.have.
        text('MongoDB 3.4.6 Community');
    });
  });
});
