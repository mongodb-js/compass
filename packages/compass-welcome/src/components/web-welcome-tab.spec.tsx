import React from 'react';
import {
  screen,
  renderWithConnections,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import WebWelcomeTab from './web-welcome-tab';
import type { ConnectionInfo } from '@mongodb-js/compass-connections/provider';

const CONNECTION_ITEM = {
  id: '1',
  connectionOptions: { connectionString: 'mongodb://localhost:27017' },
};

const renderWebWelcomeTab = (connections: ConnectionInfo[] = []) => {
  renderWithConnections(<WebWelcomeTab />, {
    connections,
  });
};

describe('WebWelcomeTab', function () {
  it('renders with title', function () {
    renderWebWelcomeTab();
    expect(screen.getByText('Welcome! Explore')).to.exist;
  });

  context('with no connections', function () {
    it('renders info text', function () {
      renderWebWelcomeTab();
      expect(
        screen.getByText('To get started, create your first MongoDB Cluster.')
      ).to.exist;
    });
    it('renders with create cluster button', function () {
      renderWebWelcomeTab();
      expect(screen.getByTestId('add-new-atlas-cluster-button')).to.exist;
    });
    it('renders help text', function () {
      renderWebWelcomeTab();
      expect(screen.getByText('Need more help?')).to.exist;
      expect(screen.getByText('View documentation')).to.exist;
    });
  });

  context('with at least one connection', function () {
    it('renders info text', function () {
      renderWebWelcomeTab([CONNECTION_ITEM]);
      expect(
        screen.getByText('To get started, connect to an existing cluster.')
      ).to.exist;
    });
    it('does not render create cluster button', function () {
      renderWebWelcomeTab([CONNECTION_ITEM]);
      try {
        screen.getByTestId('add-new-atlas-cluster-button');
        expect.fail('add-new-atlas-cluster-button should not be rendered');
      } catch {
        // noop
      }
    });
  });
});
