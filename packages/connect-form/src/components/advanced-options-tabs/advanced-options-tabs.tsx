import React, { useState, useMemo } from 'react';
import { Tabs, Tab, spacing, css, cx } from '@mongodb-js/compass-components';
import ConnectionStringUrl from 'mongodb-connection-string-url';
import { ConnectionOptions } from 'mongodb-data-service';

import GeneralTab from './general-tab/general-tab';
import AuthenticationTab from './authentication-tab/authentication-tab';
import ProxyAndSshTunnelTab from './ssh-tunnel-tab/proxy-and-ssh-tunnel-tab';
import TLSTab from './tls-ssl-tab/tls-ssl-tab';
import AdvancedTab from './advanced-tab/advanced-tab';
import { UpdateConnectionFormField } from '../../hooks/use-connect-form';
import {
  ConnectionFormError,
  ConnectionFormWarning,
} from '../../utils/validation';
import { defaultConnectionString } from '../../constants/default-connection';
import { ConnectFormTab } from '../../types/connect-form-tab';

const tabsStyles = css({
  marginTop: spacing[1],
});

const tabWithIndicatorStyles = css({
  position: 'relative',
  '[role=tab]&::before': {
    position: 'absolute',
    top: spacing[1],
    right: spacing[1],
    content: '""',
    width: spacing[2],
    height: spacing[2],
    borderRadius: '50%',
  },
});

const tabWithErrorStyle = css({
  '[role=tab]&::before': {
    backgroundColor: 'red',
  },
});

const tabWithWarningStyle = css({
  'button &::before': {
    backgroundColor: 'yellow',
  },
});

interface TabObject {
  name: ConnectFormTab;
  component: React.FunctionComponent<{
    errors: ConnectionFormError[];
    connectionStringUrl: ConnectionStringUrl;
    updateConnectionFormField: UpdateConnectionFormField;
    connectionOptions: ConnectionOptions;
  }>;
}

function AdvancedOptionsTabs({
  errors,
  updateConnectionFormField,
  connectionOptions,
  warnings,
}: {
  errors: ConnectionFormError[];
  updateConnectionFormField: UpdateConnectionFormField;
  connectionOptions: ConnectionOptions;
  warnings: ConnectionFormWarning[];
}): React.ReactElement {
  const [activeTab, setActiveTab] = useState(0);

  const tabs: TabObject[] = [
    { name: 'General', component: GeneralTab },
    { name: 'Authentication', component: AuthenticationTab },
    { name: 'TLS/SSL', component: TLSTab },
    { name: 'Proxy/SSH Tunnel', component: ProxyAndSshTunnelTab },
    { name: 'Advanced', component: AdvancedTab },
  ];

  const connectionStringUrl = useMemo(() => {
    try {
      return new ConnectionStringUrl(connectionOptions.connectionString);
    } catch (e) {
      // Return default connection string url when can't be parsed.
      return new ConnectionStringUrl(defaultConnectionString);
    }
  }, [connectionOptions]);

  return (
    <Tabs
      className={tabsStyles}
      setSelected={setActiveTab}
      selected={activeTab}
      aria-label="Advanced Options Tabs"
    >
      {tabs.map((tabObject: TabObject, idx: number) => {
        const TabComponent = tabObject.component;

        const tabHasError = !!errors.find(
          (error) => error.fieldTab === tabObject.name
        );
        // If the tab has an error, don't show the warning indicator.
        const tabHasWarning =
          !tabHasError &&
          !!warnings.find((warnings) => warnings.fieldTab === tabObject.name);

        return (
          <Tab
            data-testid={`${tabObject.name}-tab${
              tabHasError ? '-has-error' : ''
            }${tabHasWarning ? '-has-warning' : ''}`}
            className={cx({
              [tabWithIndicatorStyles]: tabHasError || tabHasWarning,
              [tabWithErrorStyle]: tabHasError,
              [tabWithWarningStyle]: tabHasWarning,
            })}
            key={idx}
            name={tabObject.name}
            aria-label={tabObject.name}
          >
            <TabComponent
              errors={errors}
              connectionStringUrl={connectionStringUrl}
              updateConnectionFormField={updateConnectionFormField}
              connectionOptions={connectionOptions}
            />
          </Tab>
        );
      })}
    </Tabs>
  );
}

export default AdvancedOptionsTabs;
