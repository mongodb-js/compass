import Sinon from 'sinon';
import { expect } from 'chai';
import { CompassTelemetry } from './telemetry';

describe('CompassTelemetry', function () {
  const sandbox = Sinon.createSandbox();

  let track: Sinon.SinonStub;

  beforeEach(function () {
    track = sandbox.stub();
    sandbox.stub(CompassTelemetry as any, 'analytics').value({ track });
    sandbox.stub(CompassTelemetry as any, 'state').value('enabled');
    sandbox
      .stub(CompassTelemetry as any, 'telemetryAnonymousId')
      .value('anonymous-id');
  });

  afterEach(function () {
    sandbox.restore();
  });

  function setAtlasUserId(value?: string) {
    sandbox.stub(CompassTelemetry as any, 'telemetryAtlasUserId').value(value);
  }

  function trackedProperties(): Record<string, unknown> {
    expect(track).to.have.been.calledOnce;
    return track.firstCall.args[0].properties;
  }

  describe('atlas_user_id', function () {
    it('is omitted from events when there is no atlas user id', function () {
      setAtlasUserId(undefined);

      CompassTelemetry.track({ event: 'Test Event', properties: {} });

      expect(trackedProperties()).to.not.have.property('atlas_user_id');
    });

    it('is attached alongside the event, connection and common properties', function () {
      setAtlasUserId('auid-1234');

      CompassTelemetry.track({
        event: 'Test Event',
        properties: { connection_id: 'connection-1', some_attribute: 123 },
      });

      const properties = trackedProperties();
      expect(properties).to.have.property('atlas_user_id', 'auid-1234');
      expect(properties).to.have.property('connection_id', 'connection-1');
      expect(properties).to.have.property('some_attribute', 123);
      expect(properties).to.have.property('device_id');
    });

    it('matches the userId sent to segment', function () {
      setAtlasUserId('auid-1234');

      CompassTelemetry.track({ event: 'Test Event', properties: {} });

      expect(track.firstCall.args[0]).to.have.property('userId', 'auid-1234');
    });
  });

  describe('when the telemetryAtlasUserId preference changes', function () {
    let identify: Sinon.SinonStub;
    let listeners: Record<string, (value: any) => void>;

    beforeEach(async function () {
      identify = sandbox.stub();
      listeners = {};
      sandbox
        .stub(CompassTelemetry as any, 'analytics')
        .value({ track, identify });
      sandbox.stub(CompassTelemetry as any, 'initPromise').value(null);

      await CompassTelemetry.init({
        preferences: {
          getPreferences: () => ({
            trackUsageStatistics: true,
            telemetryAnonymousId: 'anonymous-id',
            telemetryAtlasUserId: 'auid-1234',
            telemetryDeviceId: 'device-id',
          }),
          savePreferences: sandbox.stub().resolves(),
          onPreferenceValueChanged: (
            name: string,
            callback: (value: any) => void
          ) => {
            listeners[name] = callback;
            return () => undefined;
          },
        },
        addExitHandler: sandbox.stub(),
      } as any);

      identify.resetHistory();
    });

    it('keeps attributing events and does not re-identify once cleared', function () {
      listeners.telemetryAtlasUserId(undefined);

      expect(identify).to.not.have.been.called;

      CompassTelemetry.track({ event: 'Test Event', properties: {} });

      expect(trackedProperties()).to.have.property(
        'atlas_user_id',
        'auid-1234'
      );
    });

    it('re-identifies and attributes events once it is set', function () {
      listeners.telemetryAtlasUserId('auid-5678');

      expect(identify).to.have.been.calledOnce;
      expect(identify.firstCall.args[0]).to.have.property(
        'userId',
        'auid-5678'
      );

      CompassTelemetry.track({ event: 'Test Event', properties: {} });

      expect(trackedProperties()).to.have.property(
        'atlas_user_id',
        'auid-5678'
      );
    });
  });
});
