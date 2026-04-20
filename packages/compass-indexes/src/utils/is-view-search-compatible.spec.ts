import { expect } from 'chai';
import { useSelector } from 'react-redux';
import { renderHook } from '@mongodb-js/testing-library-compass';
import { Provider } from 'react-redux';
import React from 'react';
import Sinon from 'sinon';
import type { Document } from 'mongodb';
import { selectIsViewSearchCompatible } from './is-view-search-compatible';
import { setupStore, createMockCollection } from '../../test/setup-store';
import type { IndexesPluginOptions } from '../stores/store';

describe('is-view-search-compatible', function () {
  describe('selectIsViewSearchCompatible', function () {
    function createMockCollectionWithPipeline(pipeline?: Document[]) {
      const mockCollection = createMockCollection();
      return {
        ...mockCollection,
        pipeline,
        toJSON() {
          return { ...mockCollection, pipeline };
        },
        on: Sinon.spy(),
      };
    }

    function getSelectIsViewSearchCompatibleResult(
      options: Partial<IndexesPluginOptions> = {},
      pipeline?: Document[]
    ) {
      const collection = createMockCollectionWithPipeline(pipeline);
      const store = setupStore(options, {}, { collection });
      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(Provider, { store, children });

      const { result } = renderHook(
        () => useSelector(selectIsViewSearchCompatible),
        { wrapper }
      );
      return result.current;
    }

    describe('isViewVersionSearchCompatible', function () {
      it('should return true for server version >= 8.1.0', function () {
        const result = getSelectIsViewSearchCompatibleResult({
          serverVersion: '8.1.0',
        });
        expect(result.isViewVersionSearchCompatible).to.equal(true);
      });

      it('should return false for server version < 8.1.0', function () {
        const result = getSelectIsViewSearchCompatibleResult({
          serverVersion: '8.0.0',
        });
        expect(result.isViewVersionSearchCompatible).to.equal(false);
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
          [{ $addFields: { newField: 1 } }]
        );
        expect(result.isViewPipelineSearchQueryable).to.equal(true);
      });

      it('should return true when pipeline contains only $set stages', function () {
        const result = getSelectIsViewSearchCompatibleResult(
          { serverVersion: '8.1.0' },
          [{ $set: { newField: 1 } }]
        );
        expect(result.isViewPipelineSearchQueryable).to.equal(true);
      });

      it('should return true when pipeline contains $match with $expr', function () {
        const result = getSelectIsViewSearchCompatibleResult(
          { serverVersion: '8.1.0' },
          [{ $match: { $expr: { $eq: ['$status', 'active'] } } }]
        );
        expect(result.isViewPipelineSearchQueryable).to.equal(true);
      });

      it('should return false when pipeline contains $match without $expr', function () {
        const result = getSelectIsViewSearchCompatibleResult(
          { serverVersion: '8.1.0' },
          [{ $match: { status: 'active' } }]
        );
        expect(result.isViewPipelineSearchQueryable).to.equal(false);
      });

      it('should return false when pipeline contains non-queryable stages', function () {
        const result = getSelectIsViewSearchCompatibleResult(
          { serverVersion: '8.1.0' },
          [{ $group: { _id: '$category', count: { $sum: 1 } } }]
        );
        expect(result.isViewPipelineSearchQueryable).to.equal(false);
      });
    });
  });
});
