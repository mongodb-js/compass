import Sinon from 'sinon';
import { expect } from 'chai';
import type {
  AtlasAdminApiService,
  AtlasAccessListEntry,
  AtlasClusterState,
} from '@mongodb-js/atlas-admin-api/provider';
import type { TrackFunction } from '@mongodb-js/compass-telemetry/provider';
import { debugConnection, getIpAccessStatus } from './debug-connection';

const CONNECTION_STRING = 'mongodb+srv://cluster0.abcde.mongodb.net';
const USER_IP = '1.2.3.4';
const CLOUD_UI_BASE_URL = 'https://cloud.mongodb.com';

describe('getIpAccessStatus', function () {
  it('Recognizes when the user ip is on the access list', function () {
    // ipAddress and cidrBlock are both supported
    expect(getIpAccessStatus([{ ipAddress: '1.2.3.4' }], '1.2.3.4')).to.equal(
      'Client IP Allowed'
    );
    expect(
      getIpAccessStatus([{ cidrBlock: '1.2.3.0/24' }], '1.2.3.4')
    ).to.equal('Client IP Allowed');

    // single match is enough
    expect(
      getIpAccessStatus(
        [{ awsSecurityGroup: 'sg-1' }, { cidrBlock: '9.9.9.0/24' }],
        '9.9.9.9'
      )
    ).to.equal('Client IP Allowed');

    // whitespace is trimmed
    expect(
      getIpAccessStatus([{ ipAddress: ' 1.2.3.4 ' }], ' 1.2.3.4 ')
    ).to.equal('Client IP Allowed');
    expect(
      getIpAccessStatus([{ cidrBlock: ' 1.2.3.0/24 ' }], ' 1.2.3.4 ')
    ).to.equal('Client IP Allowed');
  });

  it('Recognizes when the user ip is not on the access list', function () {
    expect(getIpAccessStatus([{ ipAddress: '1.2.3.5' }], '1.2.3.4')).to.equal(
      'Client IP Not Allowed'
    );
    expect(
      getIpAccessStatus([{ cidrBlock: '1.2.4.0/24' }], '1.2.3.4')
    ).to.equal('Client IP Not Allowed');
    expect(getIpAccessStatus([], '1.2.3.4')).to.equal('Client IP Not Allowed');

    // malformed values in the access list are treated as not allowed
    expect(getIpAccessStatus([{ ipAddress: 'not-an-ip' }], '1.2.3.4')).to.equal(
      'Client IP Not Allowed'
    );
    expect(
      getIpAccessStatus([{ cidrBlock: 'not-a-cidr' }], '1.2.3.4')
    ).to.equal('Client IP Not Allowed');
  });

  it('When it cannot confirm whether the user ip is on the access list', function () {
    // missing or malformed values
    expect(getIpAccessStatus(undefined, '1.2.3.4')).to.equal(
      'Could not confirm'
    );
    expect(getIpAccessStatus([{ ipAddress: '1.2.3.4' }], undefined)).to.equal(
      'Could not confirm'
    );
    expect(getIpAccessStatus([{ ipAddress: '1.2.3.4' }], 'not-an-ip')).to.equal(
      'Could not confirm'
    );

    // awsSecurityGroup entries might be present, but we cannot confirm whether the user ip is allowed
    expect(
      getIpAccessStatus([{ awsSecurityGroup: 'sg-1' }], '1.2.3.4')
    ).to.equal('Could not confirm');
    expect(
      getIpAccessStatus(
        [{ awsSecurityGroup: 'sg-1' }, { cidrBlock: '3.2.3.0/24' }],
        '1.2.3.4'
      )
    ).to.equal('Could not confirm');
  });
});

