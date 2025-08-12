import { once } from 'events';
import {
  trackConnectionDisconnectedEvent,
  trackConnectionCreatedEvent,
  trackConnectionRemovedEvent,
  getErrorCodeCauseChain,
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

  describe('#getErrorCodeCauseChain', function () {
    it('should return undefined when no error', function () {
      const result = getErrorCodeCauseChain(undefined);
      expect(result).to.be.undefined;
    });

    it('should return undefined when there are no error codes', function () {
      const result = getErrorCodeCauseChain({});
      expect(result).to.be.undefined;
    });

    it('should return an array with the error code', function () {
      const error: any = new Error('Test error');
      error.code = 123;

      const result = getErrorCodeCauseChain(error);
      expect(result).to.deep.equal([123]);
    });

    it('should return an array of error codes from the cause chain', function () {
      const error: Error & { code?: number } = new Error('Test error');
      error.code = 123;

      // No code / codeName on error two.
      const errorTwo = new Error('Test error two');

      const errorThree: Error & { codeName?: string } = new Error(
        'Test error three'
      );
      errorThree.codeName = 'PINEAPPLE';

      const errorFour: Error & { code?: number } = new Error('Test error four');
      errorFour.code = 1111;

      error.cause = errorTwo;
      errorTwo.cause = errorThree;
      errorThree.cause = errorFour;

      const result = getErrorCodeCauseChain(error);
      expect(result).to.deep.equal([123, 'PINEAPPLE', 1111]);
    });
  });
});
