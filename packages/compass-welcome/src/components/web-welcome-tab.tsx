import React from 'react';
import {
  Button,
  ButtonVariant,
  H3,
  spacing,
  css,
  Body,
  Link,
} from '@mongodb-js/compass-components';
import { useConnectionIds } from '@mongodb-js/compass-connections/provider';
import { WelcomeTabImage } from './welcome-image';
import ConnectionList, { useActiveConnectionIds } from './connection-list';
import { ConnectionPlug } from './connection-plug';

const welcomeTabStyles = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto',
  gap: spacing[200],
});

const contentBodyStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[400],
  alignItems: 'flex-start',
});

export default function WebWelcomeTab() {
  const numConnections = useConnectionIds().length;
  const activeConnectionIds = useActiveConnectionIds();

  return (
    <div className={welcomeTabStyles}>
      {activeConnectionIds.length ? <ConnectionPlug /> : <WelcomeTabImage />}
      <div>
        <H3>Welcome! Explore your data</H3>
        {!activeConnectionIds.length && (
          <div className={contentBodyStyles}>
            <Body>
              {numConnections === 0
                ? 'To get started, create your first MongoDB Cluster.'
                : 'To get started, connect to an existing cluster.'}
            </Body>
            {numConnections === 0 && (
              <>
                <Button
                  as={
                    /* The type assert is a temporary workaround for https://jira.mongodb.org/browse/LG-5590 */
                    Link as React.FunctionComponent<{
                      href: string;
                    }>
                  }
                  data-testid="add-new-atlas-cluster-button"
                  variant={ButtonVariant.Primary}
                  href={'#/clusters/starterTemplates'}
                >
                  Create a Cluster
                </Button>
                <Body>
                  Need more help?{' '}
                  <Link href="https://www.mongodb.com/docs/atlas/create-connect-deployments/">
                    View documentation
                  </Link>
                </Body>
              </>
            )}
          </div>
        )}
        {activeConnectionIds.length > 0 ? <ConnectionList /> : null}
      </div>
    </div>
  );
}
