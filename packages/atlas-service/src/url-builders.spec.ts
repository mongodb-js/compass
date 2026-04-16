import { expect } from 'chai';
import Sinon from 'sinon';
import type { AtlasClusterMetadata } from '@mongodb-js/connection-info';
import {
  buildAtlasSearchLink,
  buildChartsUrl,
  buildQueryInsightsUrl,
  buildClusterOverviewUrl,
  buildMonitoringUrl,
  buildPerformanceMetricsUrl,
  buildProjectSettingsUrl,
} from './url-builders';

const TEST_ORIGIN = 'https://cloud.mongodb.com';

const baseMetadata: AtlasClusterMetadata = {
  orgId: 'org123',
  projectId: 'proj123',
  clusterUniqueId: 'unique123',
  clusterName: 'myCluster',
  clusterType: 'REPLICASET',
  clusterState: 'IDLE',
  metricsId: 'metrics123',
  metricsType: 'replicaSet',
  regionalBaseUrl: null,
  userConnectionString: 'mongodb+srv://myCluster.example.mongodb.net',
  supports: {
    globalWrites: false,
    rollingIndexes: true,
  },
};

const flexMetadata: AtlasClusterMetadata = {
  ...baseMetadata,
  metricsType: 'flex',
};

describe('url-builders', function () {
  const sandbox = Sinon.createSandbox();

  before(function () {
    sandbox.stub(globalThis, 'window').value({
      location: {
        origin: TEST_ORIGIN,
      },
    } as unknown as Window);
  });

  after(function () {
    sandbox.restore();
  });

  describe('buildPerformanceMetricsUrl', function () {
    it('builds url for a non-flex cluster', function () {
      expect(buildPerformanceMetricsUrl(baseMetadata)).to.equal(
        `${TEST_ORIGIN}/v2/proj123#/host/replicaSet/metrics123/realtime/panel`
      );
    });

    it('builds url for a flex cluster', function () {
      expect(buildPerformanceMetricsUrl(flexMetadata)).to.equal(
        `${TEST_ORIGIN}/v2/proj123#/flex/realtime/myCluster`
      );
    });
  });

  describe('buildProjectSettingsUrl', function () {
    it('builds project settings url', function () {
      expect(buildProjectSettingsUrl({ projectId: 'proj123' })).to.equal(
        `${TEST_ORIGIN}/v2/proj123#/settings/groupSettings`
      );
    });
  });

  describe('buildMonitoringUrl', function () {
    it('builds url for a non-flex cluster', function () {
      expect(buildMonitoringUrl(baseMetadata)).to.equal(
        `${TEST_ORIGIN}/v2/proj123#/host/replicaSet/metrics123`
      );
    });

    it('builds url for a flex cluster', function () {
      expect(buildMonitoringUrl(flexMetadata)).to.equal(
        `${TEST_ORIGIN}/v2/proj123#/flex/monitoring/myCluster`
      );
    });
  });

  describe('buildClusterOverviewUrl', function () {
    it('builds url for a non-flex cluster', function () {
      expect(buildClusterOverviewUrl(baseMetadata)).to.equal(
        `${TEST_ORIGIN}/v2/proj123#/clusters/detail/myCluster`
      );
    });

    it('builds url for a flex cluster', function () {
      expect(buildClusterOverviewUrl(flexMetadata)).to.equal(
        `${TEST_ORIGIN}/v2/proj123#/flex/detail/myCluster`
      );
    });
  });

  describe('buildQueryInsightsUrl', function () {
    it('builds url for a non-flex cluster', function () {
      expect(buildQueryInsightsUrl(baseMetadata)).to.equal(
        `${TEST_ORIGIN}/v2/proj123#/metrics/replicaSet/metrics123/queryInsights/shape`
      );
    });

    it('builds url for a flex cluster', function () {
      expect(buildQueryInsightsUrl(flexMetadata)).to.equal(
        `${TEST_ORIGIN}/v2/proj123#/flex/queryInsights/myCluster`
      );
    });
  });

  describe('buildChartsUrl', function () {
    it('builds url without a namespace', function () {
      expect(buildChartsUrl(baseMetadata)).to.equal(
        `${TEST_ORIGIN}/charts/proj123?sourceType=cluster&name=myCluster`
      );
    });

    it('builds url with a namespace that includes a database', function () {
      expect(buildChartsUrl(baseMetadata, 'myDB.myCollection')).to.equal(
        `${TEST_ORIGIN}/charts/proj123?sourceType=cluster&name=myCluster&database=myDB`
      );
    });

    it('does not include database param when namespace has no database', function () {
      expect(buildChartsUrl(baseMetadata, '')).to.equal(
        `${TEST_ORIGIN}/charts/proj123?sourceType=cluster&name=myCluster`
      );
    });
  });

  describe('buildAtlasSearchLink', function () {
    it('builds url with database and collection params when namespace is complete', function () {
      expect(
        buildAtlasSearchLink({
          atlasMetadata: baseMetadata,
          namespace: 'myDB.myCollection',
        })
      ).to.equal(
        `${TEST_ORIGIN}/v2/proj123#/clusters/atlasSearch/myCluster?collectionName=myCollection&database=myDB`
      );
    });

    it('builds url with indexName param when provided', function () {
      expect(
        buildAtlasSearchLink({
          atlasMetadata: baseMetadata,
          namespace: 'myDB.myCollection',
          indexName: 'myIndex',
        })
      ).to.equal(
        `${TEST_ORIGIN}/v2/proj123#/clusters/atlasSearch/myCluster?collectionName=myCollection&database=myDB&indexName=myIndex`
      );
    });

    it('builds url with indexName and view params when both provided', function () {
      expect(
        buildAtlasSearchLink({
          atlasMetadata: baseMetadata,
          namespace: 'myDB.myCollection',
          indexName: 'myIndex',
          view: 'editIndex',
        })
      ).to.equal(
        `${TEST_ORIGIN}/v2/proj123#/clusters/atlasSearch/myCluster?collectionName=myCollection&database=myDB&indexName=myIndex&view=editIndex`
      );
    });

    it('does not include view param when indexName is not provided', function () {
      const url = buildAtlasSearchLink({
        atlasMetadata: baseMetadata,
        namespace: 'myDB.myCollection',
        view: 'editIndex',
      });
      expect(url).to.not.include('view=');
      expect(url).to.equal(
        `${TEST_ORIGIN}/v2/proj123#/clusters/atlasSearch/myCluster?collectionName=myCollection&database=myDB`
      );
    });

    it('does not include query params when namespace has no collection', function () {
      expect(
        buildAtlasSearchLink({
          atlasMetadata: baseMetadata,
          namespace: 'myDB',
        })
      ).to.equal(`${TEST_ORIGIN}/v2/proj123#/clusters/atlasSearch/myCluster`);
    });

    it('does not include query params when namespace is empty', function () {
      expect(
        buildAtlasSearchLink({
          atlasMetadata: baseMetadata,
          namespace: '',
          indexName: 'myIndex',
          view: 'editIndex',
        })
      ).to.equal(`${TEST_ORIGIN}/v2/proj123#/clusters/atlasSearch/myCluster`);
    });
  });
});
