import AppRegistry from 'hadron-app-registry';
import { expect } from 'chai';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { spy } from 'sinon';

import Collection from '../collection';

function renderCollection(
  props: Partial<React.ComponentProps<typeof Collection>> = {}
) {
  const localAppRegistry = new AppRegistry();
  const globalAppRegistry = new AppRegistry();
  const selectOrCreateTabSpy = spy();
  const sourceReadonly = false;

  return render(
    <Collection
      isReadonly={false}
      isTimeSeries={false}
      isClustered={false}
      isFLE={false}
      tabs={[]}
      views={[]}
      globalAppRegistry={globalAppRegistry}
      scopedModals={[]}
      localAppRegistry={localAppRegistry}
      activeSubTab={0}
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      changeActiveSubTab={(activeSubTab: number, id: string) => {}}
      id="collection"
      namespace="db.coll"
      selectOrCreateTab={selectOrCreateTabSpy}
      sourceReadonly={sourceReadonly}
      pipeline={[]}
      stats={{
        'db.coll': {
          avgDocumentSize: '2B',
          avgIndexSize: '1B',
          documentCount: '1243',
          indexCount: '1',
          storageSize: '2B',
          totalIndexSize: '1B',
        },
      }}
      {...props}
    />
  );
}

describe('Collection [Component]', function () {
  describe('when rendered', function () {
    beforeEach(function () {
      renderCollection();
    });

    it('renders the correct root classname', function () {
      expect(screen.getByTestId('collection')).to.exist;
    });

    it('must not show the view icon', function () {
      expect(screen.queryByTestId('collection-badge-view')).to.not.exist;
    });

    it('must not include the collection name the view is based on', function () {
      expect(screen.queryByTestId('collection-view-on')).to.not.exist;
    });

    it('renders the collection stats', function () {
      expect(screen.queryByTestId('document-count')).to.be.visible;
    });

    it('renders the document count', function () {
      expect(screen.getByText('1243')).to.be.visible;
    });
  });

  describe('when rendered without stats for the collection', function () {
    beforeEach(function () {
      renderCollection({
        stats: {},
      });
    });

    it('renders the collection stats', function () {
      expect(screen.queryByTestId('document-count')).to.be.visible;
    });

    it('renders the document count N/A', function () {
      expect(screen.queryByTestId('document-count')?.textContent).to.equal(
        'N/ADocuments'
      );
    });
  });
});
