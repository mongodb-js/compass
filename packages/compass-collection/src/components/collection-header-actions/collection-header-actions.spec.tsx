import { expect } from 'chai';
import React, { type ComponentProps } from 'react';
import {
  renderWithActiveConnection,
  screen,
} from '@mongodb-js/testing-library-compass';
import sinon from 'sinon';
import {
  WorkspacesServiceProvider,
  type WorkspacesService,
} from '@mongodb-js/compass-workspaces/provider';
import type { ConnectionInfo } from '@mongodb-js/compass-connections/provider';

import CollectionHeaderActions from '../collection-header-actions';

describe('CollectionHeaderActions [Component]', function () {
  afterEach(function () {
    sinon.restore();
  });

  const renderCollectionHeaderActions = (
    props: Partial<ComponentProps<typeof CollectionHeaderActions>> = {},
    workspaceService: Partial<WorkspacesService> = {},
    connectionInfo?: ConnectionInfo,
    preferences?: Record<string, boolean>
  ) => {
    return renderWithActiveConnection(
      <WorkspacesServiceProvider value={workspaceService as WorkspacesService}>
        <CollectionHeaderActions
          namespace="test.test"
          isReadonly={false}
          {...props}
        />
      </WorkspacesServiceProvider>,
      connectionInfo,
      { preferences }
    );
  };

  context('when the collection is not readonly', function () {
    beforeEach(async function () {
      await renderCollectionHeaderActions({
        isReadonly: false,
        namespace: 'db.coll2',
        sourceName: 'db.coll',
      });
    });

    it('does not render any buttons', function () {
      expect(
        screen.queryByTestId('collection-header-actions-edit-button')
      ).to.not.exist;
      expect(
        screen.queryByTestId('collection-header-actions-return-to-view-button')
      ).to.not.exist;
    });
  });

  context('Compass readonly mode', function () {
    it('does not render edit view buttons when in ReadWrite mode', async function () {
      await renderCollectionHeaderActions(
        {
          isReadonly: true,
          namespace: 'db.coll2',
          sourceName: 'db.someSource',
          sourcePipeline: [{ $match: { a: 1 } }],
        },
        undefined,
        undefined,
        { readWrite: true }
      );

      expect(
        screen.queryByTestId('collection-header-actions-edit-button')
      ).to.not.exist;
      expect(
        screen.queryByTestId('collection-header-actions-return-to-view-button')
      ).to.not.exist;
    });

    it('renders edit view buttons when not in readonly mode', async function () {
      await renderCollectionHeaderActions({
        isReadonly: true,
        namespace: 'db.coll2',
        sourceName: 'db.someSource',
        sourcePipeline: [{ $match: { a: 1 } }],
      });

      expect(
        screen.getByTestId('collection-header-actions-edit-button')
      ).to.be.visible;
    });
  });

  context('when the collection is a view', function () {
    let openEditViewWorkspaceStub: sinon.SinonStub;
    beforeEach(async function () {
      openEditViewWorkspaceStub = sinon.stub();
      await renderCollectionHeaderActions(
        {
          isReadonly: true,
          namespace: 'db.coll2',
          sourceName: 'db.someSource',
          sourcePipeline: [{ $match: { a: 1 } }],
        },
        {
          openEditViewWorkspace: openEditViewWorkspaceStub,
        }
      );
    });

    it('shows a button to edit the view pipeline', function () {
      expect(
        screen.getByTestId('collection-header-actions-edit-button')
      ).to.exist;
    });
    it('calls openEditViewWorkspace when the edit button is clicked', function () {
      expect(openEditViewWorkspaceStub).to.not.have.been.called;
      const button = screen.getByTestId(
        'collection-header-actions-edit-button'
      );
      button.click();
      expect(openEditViewWorkspaceStub).to.have.been.calledOnceWith(
        'TEST',
        'db.coll2',
        {
          sourceName: 'db.someSource',
          sourcePipeline: [{ $match: { a: 1 } }],
        }
      );
    });
  });

  context('when the collection is editing a view', function () {
    let openCollectionWorkspaceStub: sinon.SinonStub;
    beforeEach(async function () {
      openCollectionWorkspaceStub = sinon.stub();
      await renderCollectionHeaderActions(
        {
          isReadonly: false,
          namespace: 'db.coll2',
          editViewName: 'db.editing',
        },
        {
          openCollectionWorkspace: openCollectionWorkspaceStub,
        }
      );
    });
    it('shows a button to return to the view', function () {
      expect(
        screen.getByTestId('collection-header-actions-return-to-view-button')
      ).to.exist;
    });
    it('calls openCollectionWorkspace when the return to view button is clicked', function () {
      expect(openCollectionWorkspaceStub).to.not.have.been.called;
      const button = screen.getByTestId(
        'collection-header-actions-return-to-view-button'
      );
      button.click();
      expect(openCollectionWorkspaceStub).to.have.been.calledOnceWith(
        'TEST',
        'db.editing'
      );
    });
  });
});
