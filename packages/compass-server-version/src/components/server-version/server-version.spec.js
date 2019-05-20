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

  context('when connected to DataLake', () => {
    const component = mount(<ServerVersion versionNumber="3.4.6" versionDistro="Community" isDataLake dataLakeVersion="1.0.1"/>);

    it('renders the version number and distro', () => {
      expect(component.find(`.${styles['server-version']}`)).to.have.
      text('Atlas Data Lake 1.0.1');
    });
  });
  context('when connected to DataLake and no version available', () => {
    const component = mount(<ServerVersion versionNumber="3.4.6" versionDistro="Community" isDataLake dataLakeVersion={null}/>);

    it('renders the version number and distro', () => {
      expect(component.find(`.${styles['server-version']}`)).to.have.
      text('Atlas Data Lake ');
    });
  });
});
