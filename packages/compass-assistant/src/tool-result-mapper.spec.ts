import { expect } from 'chai';
import type { AtlasConnectionDebugResult } from '@mongodb-js/compass-generative-ai/provider';
import { mapAtlasConnectionDebugResult } from './tool-result-mapper';

describe('tool-result-mapper', function () {
  describe('mapAtlasConnectionDebugResult', function () {
    const debugResult: AtlasConnectionDebugResult = {
      cluster: 'Cluster0',
      clusterState: 'paused',
      ipAccessAllowed: true,
    };

    it('maps the result into cluster, state and ip access fields', function () {
      const fields = mapAtlasConnectionDebugResult(debugResult);

      expect(fields.map((field) => field.label)).to.deep.equal([
        'Cluster',
        'State',
        'IP Access',
      ]);
    });

    it('renders the cluster as a link to the value', function () {
      const [cluster] = mapAtlasConnectionDebugResult(debugResult);

      expect(cluster).to.deep.equal({
        type: 'link',
        label: 'Cluster',
        value: 'Cluster0',
        href: 'https://cloud.mongodb.com/',
      });
    });

    it('uppercases the cluster state', function () {
      const fields = mapAtlasConnectionDebugResult(debugResult);
      const state = fields.find((field) => field.label === 'State');

      expect(state).to.deep.equal({
        type: 'text',
        label: 'State',
        value: 'PAUSED',
      });
    });

    it('formats an allowed ip access result', function () {
      const fields = mapAtlasConnectionDebugResult({
        ...debugResult,
        ipAccessAllowed: true,
      });
      const ipAccess = fields.find((field) => field.label === 'IP Access');

      expect(ipAccess?.value).to.equal('Client IP allowed');
    });

    it('formats a denied ip access result', function () {
      const fields = mapAtlasConnectionDebugResult({
        ...debugResult,
        ipAccessAllowed: false,
      });
      const ipAccess = fields.find((field) => field.label === 'IP Access');

      expect(ipAccess?.value).to.equal('Client IP not allowed');
    });

    it('falls back to N/A for an empty cluster name', function () {
      const [cluster] = mapAtlasConnectionDebugResult({
        ...debugResult,
        cluster: '',
      });

      expect(cluster.value).to.equal('N/A');
    });

    it('falls back to N/A for an empty cluster state', function () {
      const fields = mapAtlasConnectionDebugResult({
        ...debugResult,
        clusterState: '' as AtlasConnectionDebugResult['clusterState'],
      });
      const state = fields.find((field) => field.label === 'State');

      expect(state?.value).to.equal('N/A');
    });
  });
});
