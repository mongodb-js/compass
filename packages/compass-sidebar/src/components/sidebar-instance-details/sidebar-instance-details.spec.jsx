import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import SidebarInstanceDetails from './sidebar-instance-details';

import styles from './sidebar-instance-details.module.less';

describe('SidebarInstanceDetails [Component]', function () {
  context('when details are expanded', function () {
    const isExpanded = true;
    let component;

    const instance = {
      build: {},
      dataLake: {},
      topologyDescription: {},
    };
    const connectionOptions = {};

    beforeEach(function () {
      component = shallow(
        <SidebarInstanceDetails
          instance={instance}
          connectionOptions={connectionOptions}
          isExpanded={isExpanded}
        />
      );
    });

    afterEach(function () {
      component = null;
    });

    it('renders details', function () {
      expect(
        component.find(`.${styles['sidebar-instance-details-container']}`)
      ).to.be.present();
    });
  });

  context('when details are collapsed', function () {
    const isExpanded = false;
    const detailsPlugins = [];
    let component;

    beforeEach(function () {
      component = shallow(
        <SidebarInstanceDetails
          isExpanded={isExpanded}
          detailsPlugins={detailsPlugins}
        />
      );
    });

    afterEach(function () {
      component = null;
    });

    it('does not render details', function () {
      expect(
        component.find(`.${styles['sidebar-instance-details-container']}`)
      ).to.be.not.present();
      expect(
        component.find(`.${styles['sidebar-instance-details']}`)
      ).to.be.present();
    });
  });
});
