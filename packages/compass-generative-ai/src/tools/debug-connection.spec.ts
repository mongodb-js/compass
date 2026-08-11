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
      advice: 'The cluster does not exist or you do not have access to it.',
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

      expect(result).to.include({
        clusterState: expected,
        ipAccessAllowed: true,
      });
    });
  }

  describe('advice', function () {
    async function getAdvice(
      opts: Parameters<typeof mockAtlasAdminApi>[0] = {}
    ) {
      const api = mockAtlasAdminApi(opts);
      const { advice } = await debugConnection(
        CONNECTION_STRING,
        api,
        atlasService
      );
      return advice;
    }

    it('is empty for a healthy cluster', async function () {
      expect(await getAdvice()).to.equal('');
    });

    it('explains a paused cluster', async function () {
      expect(await getAdvice({ state: 'IDLE', paused: true })).to.include(
        'The cluster is currently paused.'
      );
    });

    it('links to the cluster overview page for a paused cluster', async function () {
      expect(await getAdvice({ state: 'IDLE', paused: true })).to.include(
        `${window.location.origin}/v2/p1#/clusters/detail/cluster0`
      );
    });

    it('does not link anywhere for a healthy cluster', async function () {
      expect(await getAdvice()).to.not.include(window.location.origin);
    });

    it('explains a provisioning cluster', async function () {
      expect(await getAdvice({ state: 'CREATING' })).to.include(
        'The cluster is being provisioned. Wait until it is ready before attempting to connect.'
      );
    });

    it('links to the cluster overview page for a provisioning cluster', async function () {
      expect(await getAdvice({ state: 'CREATING' })).to.include(
        `${window.location.origin}/v2/p1#/clusters/detail/cluster0`
      );
    });

    it('explains a deleted cluster', async function () {
      expect(await getAdvice({ state: 'DELETING' })).to.include(
        'The cluster has been deleted.'
      );
    });

    it('explains a cluster that could not be found', async function () {
      expect(await getAdvice({ projectIdAndClusterName: undefined })).to.equal(
        'The cluster does not exist or you do not have access to it.'
      );
    });
  });

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
