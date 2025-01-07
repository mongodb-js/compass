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

function getCreateAtlasClusterUrl() {
  return window.location.href.replace(/#.*$/, '#/clusters/starterTemplates');
}

export default function WebWelcomeTab() {
  const numConnections = useConnectionIds().length;
  return (
    <div className={welcomeTabStyles}>
      <WelcomeTabImage />
      <div>
        <H3>Welcome! Explore</H3>
        <div className={contentBodyStyles}>
          <Body>
            {numConnections === 0
              ? 'To get started, create your first MongoDB Cluster.'
              : 'To get started, connect to an existing cluster.'}
          </Body>
          {numConnections === 0 && (
            <>
              <Button
                as={Link}
                data-testid="add-new-atlas-cluster-button"
                variant={ButtonVariant.Primary}
                href={getCreateAtlasClusterUrl()}
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
      </div>
    </div>
  );
}
