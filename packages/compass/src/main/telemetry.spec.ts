import Sinon from 'sinon';
import { expect } from 'chai';
import { CompassAuthService } from '@mongodb-js/atlas-service/main';
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

  function trackedProperties(): Record<string, unknown> {
    expect(track).to.have.been.calledOnce;
    return track.firstCall.args[0].properties;
  }

  describe('atlas_user_id', function () {
    it('is attached to events while signed in to Atlas', function () {
      sandbox
        .stub(CompassAuthService, 'getTrackingUserId')
        .returns('auid-1234');

      CompassTelemetry.track({ event: 'Test Event', properties: {} });

      expect(trackedProperties()).to.have.property(
        'atlas_user_id',
        'auid-1234'
      );
    });

    it('is omitted from events while signed out', function () {
      sandbox.stub(CompassAuthService, 'getTrackingUserId').returns(undefined);

      CompassTelemetry.track({ event: 'Test Event', properties: {} });

      expect(trackedProperties()).to.not.have.property('atlas_user_id');
    });

    it('is attached alongside the event and connection properties', function () {
      sandbox
        .stub(CompassAuthService, 'getTrackingUserId')
        .returns('auid-1234');

      CompassTelemetry.track({
        event: 'Test Event',
        properties: { connection_id: 'connection-1', some_attribute: 123 },
      });

      const properties = trackedProperties();
      expect(properties).to.have.property('atlas_user_id', 'auid-1234');
      expect(properties).to.have.property('connection_id', 'connection-1');
      expect(properties).to.have.property('some_attribute', 123);
      // Common properties are still applied.
      expect(properties).to.have.property('device_id');
    });

    it('is resolved for every event rather than cached', function () {
      const getTrackingUserId = sandbox.stub(
        CompassAuthService,
        'getTrackingUserId'
      );

      getTrackingUserId.returns(undefined);
      CompassTelemetry.track({ event: 'Test Event', properties: {} });

      // The user signs in between the two events.
      getTrackingUserId.returns('auid-1234');
      CompassTelemetry.track({ event: 'Test Event', properties: {} });

      expect(track.firstCall.args[0].properties).to.not.have.property(
        'atlas_user_id'
      );
      expect(track.secondCall.args[0].properties).to.have.property(
        'atlas_user_id',
        'auid-1234'
      );
    });
  });
});
