import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import SidebarInstanceDetails from './sidebar-instance-details';

import styles from './sidebar-instance-details.module.less';

describe('SidebarInstanceDetails [Component]', () => {
  context('when details are expanded', () => {
    const isExpanded = true;
    const detailsPlugins = [];
    const isSidebarCollapsed = false;
    let component;

    beforeEach(() => {
      component = shallow(
        <SidebarInstanceDetails
          isExpanded={isExpanded}
          detailsPlugins={detailsPlugins}
          isSidebarCollapsed={isSidebarCollapsed} />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('renders details', () => {
      expect(component.find(`.${styles['sidebar-instance-details-container']}`)).to.be.present();
    });
  });

  context('when details are collapsed', () => {
    const isExpanded = false;
    const detailsPlugins = [];
    let component;

    beforeEach(() => {
      component = shallow(
        <SidebarInstanceDetails
          isExpanded={isExpanded}
          detailsPlugins={detailsPlugins}
        />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('does not render details', () => {
      expect(component.find(`.${styles['sidebar-instance-details-container']}`)).to.be.not.present();
      expect(component.find(`.${styles['sidebar-instance-details']}`)).to.be.present();
    });
  });
});
