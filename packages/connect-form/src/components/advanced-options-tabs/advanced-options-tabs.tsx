import React, { useState } from 'react';
import { Tabs, Tab } from '@mongodb-js/compass-components';
import ConnectionStringUrl from 'mongodb-connection-string-url';

import GeneralTab from './general-tab';
import SSLTab from './ssl-tab';
import SSHTunnelTab from './ssh-tunnel-tab';
import AdvancedTab from './advanced-tab';

interface TabObject {
  name: string;
  component: React.FunctionComponent<{
    connectionStringUrl: ConnectionStringUrl;
    setConnectionStringUrl: (connectionStringUrl: ConnectionStringUrl) => void;
  }>;
}

function AdvancedOptionsTabs({
  connectionStringUrl,
  setConnectionStringUrl,
}: {
  connectionStringUrl: ConnectionStringUrl;
  setConnectionStringUrl: (connectionStringUrl: ConnectionStringUrl) => void;
}): React.ReactElement {
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
      {tabs.map((tabObject: TabObject, idx: number) => {
        const TabComponent = tabObject.component;

        return (
          <Tab key={idx} name={tabObject.name} aria-label={tabObject.name}>
            <TabComponent
              connectionStringUrl={connectionStringUrl}
              setConnectionStringUrl={setConnectionStringUrl}
            />
          </Tab>
        );
      })}
    </Tabs>
  );
}

export default AdvancedOptionsTabs;