describe('debugConnection', function () {
  let sandbox: Sinon.SinonSandbox;
  let atlasAdminApi: {
    getProjectIdAndClusterName: Sinon.SinonStub;
    getClusterState: Sinon.SinonStub;
    getProjectIPAccessList: Sinon.SinonStub;
    getSystemStatus: Sinon.SinonStub;
  };
  let trackStub: Sinon.SinonStub;
  let track!: TrackFunction;

  function mockAtlasAdminApi(
    opts: {
      state?: AtlasClusterState;
      paused?: boolean;
      ipAccessList?: AtlasAccessListEntry[];
      userIp?: string;
      projectIdAndClusterName?: { projectId: string; clusterName: string };
    } = {}
  ) {
    const {
      state = 'IDLE',
      paused = false,
      ipAccessList = [],
      userIp = USER_IP,
    } = opts;
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
      getSystemStatus: sandbox.stub().resolves({ ipAddress: userIp }),
    };
    return atlasAdminApi as unknown as AtlasAdminApiService;
  }

  beforeEach(function () {
    sandbox = Sinon.createSandbox();
    trackStub = sandbox.stub();
    track = trackStub;
  });

  afterEach(function () {
    sandbox.restore();
  });

  it('returns unknown values when the cluster does not exist or the user has no access to it', async function () {
    const api = mockAtlasAdminApi({ projectIdAndClusterName: undefined });

    const result = await debugConnection(
      CONNECTION_STRING,
      api,
      track,
      CLOUD_UI_BASE_URL
    );

    expect(result).to.deep.equal({
      clusterName: 'Unknown',
      clusterState: 'Unknown',
      ipAccessStatus: 'Could not confirm',
      advice: 'The cluster does not exist or you do not have access to it.',
    });
    expect(atlasAdminApi.getClusterState).to.not.have.been.called;
    expect(atlasAdminApi.getProjectIPAccessList).to.not.have.been.called;
    expect(atlasAdminApi.getSystemStatus).to.not.have.been.called;
  });

  it('looks up the cluster and the access list with the resolved project id and cluster name', async function () {
    const api = mockAtlasAdminApi();

    const result = await debugConnection(
      CONNECTION_STRING,
      api,
      track,
      CLOUD_UI_BASE_URL
    );

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

    const result = await debugConnection(
      CONNECTION_STRING,
      api,
      track,
      CLOUD_UI_BASE_URL
    );

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

      const result = await debugConnection(
        CONNECTION_STRING,
        api,
        track,
        CLOUD_UI_BASE_URL
      );

      expect(result.clusterState).to.equal(expected);
    });
  }

  describe('ipAccessStatus', function () {
    it('is allowed when the user ip is on the access list', async function () {
      const api = mockAtlasAdminApi({
        ipAccessList: [{ ipAddress: '9.9.9.9' }, { ipAddress: USER_IP }],
      });

      const result = await debugConnection(
        CONNECTION_STRING,
        api,
        track,
        CLOUD_UI_BASE_URL
      );

      expect(result.ipAccessStatus).to.equal('Client IP Allowed');
    });

    it('matches the access list against the ip reported by the system status endpoint', async function () {
      const api = mockAtlasAdminApi({
        userIp: '9.9.9.9',
        ipAccessList: [{ ipAddress: '9.9.9.9' }],
      });

      const result = await debugConnection(
        CONNECTION_STRING,
        api,
        track,
        CLOUD_UI_BASE_URL
      );

      expect(result.ipAccessStatus).to.equal('Client IP Allowed');
    });

    it('fails when the user ip cannot be resolved', async function () {
      const api = mockAtlasAdminApi({
        ipAccessList: [{ ipAddress: USER_IP }],
      });
      atlasAdminApi.getSystemStatus.rejects(new Error('nope'));

      try {
        await debugConnection(CONNECTION_STRING, api, track, CLOUD_UI_BASE_URL);
        expect.fail('expected debugConnection to reject');
      } catch (err) {
        expect((err as Error).message).to.equal('nope');
      }
    });
  });

  describe('links', function () {
    it('always links to the cluster overview', async function () {
      const api = mockAtlasAdminApi({ ipAccessList: [{ ipAddress: USER_IP }] });

      const result = await debugConnection(
        CONNECTION_STRING,
        api,
        track,
        CLOUD_UI_BASE_URL
      );

      expect(result.links?.clusterOverview).to.equal(
        `${CLOUD_UI_BASE_URL}/v2/p1#/clusters/detail/cluster0`
      );
    });

    it('omits the network access list link when the client ip is allowed', async function () {
      const api = mockAtlasAdminApi({ ipAccessList: [{ ipAddress: USER_IP }] });

      const result = await debugConnection(
        CONNECTION_STRING,
        api,
        track,
        CLOUD_UI_BASE_URL
      );

      expect(result.links).to.not.have.property('networkAccessList');
    });

    it('links to the network access list when access could not be confirmed', async function () {
      const api = mockAtlasAdminApi({ ipAccessList: [] });

      const result = await debugConnection(
        CONNECTION_STRING,
        api,
        track,
        CLOUD_UI_BASE_URL
      );

      expect(result.links?.networkAccessList).to.equal(
        `${CLOUD_UI_BASE_URL}/v2/p1#/security/network/accessList`
      );
    });

    it('are omitted entirely when the cluster could not be found', async function () {
      const api = mockAtlasAdminApi({ projectIdAndClusterName: undefined });

      const result = await debugConnection(
        CONNECTION_STRING,
        api,
        track,
        CLOUD_UI_BASE_URL
      );

      expect(result).to.not.have.property('links');
    });
  });

  describe('networkAccessDetails', function () {
    it('is omitted when the client ip is allowed', async function () {
      const api = mockAtlasAdminApi({
        ipAccessList: [{ ipAddress: USER_IP }],
      });

      const result = await debugConnection(
        CONNECTION_STRING,
        api,
        track,
        CLOUD_UI_BASE_URL
      );

      expect(result).to.not.have.property('networkAccessDetails');
    });

    it('carries the access list and the user ip when access could not be confirmed', async function () {
      const ipAccessList = [{ ipAddress: '9.9.9.9' }];
      const api = mockAtlasAdminApi({ ipAccessList });

      const result = await debugConnection(
        CONNECTION_STRING,
        api,
        track,
        CLOUD_UI_BASE_URL
      );

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
      const { advice } = await debugConnection(
        CONNECTION_STRING,
        api,
        track,
        CLOUD_UI_BASE_URL
      );
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
        `${CLOUD_UI_BASE_URL}/v2/p1#/clusters/detail/cluster0`
      );
    });

    it('explains a provisioning cluster', async function () {
      expect(await getAdvice({ state: 'CREATING' })).to.include(
        'The cluster is being provisioned. Wait until it is ready before attempting to connect.'
      );
    });

    it('links to the cluster overview page for a provisioning cluster', async function () {
      expect(await getAdvice({ state: 'CREATING' })).to.include(
        `${CLOUD_UI_BASE_URL}/v2/p1#/clusters/detail/cluster0`
      );
    });

    it('explains a deleting cluster', async function () {
      expect(await getAdvice({ state: 'DELETING' })).to.include(
        'The cluster is being deleted.'
      );
    });

    it('links to the cluster overview page for a deleting cluster', async function () {
      expect(await getAdvice({ state: 'DELETING' })).to.include(
        `${CLOUD_UI_BASE_URL}/v2/p1#/clusters/detail/cluster0`
      );
    });

    it('explains an ip that is not allowed', async function () {
      expect(await getAdvice({ ipAccessList: [] })).to.include(
        'Your current IP address is not allowed to access the cluster. See the networkAccessDetails.'
      );
    });

    it('explains an ip that could not be verified', async function () {
      expect(
        await getAdvice({ ipAccessList: [{ awsSecurityGroup: 'sg-1' }] })
      ).to.include(
        'We could not verify whether your network access is allowed. See the networkAccessDetails.'
      );
    });

    it('links to the network access list for an ip that is not on it', async function () {
      expect(await getAdvice({ ipAccessList: [] })).to.include(
        `${CLOUD_UI_BASE_URL}/v2/p1#/security/network/accessList`
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
        'Your current IP address is not allowed to access the cluster. See the networkAccessDetails.'
      );
    });

    it('explains a cluster that could not be found', async function () {
      expect(await getAdvice({ projectIdAndClusterName: undefined })).to.equal(
        'The cluster does not exist or you do not have access to it.'
      );
    });
  });

  describe('telemetry', function () {
    async function getSuccessPayload(
      opts: Parameters<typeof mockAtlasAdminApi>[0] = {}
    ) {
      const api = mockAtlasAdminApi({
        ipAccessList: [{ ipAddress: USER_IP }],
        ...opts,
      });
      await debugConnection(CONNECTION_STRING, api, track, CLOUD_UI_BASE_URL);
      expect(trackStub).to.have.been.calledOnce;
      const [event, payload] = trackStub.firstCall.args;
      expect(event).to.equal('Atlas Connection Troubleshooting Success');
      return payload;
    }

    it('reports a healthy cluster with an allowed ip', async function () {
      const payload = await getSuccessPayload();
      expect(payload.cluster_state).to.equal('READY');
      expect(payload.ip_access_status).to.equal('Client IP Allowed');
    });

    it('reports the duration of the run', async function () {
      const { duration } = await getSuccessPayload();
      expect(duration).to.be.a('number');
      expect(duration).to.be.at.least(0);
    });

    const stateCases: [
      string,
      Parameters<typeof mockAtlasAdminApi>[0],
      { cluster_state: string; ip_access_status?: string }
    ][] = [
      [
        'a paused cluster',
        { state: 'IDLE', paused: true },
        { cluster_state: 'PAUSED', ip_access_status: 'Client IP Allowed' },
      ],
      [
        'a provisioning cluster',
        { state: 'CREATING' },
        { cluster_state: 'CREATING', ip_access_status: 'Client IP Allowed' },
      ],
      [
        'a deleting cluster',
        { state: 'DELETING' },
        { cluster_state: 'DELETING', ip_access_status: 'Client IP Allowed' },
      ],
      [
        'an unverified ip',
        { ipAccessList: [] },
        { cluster_state: 'READY', ip_access_status: 'Client IP Not Allowed' },
      ],
      [
        'a paused cluster with an unverified ip',
        { state: 'IDLE', paused: true, ipAccessList: [] },
        { cluster_state: 'PAUSED', ip_access_status: 'Client IP Not Allowed' },
      ],
      [
        'a state that needs no action',
        { state: 'UPDATING' },
        { cluster_state: 'UPDATING', ip_access_status: 'Client IP Allowed' },
      ],
    ];

    for (const [description, opts, expected] of stateCases) {
      it(`reports ${description}`, async function () {
        const payload = await getSuccessPayload(opts);
        expect(payload.cluster_state).to.equal(expected.cluster_state);
        expect(payload.ip_access_status).to.equal(expected.ip_access_status);
      });
    }

    it('reports a cluster that could not be found', async function () {
      const payload = await getSuccessPayload({
        projectIdAndClusterName: undefined,
      });
      expect(payload.cluster_state).to.equal('Unknown');
      expect(payload.ip_access_status).to.equal('Could not confirm');
    });

    it('tracks a failure event when the atlas api throws', async function () {
      const api = mockAtlasAdminApi();
      const error = Object.assign(new Error('nope'), {
        name: 'AtlasError',
        code: 'ETIMEDOUT',
      });
      atlasAdminApi.getClusterState.rejects(error);

      try {
        await debugConnection(CONNECTION_STRING, api, track, CLOUD_UI_BASE_URL);
      } catch {
        // expected, asserted on separately
      }

      expect(trackStub).to.have.been.calledOnceWith(
        'Atlas Connection Troubleshooting Failed',
        { error_name: 'AtlasError', error_code: 'ETIMEDOUT' }
      );
    });

    it('does not track a success event when the atlas api throws', async function () {
      const api = mockAtlasAdminApi();
      atlasAdminApi.getProjectIPAccessList.rejects(new Error('nope'));

      try {
        await debugConnection(CONNECTION_STRING, api, track, CLOUD_UI_BASE_URL);
      } catch {
        // expected, asserted on separately
      }

      expect(trackStub).to.not.have.been.calledWith(
        'Atlas Connection Troubleshooting Success'
      );
    });
  });

  it('propagates errors from getClusterState', async function () {
    const api = mockAtlasAdminApi();
    atlasAdminApi.getClusterState.rejects(new Error('nope'));

    try {
      await debugConnection(CONNECTION_STRING, api, track, CLOUD_UI_BASE_URL);
      expect.fail('Expected debugConnection to throw');
    } catch (err) {
      expect(err).to.have.property('message', 'nope');
    }
  });
});
