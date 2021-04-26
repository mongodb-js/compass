/* eslint-disable camelcase */
import { expect } from 'chai';
import setupLoggerAndTelemetry from './setup-logger-and-telemetry';
import { EventEmitter } from 'events';
import pino from 'pino';
import { MongoshInvalidInputError } from '@mongosh/errors';

describe('setupLoggerAndTelemetry', () => {
  let logOutput: any[];
  let analyticsOutput: ['identify'|'track'|'log', any][];
  let bus: EventEmitter;

  const logger = pino({ name: 'mongosh' }, {
    write(chunk: string) { logOutput.push(JSON.parse(chunk)); }
  });
  const analytics = {
    identify(info: any) { analyticsOutput.push(['identify', info]); },
    track(info: any) { analyticsOutput.push(['track', info]); }
  };

  const userId = '53defe995fa47e6c13102d9d';
  const logId = '5fb3c20ee1507e894e5340f3';

  beforeEach(() => {
    logOutput = [];
    analyticsOutput = [];
    bus = new EventEmitter();
  });

  it('works', () => {
    setupLoggerAndTelemetry(logId, bus, () => logger, () => analytics);
    expect(logOutput).to.be.empty;
    expect(analyticsOutput).to.be.empty;

    bus.emit('mongosh:new-user', userId, false);
    bus.emit('mongosh:new-user', userId, true);

    // Test some events with and without telemetry enabled
    for (const telemetry of [ false, true ]) {
      bus.emit('mongosh:update-user', userId, telemetry);
      bus.emit('mongosh:connect', {
        uri: 'mongodb://localhost/',
        is_localhost: true,
        is_atlas: false,
        node_version: 'v12.19.0'
      });
      bus.emit('mongosh:error', new MongoshInvalidInputError('meow', 'CLIREPL-1005', { cause: 'x' }));
      bus.emit('mongosh:help');
      bus.emit('mongosh:use', { db: 'admin' });
      bus.emit('mongosh:show', { method: 'dbs' });
    }

    bus.emit('mongosh:setCtx', { method: 'setCtx' });
    bus.emit('mongosh:api-call', { method: 'auth', class: 'Database', db: 'test-1603986682000', arguments: { } });
    bus.emit('mongosh:api-call', { method: 'redactable', arguments: { email: 'mongosh@example.com' } });
    bus.emit('mongosh:evaluate-input', { input: '1+1' });
    bus.emit('mongosh:driver-initialized', { driver: { name: 'nodejs', version: '3.6.1' } });

    bus.emit('mongosh:start-loading-cli-scripts', { usesShellOption: true });
    bus.emit('mongosh:api-load-file', { nested: true, filename: 'foobar.js' });
    bus.emit('mongosh:start-mongosh-repl');
    bus.emit('mongosh:api-load-file', { nested: false, filename: 'foobar.js' });
    bus.emit('mongosh:mongoshrc-load');
    bus.emit('mongosh:mongoshrc-mongorc-warn');
    bus.emit('mongosh:eval-cli-script');

    expect(logOutput).to.have.lengthOf(24);
    expect(logOutput[0].msg).to.equal('mongosh:update-user {"enableTelemetry":false}');
    expect(logOutput[1].msg).to.match(/^mongosh:connect/);
    expect(logOutput[1].msg).to.match(/"session_id":"5fb3c20ee1507e894e5340f3"/);
    expect(logOutput[1].msg).to.match(/"userId":"53defe995fa47e6c13102d9d"/);
    expect(logOutput[1].msg).to.match(/"connectionUri":"mongodb:\/\/localhost\/"/);
    expect(logOutput[1].msg).to.match(/"is_localhost":true/);
    expect(logOutput[1].msg).to.match(/"is_atlas":false/);
    expect(logOutput[1].msg).to.match(/"node_version":"v12\.19\.0"/);
    expect(logOutput[2].type).to.equal('Error');
    expect(logOutput[2].msg).to.match(/meow/);
    expect(logOutput[3].msg).to.equal('mongosh:help');
    expect(logOutput[4].msg).to.equal('mongosh:use {"db":"admin"}');
    expect(logOutput[5].msg).to.equal('mongosh:show {"method":"dbs"}');
    expect(logOutput[6].msg).to.equal('mongosh:update-user {"enableTelemetry":true}');
    expect(logOutput[7].msg).to.match(/^mongosh:connect/);
    expect(logOutput[8].type).to.equal('Error');
    expect(logOutput[8].msg).to.match(/meow/);
    expect(logOutput[9].msg).to.equal('mongosh:help');
    expect(logOutput[10].msg).to.equal('mongosh:use {"db":"admin"}');
    expect(logOutput[11].msg).to.equal('mongosh:show {"method":"dbs"}');
    expect(logOutput[12].msg).to.equal('mongosh:setCtx {"method":"setCtx"}');
    expect(logOutput[13].msg).to.match(/^mongosh:api-call/);
    expect(logOutput[13].msg).to.match(/"db":"test-1603986682000"/);
    expect(logOutput[14].msg).to.match(/^mongosh:api-call/);
    expect(logOutput[14].msg).to.match(/"email":"<email>"/);
    expect(logOutput[15].msg).to.match(/^mongosh:evaluate-input/);
    expect(logOutput[15].msg).to.match(/"input":"1\+1"/);
    expect(logOutput[16].msg).to.match(/"version":"3.6.1"/);
    expect(logOutput[17].msg).to.equal('mongosh:start-loading-cli-scripts');
    expect(logOutput[18].msg).to.match(/^mongosh:api-load-file/);
    expect(logOutput[18].msg).to.match(/"nested":true/);
    expect(logOutput[18].msg).to.match(/"filename":"foobar.js"/);
    expect(logOutput[19].msg).to.equal('mongosh:start-mongosh-repl');
    expect(logOutput[20].msg).to.match(/"nested":false/);
    expect(logOutput[20].msg).to.match(/"filename":"foobar.js"/);
    expect(logOutput[21].msg).to.equal('mongosh:mongoshrc-load');
    expect(logOutput[22].msg).to.equal('mongosh:mongoshrc-mongorc-warn');
    expect(logOutput[23].msg).to.equal('mongosh:eval-cli-script');


    const mongosh_version = require('../package.json').version;
    expect(analyticsOutput).to.deep.equal([
      [ 'identify', { userId: '53defe995fa47e6c13102d9d', traits: { platform: process.platform } } ],
      [ 'identify', { userId: '53defe995fa47e6c13102d9d', traits: { platform: process.platform } } ],
      [
        'track',
        {
          userId: '53defe995fa47e6c13102d9d',
          event: 'New Connection',
          properties: {
            mongosh_version,
            session_id: '5fb3c20ee1507e894e5340f3',
            is_localhost: true,
            is_atlas: false,
            node_version: 'v12.19.0'
          }
        }
      ],
      [
        'track',
        {
          userId: '53defe995fa47e6c13102d9d',
          event: 'Error',
          properties: {
            mongosh_version,
            name: 'MongoshInvalidInputError',
            code: 'CLIREPL-1005',
            scope: 'CLIREPL',
            metadata: { cause: 'x' }
          }
        }
      ],
      [
        'track',
        {
          userId: '53defe995fa47e6c13102d9d',
          event: 'Help',
          properties: { mongosh_version }
        }
      ],
      [
        'track',
        {
          userId: '53defe995fa47e6c13102d9d',
          event: 'Use',
          properties: { mongosh_version }
        }
      ],
      [
        'track',
        {
          userId: '53defe995fa47e6c13102d9d',
          event: 'Show',
          properties: {
            mongosh_version,
            method: 'dbs'
          }
        }
      ],
      [
        'track',
        {
          event: 'Script Loaded CLI',
          properties: {
            mongosh_version,
            nested: true,
            shell: true
          },
          userId: '53defe995fa47e6c13102d9d'
        }
      ],
      [
        'track',
        {
          event: 'Script Loaded',
          properties: {
            mongosh_version,
            nested: false
          },
          userId: '53defe995fa47e6c13102d9d'
        }
      ],
      [
        'track',
        {
          event: 'Mongoshrc Loaded',
          properties: {
            mongosh_version,
          },
          userId: '53defe995fa47e6c13102d9d'
        }
      ],
      [
        'track',
        {
          event: 'Mongorc Warning',
          properties: {
            mongosh_version,
          },
          userId: '53defe995fa47e6c13102d9d'
        }
      ],
      [
        'track',
        {
          event: 'Script Evaluated',
          properties: {
            mongosh_version,
            shell: true
          },
          userId: '53defe995fa47e6c13102d9d'
        }
      ]
    ]);
  });

  it('works when analytics are not available', () => {
    setupLoggerAndTelemetry('5fb3c20ee1507e894e5340f3', bus, () => logger, () => { throw new Error(); });
    bus.emit('mongosh:new-user', userId, true);
    expect(analyticsOutput).to.be.empty;
    expect(logOutput).to.have.lengthOf(1);
    expect(logOutput[0].type).to.equal('Error');
    expect(logOutput[0].name).to.equal('mongosh');
    bus.emit('mongosh:help');
    expect(analyticsOutput).to.be.empty;
    expect(logOutput).to.have.lengthOf(2);
  });
});
