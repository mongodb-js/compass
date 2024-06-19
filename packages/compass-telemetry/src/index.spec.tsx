import { createIpcTrack } from './';
import { expect } from 'chai';

describe('Telemetry', () => {
  it('sends track events over ipc', async function () {
    const track = createIpcTrack();

    const trackingLogs: any[] = [];
    process.on('compass:track', (event) => trackingLogs.push(event));

    track('Test Event1', {
      some_attribute: 123,
    });

    await new Promise((resolve) => setTimeout(resolve, 3));

    expect(trackingLogs).to.deep.equal([
      {
        event: 'Test Event1',
        properties: {
          some_attribute: 123,
        },
      },
    ]);
  });

  it('resolves track event attributes', async function () {
    const track = createIpcTrack();

    const trackingLogs: any[] = [];
    process.on('compass:track', (event) => trackingLogs.push(event));

    track('Test Event2', async () => {
      await new Promise((resolve) => setTimeout(resolve, 3));

      return {
        values: true,
      };
    });

    // Let the track event occur.
    await new Promise((resolve) => setTimeout(resolve, 6));

    expect(trackingLogs).to.deep.equal([
      {
        event: 'Test Event2',
        properties: {
          values: true,
        },
      },
    ]);
  });

  it('tracks events even when fetching the attributes fails', async function () {
    const track = createIpcTrack();

    const trackingLogs: any[] = [];
    process.on('compass:track', (event) => trackingLogs.push(event));

    track('Test Event3', () => {
      throw new Error('test error');
    });

    await new Promise((resolve) => setTimeout(resolve, 3));

    expect(trackingLogs).to.deep.equal([
      {
        event: 'Error Fetching Attributes',
        properties: {
          event_name: 'Test Event3',
        },
      },
    ]);
  });
});
