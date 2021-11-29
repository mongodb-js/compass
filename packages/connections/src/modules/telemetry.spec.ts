import { expect } from 'chai';
import { spy } from 'sinon';
import { ConnectionInfo } from '../../../data-service/lib';

import { trackConnectionAttemptEvent } from './telemetry';


let track;

describe.only('connection tracking', function() {

  beforeEach(function() {
    track = spy();
  });

  it('tracks a new connection attempt event - favorite', function() {
    trackConnectionAttemptEvent({favorite: {name: 'example'}, lastUsed: null} as ConnectionInfo, track);
    expect(track).to.have.been.calledWith('Connection Attempt', {
      is_favorite: true,
      is_recent: false,
      is_new: true,
    });
  });

  it('tracks a new connection attempt event - recent', function() {
    trackConnectionAttemptEvent({favorite: undefined, lastUsed: new Date()} as ConnectionInfo, track);
    expect(track).to.have.been.calledWith('Connection Attempt', {
      is_favorite: false,
      is_recent: true,
      is_new: false,
    });
  });
  
  it('tracks a new connection attempt event - new', function() {
    trackConnectionAttemptEvent({favorite: undefined, lastUsed: undefined} as ConnectionInfo, track);
    expect(track).to.have.been.calledWith('Connection Attempt', {
      is_favorite: false,
      is_recent: false,
      is_new: true,
    });
  });

  it('tracks a new connection attempt event - favorite and recent', function() {
    trackConnectionAttemptEvent({favorite: {name: 'example'}, lastUsed: new Date()} as ConnectionInfo, track);
    expect(track).to.have.been.calledWith('Connection Attempt', {
      is_favorite: true,
      is_recent: false,
      is_new: false,
    });
  });
});