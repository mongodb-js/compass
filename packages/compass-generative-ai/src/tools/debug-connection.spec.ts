import Sinon from 'sinon';
import { expect } from 'chai';
import type {
  AtlasAdminApiService,
  AtlasClusterState,
} from '@mongodb-js/atlas-admin-api/provider';
import type { AtlasService } from '@mongodb-js/atlas-service/provider';
import { debugConnection } from './debug-connection';

const CONNECTION_STRING = 'mongodb+srv://cluster0.abcde.mongodb.net';

describe('debugConnection', function () {
  let sandbox: Sinon.SinonSandbox;
  let atlasAdminApi: {
    getProjectIdAndClusterName: Sinon.SinonStub;
    getClusterState: Sinon.SinonStub;
    getProjectIPAccessList: Sinon.SinonStub;
  };
  const atlasService = {} as AtlasService;

  function mockAtlasAdminApi(
    opts: {
      state?: AtlasClusterState;
      paused?: boolean;
      projectIdAndClusterName?: { projectId: string; clusterName: string };
    } = {}
  ) {
    const { state = 'IDLE', paused = false } = opts;
    // The cluster lookup resolves to undefined when the cluster is not among
    // the ones the user can see, so an explicit undefined has to be
    // distinguishable from an omitted option here.
    const projectIdAndClusterName =
      'projectIdAndClusterName' in opts
        ? opts.projectIdAndClusterName
        : { projectId: 'p1', clusterName: 'cluster0' };
    atlasAdminApi = {
      getProjectIdAndClusterName: sandbox
        .stub()
        .resolves(projectIdAndClusterName),
      getClusterState: sandbox.stub().resolves({ state, paused }),
      getProjectIPAccessList: sandbox.stub().resolves([]),
    };
    return atlasAdminApi as unknown as AtlasAdminApiService;
  }

  beforeEach(function () {
    sandbox = Sinon.createSandbox();
  });

  afterEach(function () {
    sandbox.restore();
  });

  it('returns notFound/unknown when the cluster does not exist or the user has no access to it', async function () {
    const api = mockAtlasAdminApi({ projectIdAndClusterName: undefined });

    const result = await debugConnection(CONNECTION_STRING, api, atlasService);

    expect(result).to.deep.equal({
      clusterState: 'notFound',
      ipAccessAllowed: 'unknown',
    });
    expect(atlasAdminApi.getClusterState).to.not.have.been.called;
  });

  it('looks up the cluster with the resolved project id and cluster name', async function () {
    const api = mockAtlasAdminApi();

    await debugConnection(CONNECTION_STRING, api, atlasService);

    expect(atlasAdminApi.getProjectIdAndClusterName).to.have.been.calledWith(
      CONNECTION_STRING
    );
    expect(atlasAdminApi.getClusterState).to.have.been.calledWith(
      'p1',
      'cluster0'
    );
  });

  it('reports paused regardless of the cluster state', async function () {
    const api = mockAtlasAdminApi({ state: 'IDLE', paused: true });

    const result = await debugConnection(CONNECTION_STRING, api, atlasService);

    expect(result.clusterState).to.equal('paused');
  });

  const stateCases: [AtlasClusterState, string][] = [
    ['IDLE', 'ready'],
    ['CREATING', 'provisioning'],
    ['UPDATING', 'provisioning'],
    ['REPAIRING', 'provisioning'],
    ['DELETING', 'deleted'],
  ];

  for (const [state, expected] of stateCases) {
    it(`maps cluster state ${state} to ${expected}`, async function () {
      const api = mockAtlasAdminApi({ state });

      const result = await debugConnection(
        CONNECTION_STRING,
        api,
        atlasService
      );

      expect(result).to.deep.equal({
        clusterState: expected,
        ipAccessAllowed: true,
      });
    });
  }

  it('propagates errors from getClusterState', async function () {
    const api = mockAtlasAdminApi();
    atlasAdminApi.getClusterState.rejects(new Error('nope'));

    try {
      await debugConnection(CONNECTION_STRING, api, atlasService);
      expect.fail('Expected debugConnection to throw');
    } catch (err) {
      expect(err).to.have.property('message', 'nope');
    }
  });
});
