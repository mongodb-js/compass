import { expect } from 'chai';
import { useSelector } from 'react-redux';
import { renderHook } from '@mongodb-js/testing-library-compass';
import { Provider } from 'react-redux';
import React from 'react';
import Sinon from 'sinon';
import type { ConnectionInfo } from '@mongodb-js/compass-connections/provider';
import type { Document } from 'mongodb';
import { selectIsViewSearchCompatible } from './is-view-search-compatible';
import { setupStore, createMockCollection } from '../../test/setup-store';
import type { IndexesPluginOptions } from '../stores/store';

describe('is-view-search-compatible', function () {
  describe('selectIsViewSearchCompatible', function () {
    function createAtlasConnectionInfo(): ConnectionInfo {
      return {
        id: 'TEST',
        connectionOptions: {
          connectionString: 'mongodb://localhost:27017',
        },
        atlasMetadata: {
          orgId: 'test-org',
          projectId: 'test-project',
          clusterName: 'test-cluster',
          clusterUniqueId: 'test-cluster-unique-id',
          clusterType: 'REPLICASET' as const,
          clusterState: 'IDLE' as const,
          metricsId: 'test-metrics-id',
          metricsType: 'replicaSet' as const,
          regionalBaseUrl: null,
          instanceSize: 'M10',
          userConnectionString: 'mongodb://localhost:27017',
          supports: {
            globalWrites: false,
            rollingIndexes: true,
          },
        },
      };
    }

    function createMockCollectionWithPipeline(pipeline?: Document[]) {
      const mockCollection = createMockCollection();
      return {
        ...mockCollection,
        pipeline,
        toJSON() {
          return { ...mockCollection, pipeline };
        },
        on: Sinon.spy(),
      } as any;
    }

    function getSelectIsViewSearchCompatibleResult(
      options: Partial<IndexesPluginOptions> = {},
      connectionInfo?: ConnectionInfo,
      pipeline?: Document[]
    ) {
      const collection = createMockCollectionWithPipeline(pipeline);
      const store = setupStore(options, {}, { collection });
      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(Provider, { store, children });

      const isAtlas = !!connectionInfo?.atlasMetadata;
      const { result } = renderHook(
        () => useSelector(selectIsViewSearchCompatible(isAtlas)),
        { wrapper }
      );
      return result.current;
    }

    describe('isViewVersionSearchCompatible', function () {
      context('when connected to Atlas (Data Explorer)', function () {
        it('should return true for server version >= 8.0.0', function () {
          const result = getSelectIsViewSearchCompatibleResult(
            { serverVersion: '8.0.0' },
            createAtlasConnectionInfo()
          );
          expect(result.isViewVersionSearchCompatible).to.equal(true);
        });

        it('should return false for server version < 8.0.0', function () {
          const result = getSelectIsViewSearchCompatibleResult(
            { serverVersion: '7.0.0' },
            createAtlasConnectionInfo()
          );
          expect(result.isViewVersionSearchCompatible).to.equal(false);
        });
      });

      context('when connected to Compass (non-Atlas)', function () {
        it('should return true for server version >= 8.1.0', function () {
          const result = getSelectIsViewSearchCompatibleResult({
            serverVersion: '8.1.0',
          });
          expect(result.isViewVersionSearchCompatible).to.equal(true);
        });

        it('should return false for server version 8.0.0', function () {
          const result = getSelectIsViewSearchCompatibleResult({
            serverVersion: '8.0.0',
          });
          expect(result.isViewVersionSearchCompatible).to.equal(false);
        });

        it('should return false for server version < 8.0.0', function () {
          const result = getSelectIsViewSearchCompatibleResult({
            serverVersion: '7.0.0',
          });
          expect(result.isViewVersionSearchCompatible).to.equal(false);
        });
      });
    });

    describe('isViewPipelineSearchQueryable', function () {
      it('should return true when pipeline is undefined', function () {
        const result = getSelectIsViewSearchCompatibleResult({
          serverVersion: '8.1.0',
        });
        expect(result.isViewPipelineSearchQueryable).to.equal(true);
      });

      it('should return true when pipeline contains only $addFields stages', function () {
        const result = getSelectIsViewSearchCompatibleResult(
          { serverVersion: '8.1.0' },
          undefined,
          [{ $addFields: { newField: 1 } }]
        );
        expect(result.isViewPipelineSearchQueryable).to.equal(true);
      });

      it('should return true when pipeline contains only $set stages', function () {
        const result = getSelectIsViewSearchCompatibleResult(
          { serverVersion: '8.1.0' },
          undefined,
          [{ $set: { newField: 1 } }]
        );
        expect(result.isViewPipelineSearchQueryable).to.equal(true);
      });

      it('should return true when pipeline contains $match with $expr', function () {
        const result = getSelectIsViewSearchCompatibleResult(
          { serverVersion: '8.1.0' },
          undefined,
          [{ $match: { $expr: { $eq: ['$status', 'active'] } } }]
        );
        expect(result.isViewPipelineSearchQueryable).to.equal(true);
      });

      it('should return false when pipeline contains $match without $expr', function () {
        const result = getSelectIsViewSearchCompatibleResult(
          { serverVersion: '8.1.0' },
          undefined,
          [{ $match: { status: 'active' } }]
        );
        expect(result.isViewPipelineSearchQueryable).to.equal(false);
      });

      it('should return false when pipeline contains non-queryable stages', function () {
        const result = getSelectIsViewSearchCompatibleResult(
          { serverVersion: '8.1.0' },
          undefined,
          [{ $group: { _id: '$category', count: { $sum: 1 } } }]
        );
        expect(result.isViewPipelineSearchQueryable).to.equal(false);
      });
    });
  });
});
