import { expect } from 'chai';
import { useSelector } from 'react-redux';
import {
  renderHook,
  renderHookWithActiveConnection,
} from '@mongodb-js/testing-library-compass';
import { Provider } from 'react-redux';
import React from 'react';
import type { ConnectionInfo } from '@mongodb-js/compass-connections/provider';
import { selectReadWriteAccess } from './indexes-read-write-access';
import { setupStore } from '../../test/setup-store';
import type { IndexesPluginOptions } from '../stores/store';

describe('indexes-read-write-access', function () {
  describe('selectReadWriteAccess', function () {
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

    async function getSelectReadWriteAccessResult(
      options: Partial<IndexesPluginOptions> = {},
      preferences: {
        readOnly?: boolean;
        readWrite?: boolean;
        enableAtlasSearchIndexes?: boolean;
      } = {},
      connectionInfo?: ConnectionInfo
    ) {
      const store = setupStore(options, {}, {});
      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(Provider, { store, children });

      const isAtlas = !!connectionInfo?.atlasMetadata;
      const readOnly = preferences.readOnly ?? false;
      const readWrite = preferences.readWrite ?? false;
      const enableAtlasSearchIndexes =
        preferences.enableAtlasSearchIndexes ?? true;

      if (connectionInfo) {
        const { result } = await renderHookWithActiveConnection(
          () =>
            useSelector(
              selectReadWriteAccess({
                isAtlas,
                readOnly,
                readWrite,
                enableAtlasSearchIndexes,
              })
            ),
          connectionInfo,
          {
            wrapper,
            preferences: {
              enableRollingIndexes: true,
              enableAtlasSearchIndexes: true,
              readOnly: false,
              readWrite: false,
              ...preferences,
            },
          }
        );
        return result.current;
      } else {
        const { result } = renderHook(
          () =>
            useSelector(
              selectReadWriteAccess({
                isAtlas,
                readOnly,
                readWrite,
                enableAtlasSearchIndexes,
              })
            ),
          {
            wrapper,
            preferences: {
              enableRollingIndexes: true,
              enableAtlasSearchIndexes: true,
              readOnly: false,
              readWrite: false,
              ...preferences,
            },
          }
        );
        return result.current;
      }
    }

    describe('regular indexes', function () {
      context('when isReadonlyView is false', function () {
        it('should return isRegularIndexesReadable as true', async function () {
          const result = await getSelectReadWriteAccessResult({
            isReadonly: false,
          });
          expect(result.isRegularIndexesReadable).to.equal(true);
        });

        it('should return isRegularIndexesWritable as true when isWritable is true and preferences allow', async function () {
          const result = await getSelectReadWriteAccessResult(
            { isReadonly: false },
            {}
          );
          expect(result.isRegularIndexesWritable).to.equal(true);
        });

        it('should return isRegularIndexesWritable as false when readOnly preference is true', async function () {
          const result = await getSelectReadWriteAccessResult(
            { isReadonly: false },
            { readOnly: true }
          );
          expect(result.isRegularIndexesWritable).to.equal(false);
        });

        it('should return isRegularIndexesWritable as false when readWrite preference is true', async function () {
          const result = await getSelectReadWriteAccessResult(
            { isReadonly: false },
            { readWrite: true }
          );
          expect(result.isRegularIndexesWritable).to.equal(false);
        });
      });

      context('when isReadonlyView is true', function () {
        it('should return isRegularIndexesReadable as false', async function () {
          const result = await getSelectReadWriteAccessResult({
            isReadonly: true,
          });
          expect(result.isRegularIndexesReadable).to.equal(false);
        });

        it('should return isRegularIndexesWritable as false', async function () {
          const result = await getSelectReadWriteAccessResult({
            isReadonly: true,
          });
          expect(result.isRegularIndexesWritable).to.equal(false);
        });
      });
    });

    describe('search indexes', function () {
      context('when isReadonlyView is false', function () {
        it('should return isSearchIndexesReadable as true when enableAtlasSearchIndexes is true and isSearchIndexesSupported is true', async function () {
          const result = await getSelectReadWriteAccessResult(
            { isReadonly: false, isSearchIndexesSupported: true },
            {}
          );
          expect(result.isSearchIndexesReadable).to.equal(true);
        });

        it('should return isSearchIndexesReadable as false when enableAtlasSearchIndexes is false', async function () {
          const result = await getSelectReadWriteAccessResult(
            { isReadonly: false, isSearchIndexesSupported: true },
            { enableAtlasSearchIndexes: false }
          );
          expect(result.isSearchIndexesReadable).to.equal(false);
        });

        it('should return isSearchIndexesReadable as false when isSearchIndexesSupported is false', async function () {
          const result = await getSelectReadWriteAccessResult({
            isReadonly: false,
            isSearchIndexesSupported: false,
          });
          expect(result.isSearchIndexesReadable).to.equal(false);
        });

        it('should return isSearchIndexesWritable as true when all conditions are met', async function () {
          const result = await getSelectReadWriteAccessResult({
            isReadonly: false,
            isSearchIndexesSupported: true,
          });
          expect(result.isSearchIndexesWritable).to.equal(true);
        });

        it('should return isSearchIndexesWritable as false when readOnly preference is true', async function () {
          const result = await getSelectReadWriteAccessResult(
            { isReadonly: false, isSearchIndexesSupported: true },
            { readOnly: true }
          );
          expect(result.isSearchIndexesWritable).to.equal(false);
        });

        it('should return isSearchIndexesWritable as false when readWrite preference is true', async function () {
          const result = await getSelectReadWriteAccessResult(
            { isReadonly: false, isSearchIndexesSupported: true },
            { readWrite: true }
          );
          expect(result.isSearchIndexesWritable).to.equal(false);
        });
      });

      context('when isReadonlyView is true', function () {
        it('should return isSearchIndexesReadable as true when view is search compatible', async function () {
          const result = await getSelectReadWriteAccessResult(
            {
              isReadonly: true,
              serverVersion: '8.0.0',
            },
            undefined,
            createAtlasConnectionInfo()
          );
          expect(result.isSearchIndexesReadable).to.equal(true);
        });

        it('should return isSearchIndexesReadable as false when enableAtlasSearchIndexes is false', async function () {
          const result = await getSelectReadWriteAccessResult(
            {
              isReadonly: true,
              serverVersion: '8.0.0',
            },
            { enableAtlasSearchIndexes: false },
            createAtlasConnectionInfo()
          );
          expect(result.isSearchIndexesReadable).to.equal(false);
        });

        it('should return isSearchIndexesWritable as true when view is search compatible and pipeline is queryable', async function () {
          const result = await getSelectReadWriteAccessResult(
            {
              isReadonly: true,
              serverVersion: '8.0.0',
            },
            undefined,
            createAtlasConnectionInfo()
          );
          expect(result.isSearchIndexesWritable).to.equal(true);
        });

        it('should return isSearchIndexesWritable as false when readOnly preference is true', async function () {
          const result = await getSelectReadWriteAccessResult(
            {
              isReadonly: true,
              serverVersion: '7.0.0',
            },
            { readOnly: true },
            createAtlasConnectionInfo()
          );
          expect(result.isSearchIndexesWritable).to.equal(false);
        });
      });
    });
  });
});
