import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';

import ServerVersion from '../server-version';
import styles from './server-version.module.less';

describe('ServerVersion [Component]', function () {
  context('when the version number is null', function () {
    const component = mount(<ServerVersion versionDistro="Community" />);

    it('does not render', function () {
      expect(
        component.find(`.${styles['server-version']}`)
      ).to.not.be.present();
    });
  });

  context('when the distro is null', function () {
    const component = mount(<ServerVersion versionNumber="3.4.6" />);

    it('does not render', function () {
      expect(
        component.find(`.${styles['server-version']}`)
      ).to.not.be.present();
    });
  });

  context('when the version number and distro are provided', function () {
    const component = mount(
      <ServerVersion versionNumber="3.4.6" versionDistro="Community" />
    );

    it('renders the version number and distro', function () {
      expect(component.find(`.${styles['server-version-text']}`)).to.have.text(
        'MongoDB 3.4.6 Community'
      );
    });
  });

  context('when connected to DataLake', function () {
    const component = mount(
      <ServerVersion
        versionNumber="3.4.6"
        versionDistro="Community"
        isDataLake
        dataLakeVersion="1.0.1"
      />
    );

    it('renders the version number and distro', function () {
      expect(component.find(`.${styles['server-version-text']}`)).to.have.text(
        'Atlas Data Lake 1.0.1'
      );
    });
  });
  context('when connected to DataLake and no version available', function () {
    const component = mount(
      <ServerVersion
        versionNumber="3.4.6"
        versionDistro="Community"
        isDataLake
        dataLakeVersion={null}
      />
    );

    it('renders the version number and distro', function () {
      expect(component.find(`.${styles['server-version-text']}`)).to.have.text(
        'Atlas Data Lake '
      );
    });
  });
});
