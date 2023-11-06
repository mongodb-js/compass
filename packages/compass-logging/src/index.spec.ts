import { createLoggerAndTelemetry } from './';
import { once } from 'events';
import { expect } from 'chai';

describe('createLoggerAndTelemetry', function () {
  it('creates a logger that forwards log lines as events', async function () {
    const { log, mongoLogId } = createLoggerAndTelemetry('COMPONENT');
    const logevent = once(process, 'compass:log');

    log.info(mongoLogId(12345), 'ctx', 'message', { attr: 42 });
    const [{ line }] = await logevent;
    const parsed = JSON.parse(line);
    expect(parsed.s).to.equal('I');
    expect(parsed.c).to.equal('COMPONENT');
    expect(parsed.id).to.equal(12345);
    expect(parsed.ctx).to.equal('ctx');
    expect(parsed.msg).to.equal('message');
    expect(parsed.attr).to.deep.equal({ attr: 42 });
  });

  it('logs events from the same tick from multiple loggers in-order', function () {
    const log1 = createLoggerAndTelemetry('C1');
    const log2 = createLoggerAndTelemetry('C1');

    const log: any[] = [];
    process.on('compass:log', ({ line }) => log.push(JSON.parse(line).msg));

    log1.log.info(log1.mongoLogId(12345), 'ctx', 'message1');
    log1.log.info(log1.mongoLogId(12345), 'ctx', 'message2');
    log2.log.info(log2.mongoLogId(12345), 'ctx', 'message3');
    expect(log).to.deep.equal(['message1', 'message2', 'message3']);
  });

  it('sends track events over ipc', async function () {
    const { track } = createLoggerAndTelemetry('TEST');

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
    const { track } = createLoggerAndTelemetry('TEST');

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
    const { track } = createLoggerAndTelemetry('TEST');

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
