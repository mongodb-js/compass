import React from 'react';
import { shallow } from 'enzyme';
import SidebarInstanceDetails from './sidebar-instance-details';

import styles from './sidebar-instance-details.less';

describe('SidebarInstanceDetails [Component]', () => {
  context('when details are expanded and sidebar is nor collapsed', () => {
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

  context('when details are collapsed and sidebar is nor collapsed', () => {
    const isExpanded = false;
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

    it('does not render details', () => {
      expect(component.find(`.${styles['sidebar-instance-details-container']}`)).to.be.not.present();
      expect(component.find(`.${styles['sidebar-instance-details']}`)).to.be.present();
    });
  });

  context('when details are expanded and sidebar is collapsed', () => {
    const isExpanded = true;
    const detailsPlugins = [];
    const isSidebarCollapsed = true;
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

    it('does not render details', () => {
      expect(component.find(`.${styles['sidebar-instance-details-container']}`)).to.be.not.present();
      expect(component.find(`.${styles['sidebar-instance-details']}`)).to.be.present();
    });
  });

  context('when details are collapsed and sidebar is collapsed', () => {
    const isExpanded = false;
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

    it('does not render details', () => {
      expect(component.find(`.${styles['sidebar-instance-details-container']}`)).to.be.not.present();
      expect(component.find(`.${styles['sidebar-instance-details']}`)).to.be.present();
    });
  });
});
