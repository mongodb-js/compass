import { expect } from 'chai';

import { shouldShowIndexesToolbarButtons } from './should-show-indexes-toolbar-buttons';

const baseParams = {
  isReadonlyView: false,
  serverVersion: '8.1.0',
  isSearchManagementActive: true,
  isViewPipelineSearchQueryable: true,
  hasSearchIndexes: false,
};

describe('shouldShowIndexesToolbarButtons', function () {
  it('always shows the toolbar for non-views', function () {
    expect(
      shouldShowIndexesToolbarButtons({
        ...baseParams,
        isReadonlyView: false,
        // even when nothing search-related applies
        isSearchManagementActive: false,
        isViewPipelineSearchQueryable: false,
      })
    ).to.be.true;
  });

  describe('for a readonly view', function () {
    const viewParams = { ...baseParams, isReadonlyView: true };

    it('hides the toolbar when the server version is below 8.1', function () {
      expect(
        shouldShowIndexesToolbarButtons({
          ...viewParams,
          serverVersion: '8.0.0',
        })
      ).to.be.false;
    });

    it('hides the toolbar when search management is not active', function () {
      expect(
        shouldShowIndexesToolbarButtons({
          ...viewParams,
          isSearchManagementActive: false,
        })
      ).to.be.false;
    });

    it('shows the toolbar for a search-queryable view', function () {
      expect(
        shouldShowIndexesToolbarButtons({
          ...viewParams,
          isViewPipelineSearchQueryable: true,
        })
      ).to.be.true;
    });

    describe('when the pipeline is not search-queryable', function () {
      const incompatibleViewParams = {
        ...viewParams,
        isViewPipelineSearchQueryable: false,
      };

      it('hides the toolbar when there are no existing search indexes', function () {
        expect(
          shouldShowIndexesToolbarButtons({
            ...incompatibleViewParams,
            hasSearchIndexes: false,
          })
        ).to.be.false;
      });

      it('shows the toolbar when there are existing search indexes', function () {
        expect(
          shouldShowIndexesToolbarButtons({
            ...incompatibleViewParams,
            hasSearchIndexes: true,
          })
        ).to.be.true;
      });
    });
  });
});
