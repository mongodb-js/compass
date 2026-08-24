import Sinon from 'sinon';
import { expect } from 'chai';
import { session } from 'electron';
import { CompassAuthService } from '@mongodb-js/atlas-service/main';
import { CompassApplication } from './application';

describe('CompassApplication trackApplicationLaunched', function () {
  const sandbox = Sinon.createSandbox();

  afterEach(function () {
    sandbox.restore();
  });

  function trackedLaunchEvent(
    preferences: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    sandbox.stub(CompassApplication as any, 'preferences').value({
      getPreferences: () => preferences,
    });

    return new Promise((resolve, reject) => {
      const onTrack = ({
        event,
        properties,
      }: {
        event: string;
        properties: Record<string, unknown>;
      }) => {
        if (event !== 'Application Launched') {
          return;
        }
        clearTimeout(timeout);
        process.off('compass:track' as any, onTrack);
        resolve(properties);
      };

      process.on('compass:track' as any, onTrack);
      const timeout = setTimeout(() => {
        process.off('compass:track' as any, onTrack);
        reject(
          new Error('Timed out waiting for the Application Launched event')
        );
      }, 2000);

      (CompassApplication as any).trackApplicationLaunched({
        global: {},
        cli: {},
        preferenceParseErrors: [],
      });
    });
  }

  it('reports enableAtlasSignIn when it is disabled', async function () {
    const properties = await trackedLaunchEvent({
      readOnly: false,
      enableAtlasSignIn: false,
    });
    expect(properties).to.have.property('enableAtlasSignIn', false);
  });

  it('reports enableAtlasSignIn when it is enabled', async function () {
    const properties = await trackedLaunchEvent({
      readOnly: false,
      enableAtlasSignIn: true,
    });
    expect(properties).to.have.property('enableAtlasSignIn', true);
  });
});

describe('CompassApplication onBeforeSendHeaders listener', function () {
  const sandbox = Sinon.createSandbox();
  let capturedListener: (
    details: { requestHeaders: Record<string, string>; url: string },
    callback: (response: {
      cancel?: boolean;
      requestHeaders?: Record<string, string>;
    }) => void
  ) => void;

  beforeEach(function () {
    sandbox
      .stub(session.defaultSession.webRequest, 'onBeforeSendHeaders')
      .callsFake(((_filter: any, listener: any) => {
        capturedListener = listener as typeof capturedListener;
      }) as any);
    sandbox.stub(session.defaultSession.webRequest, 'onHeadersReceived');
    sandbox.stub(session.defaultSession, 'on');

    return (CompassApplication as any).setupCloudRequestHeaders();
  });

  afterEach(function () {
    sandbox.restore();
  });

  it('invokes callback with { cancel: true } when handleAuthHeaders throws', async function () {
    sandbox
      .stub(CompassAuthService, 'handleAuthHeaders')
      .rejects(new Error('Invalid authenticated request URL.'));

    const callbackResponse = new Promise((resolve) => {
      capturedListener(
        {
          requestHeaders: { 'X-Compass-Auth': 'true' },
          url: 'https://cloud.mongodb.com/some/endpoint',
        },
        resolve
      );
    });

    expect(await callbackResponse).to.deep.equal({ cancel: true });
  });

  it('invokes callback with returned headers on success', async function () {
    sandbox
      .stub(CompassAuthService, 'handleAuthHeaders')
      .resolves({ Authorization: 'Bearer abc' });

    const callbackResponse = new Promise((resolve) => {
      capturedListener(
        { requestHeaders: {}, url: 'https://cloud.mongodb.com/foo' },
        resolve
      );
    });

    expect(await callbackResponse).to.deep.equal({
      requestHeaders: { Authorization: 'Bearer abc' },
    });
  });
});
