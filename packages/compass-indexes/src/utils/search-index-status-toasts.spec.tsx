import sinon from 'sinon';
import { expect } from 'chai';
import * as compassComponents from '@mongodb-js/compass-components';
import { showIndexStatusChangeToasts } from './search-index-status-toasts';
import { mockSearchIndex } from '../../test/helpers';
import type { AtlasClusterMetadata } from '@mongodb-js/connection-info';

const NAMESPACE = 'db.coll';
const ATLAS_METADATA = {
  clusterName: 'MyCluster',
} as AtlasClusterMetadata;

describe('showIndexStatusChangeToasts', function () {
  let openToastStub: sinon.SinonStub;

  beforeEach(function () {
    openToastStub = sinon.stub();
    // openToast is re-exported as a getter from compass-components, so we use
    // replaceGetter rather than stub() to intercept calls made by the module
    // under test.
    sinon.replaceGetter(compassComponents, 'openToast', () => openToastStub);
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('BUILDING status', function () {
    it('shows a "build in progress" toast when a new index appears in BUILDING state', function () {
      const newIndex = mockSearchIndex({ name: 'myIndex', status: 'BUILDING' });

      showIndexStatusChangeToasts([], [newIndex], undefined, NAMESPACE);

      expect(openToastStub).to.have.been.calledOnce;
      expect(openToastStub.firstCall.args[0]).to.equal(
        'search-index-building-myIndex'
      );
      expect(openToastStub.firstCall.args[1]).to.include({
        title: 'Index build in progress',
        variant: 'progress',
      });
      expect(openToastStub.firstCall.args[1].description).to.include('myIndex');
    });

    it('shows a "rebuilding" toast when an existing index transitions to BUILDING', function () {
      const previousIndex = mockSearchIndex({
        name: 'myIndex',
        status: 'READY',
        queryable: true,
      });
      const newIndex = mockSearchIndex({ name: 'myIndex', status: 'BUILDING' });

      showIndexStatusChangeToasts(
        [previousIndex],
        [newIndex],
        undefined,
        NAMESPACE
      );

      expect(openToastStub).to.have.been.calledOnce;
      expect(openToastStub.firstCall.args[0]).to.equal(
        'search-index-rebuilding-myIndex'
      );
      expect(openToastStub.firstCall.args[1].title).to.include('rebuilding');
      expect(openToastStub.firstCall.args[1].variant).to.equal('progress');
    });

    it('does not show a toast when an index was already BUILDING', function () {
      const previousIndex = mockSearchIndex({
        name: 'myIndex',
        status: 'BUILDING',
      });
      const newIndex = mockSearchIndex({ name: 'myIndex', status: 'BUILDING' });

      showIndexStatusChangeToasts(
        [previousIndex],
        [newIndex],
        undefined,
        NAMESPACE
      );

      expect(openToastStub).not.to.have.been.called;
    });

    it('uses "Vector search index" label for vectorSearch type', function () {
      const newIndex = mockSearchIndex({
        name: 'vecIdx',
        status: 'BUILDING',
        type: 'vectorSearch',
      });

      showIndexStatusChangeToasts([], [newIndex], undefined, NAMESPACE);

      expect(openToastStub.firstCall.args[1].description).to.include(
        'Vector search index'
      );
    });

    it('mentions queryable state in rebuilding toast when previous index was not queryable', function () {
      const previousIndex = mockSearchIndex({
        name: 'myIndex',
        status: 'FAILED',
        queryable: false,
      });
      const newIndex = mockSearchIndex({ name: 'myIndex', status: 'BUILDING' });

      showIndexStatusChangeToasts(
        [previousIndex],
        [newIndex],
        undefined,
        NAMESPACE
      );

      expect(openToastStub.firstCall.args[1].description).to.include(
        'non-queryable'
      );
    });
  });

  describe('FAILED status', function () {
    it('shows a "build failed" toast when an index transitions to FAILED', function () {
      const previousIndex = mockSearchIndex({
        name: 'myIndex',
        status: 'BUILDING',
      });
      const newIndex = mockSearchIndex({
        name: 'myIndex',
        status: 'FAILED',
        queryable: false,
      });

      showIndexStatusChangeToasts(
        [previousIndex],
        [newIndex],
        undefined,
        NAMESPACE
      );

      expect(openToastStub).to.have.been.calledOnce;
      expect(openToastStub.firstCall.args[0]).to.equal(
        'search-index-build-failed-myIndex'
      );
      expect(openToastStub.firstCall.args[1].variant).to.equal('warning');
    });

    it('does not show a toast when an index was already FAILED', function () {
      const previousIndex = mockSearchIndex({
        name: 'myIndex',
        status: 'FAILED',
      });
      const newIndex = mockSearchIndex({ name: 'myIndex', status: 'FAILED' });

      showIndexStatusChangeToasts(
        [previousIndex],
        [newIndex],
        undefined,
        NAMESPACE
      );

      expect(openToastStub).not.to.have.been.called;
    });

    it('shows a "build failed" toast for a new index that appears already FAILED', function () {
      const newIndex = mockSearchIndex({ name: 'myIndex', status: 'FAILED' });

      showIndexStatusChangeToasts([], [newIndex], undefined, NAMESPACE);

      expect(openToastStub).to.have.been.calledOnce;
      expect(openToastStub.firstCall.args[1].variant).to.equal('warning');
    });
  });

  describe('READY status', function () {
    it('shows a "build complete" toast when an index transitions to READY', function () {
      const previousIndex = mockSearchIndex({
        name: 'myIndex',
        status: 'BUILDING',
      });
      const newIndex = mockSearchIndex({ name: 'myIndex', status: 'READY' });

      showIndexStatusChangeToasts(
        [previousIndex],
        [newIndex],
        undefined,
        NAMESPACE
      );

      expect(openToastStub).to.have.been.calledOnce;
      expect(openToastStub.firstCall.args[0]).to.equal(
        'search-index-build-success-myIndex'
      );
      expect(openToastStub.firstCall.args[1].variant).to.equal('success');
      expect(openToastStub.firstCall.args[1].description).to.include('myIndex');
    });

    it('does not show a toast when an index was already READY', function () {
      const previousIndex = mockSearchIndex({
        name: 'myIndex',
        status: 'READY',
      });
      const newIndex = mockSearchIndex({ name: 'myIndex', status: 'READY' });

      showIndexStatusChangeToasts(
        [previousIndex],
        [newIndex],
        undefined,
        NAMESPACE
      );

      expect(openToastStub).not.to.have.been.called;
    });

    it('uses "vector search index" label in success description for vectorSearch type', function () {
      const previousIndex = mockSearchIndex({
        name: 'vecIdx',
        status: 'BUILDING',
        type: 'vectorSearch',
      });
      const newIndex = mockSearchIndex({
        name: 'vecIdx',
        status: 'READY',
        type: 'vectorSearch',
      });

      showIndexStatusChangeToasts(
        [previousIndex],
        [newIndex],
        undefined,
        NAMESPACE
      );

      expect(openToastStub.firstCall.args[1].description).to.include(
        'vector search index'
      );
    });
  });

  describe('atlasMetadata link in FAILED toast', function () {
    it('does not include a link when atlasMetadata is undefined', function () {
      const previousIndex = mockSearchIndex({
        name: 'myIndex',
        status: 'BUILDING',
      });
      const newIndex = mockSearchIndex({ name: 'myIndex', status: 'FAILED' });

      showIndexStatusChangeToasts(
        [previousIndex],
        [newIndex],
        undefined,
        NAMESPACE
      );

      // description is a React element; the Link child should be null when no atlasMetadata
      const description = openToastStub.firstCall.args[1].description;
      const children = description.props.children;
      expect(children).to.include(null);
    });

    it('includes a link when atlasMetadata is provided', function () {
      const previousIndex = mockSearchIndex({
        name: 'myIndex',
        status: 'BUILDING',
      });
      const newIndex = mockSearchIndex({ name: 'myIndex', status: 'FAILED' });

      showIndexStatusChangeToasts(
        [previousIndex],
        [newIndex],
        ATLAS_METADATA,
        NAMESPACE
      );

      const description = openToastStub.firstCall.args[1].description;
      const children = description.props.children;
      const linkChild = children.find(
        (c: any) => c !== null && typeof c === 'object'
      );
      expect(linkChild).to.exist;
      expect(linkChild.props.href).to.include('MyCluster');
    });
  });

  describe('multiple indexes', function () {
    it('fires a toast for each index that changed status', function () {
      const previousIndexes = [
        mockSearchIndex({ name: 'idx1', status: 'BUILDING' }),
        mockSearchIndex({ name: 'idx2', status: 'BUILDING' }),
      ];
      const newIndexes = [
        mockSearchIndex({ name: 'idx1', status: 'READY' }),
        mockSearchIndex({ name: 'idx2', status: 'FAILED' }),
      ];

      showIndexStatusChangeToasts(
        previousIndexes,
        newIndexes,
        undefined,
        NAMESPACE
      );

      expect(openToastStub).to.have.been.calledTwice;
      expect(openToastStub.firstCall.args[0]).to.equal(
        'search-index-build-success-idx1'
      );
      expect(openToastStub.secondCall.args[0]).to.equal(
        'search-index-build-failed-idx2'
      );
    });

    it('does not fire toasts for indexes with no status change', function () {
      const previousIndexes = [
        mockSearchIndex({ name: 'idx1', status: 'READY' }),
        mockSearchIndex({ name: 'idx2', status: 'BUILDING' }),
      ];
      const newIndexes = [
        mockSearchIndex({ name: 'idx1', status: 'READY' }),
        mockSearchIndex({ name: 'idx2', status: 'BUILDING' }),
      ];

      showIndexStatusChangeToasts(
        previousIndexes,
        newIndexes,
        undefined,
        NAMESPACE
      );

      expect(openToastStub).not.to.have.been.called;
    });
  });
});
