import { expect } from 'chai';
import { getAtlasPerformanceAdvisorLink } from './utils';

describe('compass-schema utils', function () {
  context('getAtlasPerformanceAdvisorLink', function () {
    it('returns the correct link for a serverless cluster', function () {
      expect(
        getAtlasPerformanceAdvisorLink({
          clusterId: '123456',
          clusterType: 'serverless',
          clusterName: 'Cluster0',
        })
      ).to.equal('#/serverless/advisor/Cluster0/createIndexes');

      expect(
        getAtlasPerformanceAdvisorLink({
          clusterId: '123456',
          clusterType: 'serverless',
          clusterName: 'Cluster Something',
        }),
        'encode cluster name'
      ).to.equal('#/serverless/advisor/Cluster%20Something/createIndexes');
    });
    it('returns the correct link for other clusters', function () {
      expect(
        getAtlasPerformanceAdvisorLink({
          clusterId: '123456',
          clusterType: 'replicaSet',
          clusterName: 'Cluster0',
        })
      ).to.equal('#/metrics/replicaSet/123456/advisor');

      expect(
        getAtlasPerformanceAdvisorLink({
          clusterId: '123456',
          clusterType: 'cluster',
          clusterName: 'Cluster0',
        })
      ).to.equal('#/metrics/cluster/123456/advisor');

      expect(
        getAtlasPerformanceAdvisorLink({
          clusterId: '123456',
          clusterType: 'host',
          clusterName: 'Cluster0',
        })
      ).to.equal('#/metrics/host/123456/advisor');
    });
  });
});
