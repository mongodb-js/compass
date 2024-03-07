import { expect } from 'chai';
import { getAtlasPerformanceAdvisorLink } from './utils';

describe('compass-schema utils', function () {
  context('getAtlasPerformanceAdvisorLink', function () {
    it('returns the correct link for a serverless cluster', function () {
      const result = getAtlasPerformanceAdvisorLink({
        clusterId: '123456',
        clusterType: 'serverless',
        clusterName: 'Cluster0',
      });
      expect(result).to.equal('#/serverless/advisor/Cluster0/createIndexes');
    });
    it('returns the correct link for a replica set cluster', function () {
      const result = getAtlasPerformanceAdvisorLink({
        clusterId: '123456',
        clusterType: 'replicaSet',
        clusterName: 'Cluster0',
      });
      expect(result).to.equal('#/metrics/replicaSet/123456/advisor');
    });
  });
});
