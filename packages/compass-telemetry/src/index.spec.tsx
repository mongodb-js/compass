import { createIpcTrack } from './';
import { expect } from 'chai';

describe('Telemetry', () => {
  it('sends track events over ipc', async function () {
    const track = createIpcTrack();

    const trackingLogs: any[] = [];
    process.on('compass:track', (event) => trackingLogs.push(event));

    track('Atlas Link Clicked', {
      some_attribute: 123,
    });

    await new Promise((resolve) => setTimeout(resolve, 3));

    expect(trackingLogs).to.deep.equal([
      {
        event: 'Atlas Link Clicked',
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

    track('Atlas Sign Out', async () => {
      await new Promise((resolve) => setTimeout(resolve, 3));

      return {
        values: true,
      };
    });

    // Let the track event occur.
    await new Promise((resolve) => setTimeout(resolve, 6));

    expect(trackingLogs).to.deep.equal([
      {
        event: 'Atlas Sign Out',
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

    track('Atlas Link Clicked', () => {
      throw new Error('test error');
    });

    await new Promise((resolve) => setTimeout(resolve, 3));

    expect(trackingLogs).to.deep.equal([
      {
        event: 'Error Fetching Attributes',
        properties: {
          event_name: 'Atlas Link Clicked',
        },
      },
    ]);
  });
});
