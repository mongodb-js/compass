import { expect } from 'chai';
import { useSelector } from 'react-redux';
import { renderHook } from '@mongodb-js/testing-library-compass';
import { Provider } from 'react-redux';
import React from 'react';
import { selectReadWriteAccess } from './indexes-read-write-access';
import { setupStore } from '../../test/setup-store';
import type { IndexesPluginOptions } from '../stores/store';

describe('indexes-read-write-access', function () {
  describe('selectReadWriteAccess', function () {
    function getSelectReadWriteAccessResult(
      options: Partial<IndexesPluginOptions> = {},
      preferences: {
        readOnly?: boolean;
        readWrite?: boolean;
        enableIndexesManagement?: boolean;
        enableAtlasSearchIndexes?: boolean;
        enableSearchActivationProgramP1?: boolean;
      } = {}
    ) {
      const store = setupStore(options, {}, {});
      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(Provider, { store, children });

      const readOnly = preferences.readOnly ?? false;
      const readWrite = preferences.readWrite ?? false;
      const enableIndexesManagement =
        preferences.enableIndexesManagement ?? false;
      const enableAtlasSearchIndexes =
        preferences.enableAtlasSearchIndexes ?? true;
      const enableSearchActivationProgramP1 =
        preferences.enableSearchActivationProgramP1 ?? false;
      const { result } = renderHook(
        () =>
          useSelector(
            selectReadWriteAccess({
              readOnly,
              readWrite,
              enableAtlasSearchIndexes,
              enableSearchActivationProgramP1,
              enableIndexesManagement,
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

    describe('regular indexes', function () {
      context('when isReadonlyView is false', function () {
        it('should return isRegularIndexesReadable as true', function () {
          const result = getSelectReadWriteAccessResult({
            isReadonly: false,
          });
          expect(result.isRegularIndexesReadable).to.equal(true);
        });

        it('should return isRegularIndexesWritable as true when isWritable is true and preferences allow', function () {
          const result = getSelectReadWriteAccessResult(
            { isReadonly: false },
            {}
          );
          expect(result.isRegularIndexesWritable).to.equal(true);
        });

        it('should return isRegularIndexesWritable as false when readOnly preference is true and index management is disabled', function () {
          const result = getSelectReadWriteAccessResult(
            { isReadonly: false },
            { readOnly: true, enableIndexesManagement: false }
          );
          expect(result.isRegularIndexesWritable).to.equal(false);
        });

        it('should return isRegularIndexesWritable as false when readWrite preference is true and index management is disabled', function () {
          const result = getSelectReadWriteAccessResult(
            { isReadonly: false },
            { readWrite: true, enableIndexesManagement: false }
          );
          expect(result.isRegularIndexesWritable).to.equal(false);
        });

        it('should return isRegularIndexesWritable as true for a read-only + index-manager user (enableIndexesManagement bypasses readOnly)', function () {
          const result = getSelectReadWriteAccessResult(
            { isReadonly: false },
            { readOnly: true, enableIndexesManagement: true }
          );
          expect(result.isRegularIndexesWritable).to.equal(true);
        });

        it('should return isRegularIndexesWritable as true for a read-write + index-manager user (enableIndexesManagement bypasses readWrite)', function () {
          const result = getSelectReadWriteAccessResult(
            { isReadonly: false },
            { readWrite: true, enableIndexesManagement: true }
          );
          expect(result.isRegularIndexesWritable).to.equal(true);
        });

        it('should return isRegularIndexesWritable as true for an admin/writer (no read restrictions) regardless of index management flag', function () {
          const result = getSelectReadWriteAccessResult(
            { isReadonly: false },
            {
              readOnly: false,
              readWrite: false,
              enableIndexesManagement: false,
            }
          );
          expect(result.isRegularIndexesWritable).to.equal(true);
        });
      });

      context('when isReadonlyView is true', function () {
        it('should return isRegularIndexesReadable as false', function () {
          const result = getSelectReadWriteAccessResult({
            isReadonly: true,
          });
          expect(result.isRegularIndexesReadable).to.equal(false);
        });

        it('should return isRegularIndexesWritable as false', function () {
          const result = getSelectReadWriteAccessResult({
            isReadonly: true,
          });
          expect(result.isRegularIndexesWritable).to.equal(false);
        });

        it('should keep isRegularIndexesWritable as false even for an index-manager user (index management cannot override a readonly view)', function () {
          const result = getSelectReadWriteAccessResult(
            { isReadonly: true },
            { readOnly: true, enableIndexesManagement: true }
          );
          expect(result.isRegularIndexesWritable).to.equal(false);
        });
      });
    });

    describe('search indexes', function () {
      context('when isReadonlyView is false', function () {
        it('should return isSearchIndexesReadable as true when enableAtlasSearchIndexes is true and isSearchIndexesSupported is true', function () {
          const result = getSelectReadWriteAccessResult(
            { isReadonly: false, isSearchIndexesSupported: true },
            { enableAtlasSearchIndexes: true }
          );
          expect(result.isSearchIndexesReadable).to.equal(true);
        });

        it('should return isSearchIndexesReadable as false when enableAtlasSearchIndexes is false', function () {
          const result = getSelectReadWriteAccessResult(
            { isReadonly: false, isSearchIndexesSupported: true },
            { enableAtlasSearchIndexes: false }
          );
          expect(result.isSearchIndexesReadable).to.equal(false);
        });

        it('should return isSearchIndexesReadable as false when isSearchIndexesSupported is false', function () {
          const result = getSelectReadWriteAccessResult({
            isReadonly: false,
            isSearchIndexesSupported: false,
          });
          expect(result.isSearchIndexesReadable).to.equal(false);
        });

        it('should return isSearchIndexesWritable as true when all conditions are met', function () {
          const result = getSelectReadWriteAccessResult(
            {
              isReadonly: false,
              isSearchIndexesSupported: true,
            },
            { enableAtlasSearchIndexes: true }
          );
          expect(result.isSearchIndexesWritable).to.equal(true);
        });

        it('should return isSearchIndexesWritable as false when readOnly preference is true', function () {
          const result = getSelectReadWriteAccessResult(
            { isReadonly: false, isSearchIndexesSupported: true },
            { readOnly: true }
          );
          expect(result.isSearchIndexesWritable).to.equal(false);
        });

        it('should return isSearchIndexesWritable as false when readWrite preference is true', function () {
          const result = getSelectReadWriteAccessResult(
            { isReadonly: false, isSearchIndexesSupported: true },
            { readWrite: true }
          );
          expect(result.isSearchIndexesWritable).to.equal(false);
        });

        it('should return isSearchIndexesWritable as false for an index-manager user (index management does not grant search index write access)', function () {
          const result = getSelectReadWriteAccessResult(
            { isReadonly: false, isSearchIndexesSupported: true },
            { readOnly: true, enableIndexesManagement: true }
          );
          expect(result.isSearchIndexesWritable).to.equal(false);
        });
      });

      context('when isReadonlyView is true', function () {
        it('should return isSearchIndexesReadable as true when view is search compatible', function () {
          const result = getSelectReadWriteAccessResult(
            {
              isReadonly: true,
              serverVersion: '8.1.0',
            },
            { enableAtlasSearchIndexes: true }
          );
          expect(result.isSearchIndexesReadable).to.equal(true);
        });

        it('should return isSearchIndexesReadable as false when enableAtlasSearchIndexes is false', function () {
          const result = getSelectReadWriteAccessResult(
            {
              isReadonly: true,
              serverVersion: '8.1.0',
            },
            { enableAtlasSearchIndexes: false }
          );
          expect(result.isSearchIndexesReadable).to.equal(false);
        });

        it('should return isSearchIndexesWritable as true when view is search compatible and pipeline is queryable', function () {
          const result = getSelectReadWriteAccessResult(
            {
              isReadonly: true,
              serverVersion: '8.1.0',
            },
            { enableAtlasSearchIndexes: true }
          );
          expect(result.isSearchIndexesWritable).to.equal(true);
        });

        it('should return isSearchIndexesWritable as false when readOnly preference is true', function () {
          const result = getSelectReadWriteAccessResult(
            {
              isReadonly: true,
              serverVersion: '8.1.0',
            },
            { readOnly: true }
          );
          expect(result.isSearchIndexesWritable).to.equal(false);
        });
      });
    });
  });
});
