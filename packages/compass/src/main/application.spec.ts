import Sinon from 'sinon';
import { expect } from 'chai';
import { session } from 'electron';
import { CompassAuthService } from '@mongodb-js/atlas-service/main';
import { CompassApplication } from './application';

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
