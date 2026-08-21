import { expect } from 'chai';
import type { AtlasConnectionDebugResult } from '@mongodb-js/compass-generative-ai/provider';
import { mapAtlasConnectionDebugResult } from './tool-result-mapper';

const CLUSTER_OVERVIEW_URL =
  'https://cloud.mongodb.com/v2/p1#/clusters/detail/Cluster0';
const NETWORK_ACCESS_LIST_URL =
  'https://cloud.mongodb.com/v2/p1#/security/network/accessList';

describe('tool-result-mapper', function () {
  describe('mapAtlasConnectionDebugResult', function () {
    const debugResult: AtlasConnectionDebugResult = {
      clusterName: 'Cluster0',
      clusterState: 'PAUSED',
      ipAccessStatus: 'Client IP Allowed',
      links: { clusterOverview: CLUSTER_OVERVIEW_URL },
    };

    it('maps the result into cluster, state and ip access fields', function () {
      const fields = mapAtlasConnectionDebugResult(debugResult);

      expect(fields.map((field) => field.label)).to.deep.equal([
        'Cluster',
        'State',
        'IP Access',
      ]);
    });

    it('renders the cluster as a link when the overview link is present', function () {
      const [cluster] = mapAtlasConnectionDebugResult(debugResult);

      expect(cluster).to.deep.equal({
        type: 'link',
        label: 'Cluster',
        value: 'Cluster0',
        href: CLUSTER_OVERVIEW_URL,
      });
    });

    it('renders the cluster as text when there are no links at all', function () {
      const [cluster] = mapAtlasConnectionDebugResult({
        clusterName: 'Unknown',
        clusterState: 'Unknown',
        ipAccessStatus: 'Could not confirm',
      });

      expect(cluster).to.deep.equal({
        type: 'text',
        label: 'Cluster',
        value: 'Unknown',
      });
    });

    it('passes the cluster state through as text', function () {
      const fields = mapAtlasConnectionDebugResult(debugResult);
      const state = fields.find((field) => field.label === 'State');

      expect(state).to.deep.equal({
        type: 'text',
        label: 'State',
        value: 'PAUSED',
      });
    });

    it('renders an allowed ip access status as text', function () {
      const fields = mapAtlasConnectionDebugResult(debugResult);
      const ipAccess = fields.find((field) => field.label === 'IP Access');

      expect(ipAccess).to.deep.equal({
        type: 'text',
        label: 'IP Access',
        value: 'Client IP Allowed',
      });
    });

    it('renders an unconfirmed ip access status as a link to the access list', function () {
      const fields = mapAtlasConnectionDebugResult({
        ...debugResult,
        ipAccessStatus: 'Could not confirm',
        links: {
          clusterOverview: CLUSTER_OVERVIEW_URL,
          networkAccessList: NETWORK_ACCESS_LIST_URL,
        },
      });
      const ipAccess = fields.find((field) => field.label === 'IP Access');

      expect(ipAccess).to.deep.equal({
        type: 'link',
        label: 'IP Access',
        value: 'Could not confirm',
        href: NETWORK_ACCESS_LIST_URL,
      });
    });
  });
});
