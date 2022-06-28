import React from 'react';

import { SideNav, SideNavItem } from '@mongodb-js/compass-components';

const SettingsSideNav: React.FunctionComponent = () => {
  return (
    <SideNav collapsed={false} widthOverride={300}>
      <SideNavItem>Theme</SideNavItem>
      <SideNavItem>Privacy</SideNavItem>
    </SideNav>
  );
};

export default SettingsSideNav;
