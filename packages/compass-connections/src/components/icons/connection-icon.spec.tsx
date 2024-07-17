import React from 'react';
import { render, screen } from '@testing-library/react';
import type { ConnectionInfo } from '../../connection-info-provider';
import { ConnectionIcon } from './connection-icon';
import { expect } from 'chai';

describe('<ConnectionIcon />', () => {
  const connectionInfo: ConnectionInfo = {
    id: '123',
    connectionOptions: {
      connectionString: 'mongodb://localhost:27017/',
    },
  };

  describe('base icons', () => {
    it('Localhost', () => {
      render(<ConnectionIcon connectionInfo={connectionInfo} />);
      expect(screen.getByRole('img', { name: 'Laptop Icon' })).to.be.visible;
    });

    it('Favorite connection - non localhost', () => {
      render(
        <ConnectionIcon
          connectionInfo={{
            ...connectionInfo,
            savedConnectionType: 'favorite',
            connectionOptions: {
              ...connectionInfo.connectionOptions,
              connectionString: 'mongodb://elsewhere',
            },
          }}
        />
      );
      expect(screen.getByRole('img', { name: 'Favorite Icon' })).to.be.visible;
    });

    it('Non favorite - non localhost', () => {
      render(
        <ConnectionIcon
          connectionInfo={{
            ...connectionInfo,
            savedConnectionType: 'recent',
            connectionOptions: {
              ...connectionInfo.connectionOptions,
              connectionString: 'mongodb://elsewhere',
            },
          }}
        />
      );
      expect(screen.getByRole('img', { name: 'Server Icon' })).to.be.visible;
    });
  });

  describe('status marker', () => {
    it('Online', () => {
      render(
        <ConnectionIcon
          connectionInfo={connectionInfo}
          withStatus={'connected'}
        />
      );
      expect(screen.getByRole('img', { name: 'Connected Icon' })).to.be.visible;
    });

    it('Connecting', () => {
      render(
        <ConnectionIcon
          connectionInfo={connectionInfo}
          withStatus={'connecting'}
        />
      );
      expect(screen.getByRole('img', { name: 'Connecting Icon' })).to.be
        .visible;
    });

    it('Failed Connection', () => {
      render(
        <ConnectionIcon connectionInfo={connectionInfo} withStatus={'failed'} />
      );
      expect(screen.getByRole('img', { name: 'Failed Connection Icon' })).to.be
        .visible;
    });
  });
});
