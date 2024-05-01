import { expect } from 'chai';
import React, { type ComponentProps } from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import sinon from 'sinon';
import {
  WorkspacesServiceProvider,
  type WorkspacesService,
} from '@mongodb-js/compass-workspaces/provider';
import CollectionHeaderActions from '../collection-header-actions';

function renderCollectionHeaderActions(
  props: Partial<ComponentProps<typeof CollectionHeaderActions>> = {},
  workspaceService: Partial<WorkspacesService> = {}
) {
  return render(
    <WorkspacesServiceProvider value={workspaceService as WorkspacesService}>
      <CollectionHeaderActions
        namespace="test.test"
        isReadonly={false}
        {...props}
      />
    </WorkspacesServiceProvider>
  );
}

describe('CollectionHeaderActions [Component]', function () {
  let sandbox: sinon.SinonSandbox;
  beforeEach(function () {
    sandbox = sinon.createSandbox();
  });
  this.afterEach(function () {
    sandbox.restore();
  });
  context('when the collection is not readonly', function () {
    beforeEach(function () {
      renderCollectionHeaderActions({
        isReadonly: false,
        namespace: 'db.coll2',
        sourceName: 'db.coll',
      });
    });

    afterEach(cleanup);

    it('does not render any buttons', function () {
      expect(
        screen.queryByTestId('collection-header-actions-edit-button')
      ).to.not.exist;
      expect(
        screen.queryByTestId('collection-header-actions-return-to-view-button')
      ).to.not.exist;
    });
  });

  context('when the collection is a view', function () {
    let openEditViewWorkspaceStub: sinon.SinonStub;
    beforeEach(function () {
      openEditViewWorkspaceStub = sandbox.stub();
      renderCollectionHeaderActions(
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

    afterEach(cleanup);

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
    beforeEach(function () {
      openCollectionWorkspaceStub = sandbox.stub();
      renderCollectionHeaderActions(
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

    afterEach(cleanup);

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
