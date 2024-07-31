import { once } from 'events';
import {
  trackConnectionDisconnectedEvent,
  trackConnectionCreatedEvent,
  trackConnectionRemovedEvent,
} from './telemetry';
import { expect } from 'chai';
import type { ConnectionInfo } from '@mongodb-js/connection-storage/renderer';
import { createIpcTrack } from '@mongodb-js/compass-telemetry';

describe('Connections telemetry', function () {
  const connectionInfo: ConnectionInfo = {
    id: 'TEST',
    connectionOptions: {
      connectionString: 'mongodb://localhost:27017',
    },
    favorite: {
      name: 'localhost',
      color: 'color_2',
    },
    savedConnectionType: 'recent',
  };
  const track = createIpcTrack();

  it('tracks a connection disconnected event', async function () {
    const trackEvent = once(process, 'compass:track');

    trackConnectionDisconnectedEvent(connectionInfo, track);
    const [{ properties, event }] = await trackEvent;

    const expected = {
      connection_id: 'TEST',
    };

    expect(event).to.equal('Connection Disconnected');
    expect(properties).to.deep.equal(expected);
  });

  it('tracks a connection created event', async function () {
    const trackEvent = once(process, 'compass:track');

    trackConnectionCreatedEvent(connectionInfo, track);
    const [{ properties, event }] = await trackEvent;

    const expected = {
      connection_id: 'TEST',
      color: connectionInfo.favorite?.color,
    };

    expect(event).to.equal('Connection Created');
    expect(properties).to.deep.equal(expected);
  });

  it('tracks a connection removed event', async function () {
    const trackEvent = once(process, 'compass:track');

    trackConnectionRemovedEvent(connectionInfo, track);
    const [{ properties, event }] = await trackEvent;

    const expected = {
      connection_id: 'TEST',
    };

    expect(event).to.equal('Connection Removed');
    expect(properties).to.deep.equal(expected);
  });
});
