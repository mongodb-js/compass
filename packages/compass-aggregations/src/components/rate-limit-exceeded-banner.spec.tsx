import React from 'react';
import type { ComponentProps } from 'react';
import {
  screen,
  renderWithActiveConnection,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import type { ConnectionInfo } from '@mongodb-js/compass-connections/provider';
import RateLimitExceededBanner from './rate-limit-exceeded-banner';
import type { VoyageRateLimitInfo } from '../utils/search-stage-errors';

const RPM_INFO: VoyageRateLimitInfo = { type: 'rpm', limit: '10' };

const CONNECTION_NO_ATLAS: ConnectionInfo = {
  id: 'test-no-atlas',
  connectionOptions: { connectionString: 'mongodb://localhost:27020' },
};

const CONNECTION_WITH_ATLAS: ConnectionInfo = {
  id: 'test-with-atlas',
  connectionOptions: { connectionString: 'mongodb://localhost:27020' },
  atlasMetadata: {
    projectId: 'proj123',
    clusterName: 'myCluster',
  } as ConnectionInfo['atlasMetadata'],
};

async function renderBanner(
  props: Partial<ComponentProps<typeof RateLimitExceededBanner>> & {
    rateLimitInfo: VoyageRateLimitInfo;
  },
  connectionInfo: ConnectionInfo = CONNECTION_NO_ATLAS
) {
  return renderWithActiveConnection(
    <RateLimitExceededBanner dataTestId="test-banner" {...props} />,
    connectionInfo
  );
}

describe('RateLimitExceededBanner', function () {
  it('renders the banner', async function () {
    await renderBanner({ rateLimitInfo: RPM_INFO });
    expect(screen.getByTestId('test-banner')).to.exist;
  });

  describe('View Rate Limit link', function () {
    it('shows link when searchExtensionType and atlasMetadata are present', async function () {
      await renderBanner(
        { rateLimitInfo: RPM_INFO, searchExtensionType: 'rerank' },
        CONNECTION_WITH_ATLAS
      );
      expect(screen.getByRole('link', { name: 'View Rate Limit' })).to.exist;
    });

    it('does not show link when searchExtensionType is absent', async function () {
      await renderBanner({ rateLimitInfo: RPM_INFO }, CONNECTION_WITH_ATLAS);
      expect(screen.queryByRole('link', { name: 'View Rate Limit' })).to.be
        .null;
    });

    it('does not show link when atlasMetadata is absent', async function () {
      await renderBanner(
        { rateLimitInfo: RPM_INFO, searchExtensionType: 'rerank' },
        CONNECTION_NO_ATLAS
      );
      expect(screen.queryByRole('link', { name: 'View Rate Limit' })).to.be
        .null;
    });
  });
});
