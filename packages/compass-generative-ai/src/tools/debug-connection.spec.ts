import Sinon from 'sinon';
import { expect } from 'chai';
import type {
  AtlasAdminApiService,
  AtlasAccessListEntry,
  AtlasClusterState,
} from '@mongodb-js/atlas-admin-api/provider';
import { debugConnection, isUserIpIncluded } from './debug-connection';

const CONNECTION_STRING = 'mongodb+srv://cluster0.abcde.mongodb.net';
const USER_IP = '1.2.3.4';

describe('isUserIpIncluded', function () {
  it('matches an exact ipAddress entry', function () {
    expect(isUserIpIncluded([{ ipAddress: '1.2.3.4' }], '1.2.3.4')).to.be.true;
  });

  it('does not match a different ipAddress entry', function () {
    expect(isUserIpIncluded([{ ipAddress: '1.2.3.5' }], '1.2.3.4')).to.be.false;
  });

  it('matches an ip inside a cidrBlock entry', function () {
    expect(isUserIpIncluded([{ cidrBlock: '1.2.3.0/24' }], '1.2.3.4')).to.be
      .true;
  });

  it('does not match an ip outside a cidrBlock entry', function () {
    expect(isUserIpIncluded([{ cidrBlock: '1.2.4.0/24' }], '1.2.3.4')).to.be
      .false;
  });

  it('finds a match anywhere in the list', function () {
    expect(
      isUserIpIncluded(
        [{ awsSecurityGroup: 'sg-1' }, { cidrBlock: '9.9.9.0/24' }],
        '9.9.9.9'
      )
    ).to.be.true;
  });

  it('does not match an entry without an ipAddress or a cidrBlock', function () {
    expect(isUserIpIncluded([{ awsSecurityGroup: 'sg-1' }], '1.2.3.4')).to.be
      .false;
  });

  it('does not match an empty access list', function () {
    expect(isUserIpIncluded([], '1.2.3.4')).to.be.false;
  });

  it('trims whitespace around the entry and the user ip', function () {
    expect(isUserIpIncluded([{ ipAddress: ' 1.2.3.4 ' }], ' 1.2.3.4 ')).to.be
      .true;
    expect(isUserIpIncluded([{ cidrBlock: ' 1.2.3.0/24 ' }], ' 1.2.3.4 ')).to.be
      .true;
  });

  it('returns false instead of throwing on malformed values', function () {
    expect(isUserIpIncluded([{ ipAddress: 'not-an-ip' }], '1.2.3.4')).to.be
      .false;
    expect(isUserIpIncluded([{ cidrBlock: 'not-a-cidr' }], '1.2.3.4')).to.be
      .false;
    expect(isUserIpIncluded([{ ipAddress: '1.2.3.4' }], 'not-an-ip')).to.be
      .false;
  });
});

