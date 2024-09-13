import { expect } from 'chai';
import { getAtlasPerformanceAdvisorLink } from './utils';

describe('compass-schema utils', function () {
  context('getAtlasPerformanceAdvisorLink', function () {
    it('returns the correct link for a serverless cluster', function () {
      expect(
        getAtlasPerformanceAdvisorLink({
          metricsId: '123456',
          metricsType: 'serverless',
          clusterName: 'Cluster0',
        })
      ).to.equal('#/serverless/advisor/Cluster0/createIndexes');
    });
    it('returns the correct link for other clusters', function () {
      expect(
        getAtlasPerformanceAdvisorLink({
          metricsId: '123456',
          metricsType: 'replicaSet',
          clusterName: 'Cluster0',
        })
      ).to.equal('#/metrics/replicaSet/123456/advisor');

      expect(
        getAtlasPerformanceAdvisorLink({
          metricsId: '123456',
          metricsType: 'cluster',
          clusterName: 'Cluster0',
        })
      ).to.equal('#/metrics/cluster/123456/advisor');

      expect(
        getAtlasPerformanceAdvisorLink({
          metricsId: '123456',
          metricsType: 'host',
          clusterName: 'Cluster0',
        })
      ).to.equal('#/metrics/host/123456/advisor');
    });
    it('encodes the parameters', function () {
      expect(
        getAtlasPerformanceAdvisorLink({
          metricsId: '123456',
          metricsType: 'serverless',
          clusterName: 'Cluster Something',
        }),
        'encodes cluster name'
      ).to.equal('#/serverless/advisor/Cluster%20Something/createIndexes');

      expect(
        getAtlasPerformanceAdvisorLink({
          metricsId: '123 456',
          metricsType: 'replica#Set' as any,
          clusterName: 'Cluster Something',
        }),
        'encodes cluster id and cluster type'
      ).to.equal('#/metrics/replica%23Set/123%20456/advisor');
    });
  });
});
