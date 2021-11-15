import React, { useState } from 'react';
import { Tabs, Tab } from '@leafygreen-ui/tabs';

import GeneralTab from './general-tab';
import SSLTab from './ssl-tab';
import SSHTunnelTab from './ssh-tunnel-tab';
import AdvancedTab from './advanced-tab';

interface TabObject {
  name: string;
  component: React.FunctionComponent;
}

function renderTab(tabObject: TabObject, idx: number): React.ReactElement {
  const TabComponent = tabObject.component;
  return (
    <Tab key={idx} name={tabObject.name} aria-label={tabObject.name}>
      <TabComponent />
    </Tab>
  );
}
function AdvancedOptionsTabs(): React.ReactElement {
  const [activeTab, setActiveTab] = useState(0);

  const tabs: TabObject[] = [
    { name: 'General', component: GeneralTab },
    { name: 'SSL', component: SSLTab },
    { name: 'SSH Tunnel', component: SSHTunnelTab },
    { name: 'Advanced', component: AdvancedTab },
  ];
  return (
    <Tabs
      setSelected={setActiveTab}
      selected={activeTab}
      aria-label="Advanced Options Tabs"
    >
      {tabs.map(renderTab)}
    </Tabs>
  );
}

export default AdvancedOptionsTabs;