describe('debugConnection', function () {
  let sandbox: Sinon.SinonSandbox;
  let atlasAdminApi: {
    getProjectIdAndClusterName: Sinon.SinonStub;
    getClusterState: Sinon.SinonStub;
    getProjectIPAccessList: Sinon.SinonStub;
  };

  function mockAtlasAdminApi(
    opts: {
      state?: AtlasClusterState;
      paused?: boolean;
      ipAccessList?: AtlasAccessListEntry[];
      projectIdAndClusterName?: { projectId: string; clusterName: string };
    } = {}
  ) {
    const { state = 'IDLE', paused = false, ipAccessList = [] } = opts;
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
      getProjectIPAccessList: sandbox.stub().resolves(ipAccessList),
    };
    return atlasAdminApi as unknown as AtlasAdminApiService;
  }

  beforeEach(function () {
    sandbox = Sinon.createSandbox();
  });

  afterEach(function () {
    sandbox.restore();
  });

  it('returns unknown values when the cluster does not exist or the user has no access to it', async function () {
    const api = mockAtlasAdminApi({ projectIdAndClusterName: undefined });

    const result = await debugConnection(CONNECTION_STRING, api);

    expect(result).to.deep.equal({
      clusterName: 'Unknown',
      clusterState: 'Unknown',
      ipAccessStatus: 'Could not confirm',
      advice: 'The cluster does not exist or you do not have access to it.',
    });
    expect(atlasAdminApi.getClusterState).to.not.have.been.called;
    expect(atlasAdminApi.getProjectIPAccessList).to.not.have.been.called;
  });

  it('looks up the cluster and the access list with the resolved project id and cluster name', async function () {
    const api = mockAtlasAdminApi();

    const result = await debugConnection(CONNECTION_STRING, api);

    expect(atlasAdminApi.getProjectIdAndClusterName).to.have.been.calledWith(
      CONNECTION_STRING
    );
    expect(atlasAdminApi.getClusterState).to.have.been.calledWith(
      'p1',
      'cluster0'
    );
    expect(atlasAdminApi.getProjectIPAccessList).to.have.been.calledWith('p1');
    expect(result.clusterName).to.equal('cluster0');
  });

  it('reports PAUSED regardless of the cluster state', async function () {
    const api = mockAtlasAdminApi({ state: 'IDLE', paused: true });

    const result = await debugConnection(CONNECTION_STRING, api);

    expect(result.clusterState).to.equal('PAUSED');
  });

  const stateCases: [AtlasClusterState, string][] = [
    ['IDLE', 'READY'],
    ['CREATING', 'CREATING'],
    ['UPDATING', 'UPDATING'],
    ['REPAIRING', 'REPAIRING'],
    ['DELETING', 'DELETING'],
  ];

  for (const [state, expected] of stateCases) {
    it(`maps cluster state ${state} to ${expected}`, async function () {
      const api = mockAtlasAdminApi({ state });

      const result = await debugConnection(CONNECTION_STRING, api);

      expect(result.clusterState).to.equal(expected);
    });
  }

  describe('ipAccessStatus', function () {
    it('is allowed when the user ip is on the access list', async function () {
      const api = mockAtlasAdminApi({
        ipAccessList: [{ ipAddress: '9.9.9.9' }, { ipAddress: USER_IP }],
      });

      const result = await debugConnection(CONNECTION_STRING, api);

      expect(result.ipAccessStatus).to.equal('Client IP Allowed');
    });

    it('cannot confirm when the user ip is not on the access list', async function () {
      const api = mockAtlasAdminApi({
        ipAccessList: [{ ipAddress: '9.9.9.9' }],
      });

      const result = await debugConnection(CONNECTION_STRING, api);

      expect(result.ipAccessStatus).to.equal('Could not confirm');
    });

    it('cannot confirm when the access list is empty', async function () {
      const api = mockAtlasAdminApi({ ipAccessList: [] });

      const result = await debugConnection(CONNECTION_STRING, api);

      expect(result.ipAccessStatus).to.equal('Could not confirm');
    });
  });

  describe('links', function () {
    it('always links to the cluster overview', async function () {
      const api = mockAtlasAdminApi({ ipAccessList: [{ ipAddress: USER_IP }] });

      const result = await debugConnection(CONNECTION_STRING, api);

      expect(result.links?.clusterOverview).to.equal(
        `${window.location.origin}/v2/p1#/clusters/detail/cluster0`
      );
    });

    it('omits the network access list link when the client ip is allowed', async function () {
      const api = mockAtlasAdminApi({ ipAccessList: [{ ipAddress: USER_IP }] });

      const result = await debugConnection(CONNECTION_STRING, api);

      expect(result.links).to.not.have.property('networkAccessList');
    });

    it('links to the network access list when access could not be confirmed', async function () {
      const api = mockAtlasAdminApi({ ipAccessList: [] });

      const result = await debugConnection(CONNECTION_STRING, api);

      expect(result.links?.networkAccessList).to.equal(
        `${window.location.origin}/v2/p1#/security/network/accessList`
      );
    });

    it('are omitted entirely when the cluster could not be found', async function () {
      const api = mockAtlasAdminApi({ projectIdAndClusterName: undefined });

      const result = await debugConnection(CONNECTION_STRING, api);

      expect(result).to.not.have.property('links');
    });
  });

  describe('networkAccessDetails', function () {
    it('is omitted when the client ip is allowed', async function () {
      const api = mockAtlasAdminApi({
        ipAccessList: [{ ipAddress: USER_IP }],
      });

      const result = await debugConnection(CONNECTION_STRING, api);

      expect(result).to.not.have.property('networkAccessDetails');
    });

    it('carries the access list and the user ip when access could not be confirmed', async function () {
      const ipAccessList = [{ ipAddress: '9.9.9.9' }];
      const api = mockAtlasAdminApi({ ipAccessList });

      const result = await debugConnection(CONNECTION_STRING, api);

      expect(result).to.have.property('networkAccessDetails');
      expect(result.networkAccessDetails).to.deep.equal({
        networkAccessList: ipAccessList,
        userIp: USER_IP,
      });
    });
  });

  describe('advice', function () {
    async function getAdvice(
      opts: Parameters<typeof mockAtlasAdminApi>[0] = {}
    ) {
      const api = mockAtlasAdminApi({
        ipAccessList: [{ ipAddress: USER_IP }],
        ...opts,
      });
      const { advice } = await debugConnection(CONNECTION_STRING, api);
      return advice;
    }

    it('is empty for a healthy cluster with an allowed ip', async function () {
      expect(await getAdvice()).to.equal('');
    });

    it('does not link anywhere for a healthy cluster with an allowed ip', async function () {
      expect(await getAdvice()).to.not.include(window.location.origin);
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

    it('explains a deleting cluster', async function () {
      expect(await getAdvice({ state: 'DELETING' })).to.include(
        'The cluster is being deleted.'
      );
    });

    it('links to the cluster overview page for a deleting cluster', async function () {
      expect(await getAdvice({ state: 'DELETING' })).to.include(
        `${window.location.origin}/v2/p1#/clusters/detail/cluster0`
      );
    });

    it('explains an ip that could not be verified', async function () {
      expect(await getAdvice({ ipAccessList: [] })).to.include(
        'We could not verify whether your network access is allowed. See the networkAccessDetails.'
      );
    });

    it('links to the network access list for an ip that is not on it', async function () {
      expect(await getAdvice({ ipAccessList: [] })).to.include(
        `${window.location.origin}/v2/p1#/security/network/accessList`
      );
    });

    it('combines cluster and network access advice', async function () {
      const advice = await getAdvice({
        state: 'IDLE',
        paused: true,
        ipAccessList: [],
      });
      expect(advice).to.include('The cluster is currently paused.');
      expect(advice).to.include(
        'We could not verify whether your network access is allowed.'
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
      await debugConnection(CONNECTION_STRING, api);
      expect.fail('Expected debugConnection to throw');
    } catch (err) {
      expect(err).to.have.property('message', 'nope');
    }
  });
});
