import React, { useState, useMemo } from 'react';
import {
  Tabs,
  Tab,
  spacing,
  css,
  cx,
  palette,
} from '@mongodb-js/compass-components';
import ConnectionStringUrl from 'mongodb-connection-string-url';
import type { ConnectionOptions } from 'mongodb-data-service';

import GeneralTab from './general-tab/general-tab';
import AuthenticationTab from './authentication-tab/authentication-tab';
import ProxyAndSshTunnelTab from './ssh-tunnel-tab/proxy-and-ssh-tunnel-tab';
import TLSTab from './tls-ssl-tab/tls-ssl-tab';
import CSFLETab from './csfle-tab/csfle-tab';
import AdvancedTab from './advanced-tab/advanced-tab';
import type { UpdateConnectionFormField } from '../../hooks/use-connect-form';
import type { ConnectionFormError, TabId } from '../../utils/validation';
import { errorsByFieldTab } from '../../utils/validation';
import { defaultConnectionString } from '../../constants/default-connection';
import { useConnectionFormPreference } from '../../hooks/use-connect-form-preferences';

const tabsStyles = css({
  marginTop: spacing[2],
});

const tabWithErrorIndicatorStyles = css({
  position: 'relative',
  '&::after': {
    position: 'absolute',
    top: -spacing[2],
    right: -spacing[2],
    content: '""',
    width: spacing[2],
    height: spacing[2],
    borderRadius: '50%',
    backgroundColor: palette.red.base,
  },
});

interface TabObject {
  name: string;
  id: TabId;
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
}: {
  errors: ConnectionFormError[];
  updateConnectionFormField: UpdateConnectionFormField;
  connectionOptions: ConnectionOptions;
}): React.ReactElement {
  const [activeTab, setActiveTab] = useState(0);
  const showCSFLE = useConnectionFormPreference('showCSFLE');

  const tabs: TabObject[] = [
    { name: 'General', id: 'general', component: GeneralTab },
    {
      name: 'Authentication',
      id: 'authentication',
      component: AuthenticationTab,
    },
    { name: 'TLS/SSL', id: 'tls', component: TLSTab },
    { name: 'Proxy/SSH', id: 'proxy', component: ProxyAndSshTunnelTab },
    ...(showCSFLE
      ? [
          {
            name: 'In-Use Encryption',
            id: 'csfle',
            component: CSFLETab,
          } as const,
        ]
      : []),
    { name: 'Advanced', id: 'advanced', component: AdvancedTab },
  ];

  const connectionStringUrl = useMemo(() => {
    try {
      return new ConnectionStringUrl(connectionOptions.connectionString, {
        looseValidation: true,
      });
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

        const tabErrors = errorsByFieldTab(errors, tabObject.id);
        const showTabErrorIndicator = tabErrors.length > 0;

        return (
          <Tab
            key={idx}
            name={
              <div
                className={cx({
                  [tabWithErrorIndicatorStyles]: showTabErrorIndicator,
                })}
              >
                {tabObject.name}
              </div>
            }
            aria-label={`${tabObject.name}${
              tabErrors.length > 0
                ? ` (${tabErrors.length} error${
                    tabErrors.length > 1 ? 's' : ''
                  })`
                : ''
            }`}
            type="button"
            data-testid={`connection-${tabObject.id}-tab`}
            data-has-error={showTabErrorIndicator}
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
