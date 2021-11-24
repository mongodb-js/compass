import { css } from '@emotion/css';
import React, { useState } from 'react';
import { Tabs, Tab, spacing } from '@mongodb-js/compass-components';
import ConnectionStringUrl from 'mongodb-connection-string-url';

import GeneralTab from './general-tab';
import AuthenticationTab from './authentication-tab';
import SSLTab from './ssl-tab';
import SSHTunnelTab from './ssh-tunnel-tab';
import AdvancedTab from './advanced-tab';
import {
  ConnectFormFields,
  SetConnectionField,
} from '../../hooks/use-connect-form';

const tabsStyles = css({
  marginTop: spacing[1],
});
interface TabObject {
  name: string;
  component: React.FunctionComponent<{
    fields: ConnectFormFields;
    connectionStringUrl: ConnectionStringUrl;
    setConnectionField: SetConnectionField;
    setConnectionStringUrl: (connectionStringUrl: ConnectionStringUrl) => void;
  }>;
}

function AdvancedOptionsTabs({
  fields,
  connectionStringUrl,
  setConnectionField,
  setConnectionStringUrl,
}: {
  fields: ConnectFormFields;
  connectionStringUrl: ConnectionStringUrl;
  setConnectionField: SetConnectionField;
  setConnectionStringUrl: (connectionStringUrl: ConnectionStringUrl) => void;
}): React.ReactElement {
  const [activeTab, setActiveTab] = useState(0);

  const tabs: TabObject[] = [
    { name: 'General', component: GeneralTab },
    { name: 'Authentication', component: AuthenticationTab },
    { name: 'TLS/SSL', component: SSLTab },
    { name: 'SSH Tunnel', component: SSHTunnelTab },
    { name: 'Advanced', component: AdvancedTab },
  ];

  return (
    <Tabs
      className={tabsStyles}
      setSelected={setActiveTab}
      selected={activeTab}
      aria-label="Advanced Options Tabs"
    >
      {tabs.map((tabObject: TabObject, idx: number) => {
        const TabComponent = tabObject.component;

        return (
          <Tab key={idx} name={tabObject.name} aria-label={tabObject.name}>
            <TabComponent
              fields={fields}
              connectionStringUrl={connectionStringUrl}
              setConnectionField={setConnectionField}
              setConnectionStringUrl={setConnectionStringUrl}
            />
          </Tab>
        );
      })}
    </Tabs>
  );
}

export default AdvancedOptionsTabs;
