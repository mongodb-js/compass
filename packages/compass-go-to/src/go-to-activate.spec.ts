import { expect } from 'chai';
import sinon from 'sinon';
import { activateGoToCandidate } from './go-to-activate';
import type { GoToCandidate } from './go-to-candidates';

function candidate(
  partial: Pick<GoToCandidate, 'id' | 'kind' | 'primary'> &
    Partial<GoToCandidate>
): GoToCandidate {
  return {
    connectionId: 'c1',
    secondary: '',
    connected: true,
    ...partial,
  };
}

describe('activateGoToCandidate', function () {
  let workspaces: {
    openDatabasesWorkspace: sinon.SinonStub;
    openCollectionsWorkspace: sinon.SinonStub;
    openCollectionWorkspace: sinon.SinonStub;
  };

  beforeEach(function () {
    workspaces = {
      openDatabasesWorkspace: sinon.stub(),
      openCollectionsWorkspace: sinon.stub(),
      openCollectionWorkspace: sinon.stub(),
    };
  });

  it('opens Databases workspace for a connected connection', function () {
    const opened = activateGoToCandidate(
      candidate({
        id: 'connection:c1',
        kind: 'connection',
        primary: 'Prod',
      }),
      workspaces
    );

    expect(opened).to.equal(true);
    expect(workspaces.openDatabasesWorkspace.calledOnce).to.equal(true);
    expect(workspaces.openDatabasesWorkspace.firstCall.args).to.deep.equal([
      'c1',
    ]);
  });

  it('opens Collections workspace for a database', function () {
    activateGoToCandidate(
      candidate({
        id: 'database:c1:admin',
        kind: 'database',
        primary: 'admin',
        namespace: 'admin',
        secondary: 'Prod',
      }),
      workspaces
    );

    expect(workspaces.openCollectionsWorkspace.calledOnce).to.equal(true);
    expect(workspaces.openCollectionsWorkspace.firstCall.args).to.deep.equal([
      'c1',
      'admin',
    ]);
  });

  it('opens Collection workspace for a collection', function () {
    activateGoToCandidate(
      candidate({
        id: 'collection:c1:admin.users',
        kind: 'collection',
        primary: 'users',
        namespace: 'admin.users',
        secondary: 'Prod',
      }),
      workspaces
    );

    expect(workspaces.openCollectionWorkspace.calledOnce).to.equal(true);
    expect(workspaces.openCollectionWorkspace.firstCall.args).to.deep.equal([
      'c1',
      'admin.users',
    ]);
  });

  it('does not open a workspace for a disconnected connection', function () {
    const opened = activateGoToCandidate(
      candidate({
        id: 'connection:c2',
        kind: 'connection',
        primary: 'Offline',
        connectionId: 'c2',
        connected: false,
      }),
      workspaces
    );

    expect(opened).to.equal(false);
    expect(workspaces.openDatabasesWorkspace.called).to.equal(false);
  });
});
