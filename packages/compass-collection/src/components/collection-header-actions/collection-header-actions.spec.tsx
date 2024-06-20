import { expect } from 'chai';
import React, { type ComponentProps } from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import sinon from 'sinon';
import {
  WorkspacesServiceProvider,
  type WorkspacesService,
} from '@mongodb-js/compass-workspaces/provider';
import type { PreferencesAccess } from 'compass-preferences-model';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';
import { PreferencesProvider } from 'compass-preferences-model/provider';

import CollectionHeaderActions from '../collection-header-actions';

describe('CollectionHeaderActions [Component]', function () {
  let preferences: PreferencesAccess;
  beforeEach(async function () {
    preferences = await createSandboxFromDefaultPreferences();
  });
  afterEach(function () {
    sinon.restore();
  });

  const renderCollectionHeaderActions = (
    props: Partial<ComponentProps<typeof CollectionHeaderActions>> = {},
    workspaceService: Partial<WorkspacesService> = {}
  ) => {
    return render(
      <WorkspacesServiceProvider value={workspaceService as WorkspacesService}>
        <PreferencesProvider value={preferences}>
          <CollectionHeaderActions
            namespace="test.test"
            isReadonly={false}
            {...props}
          />
        </PreferencesProvider>
      </WorkspacesServiceProvider>
    );
  };

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

  context('Compass readonly mode', function () {
    it('does not render edit view buttons when in readonly mode', async function () {
      await preferences.savePreferences({ readOnly: true });

      renderCollectionHeaderActions({
        isReadonly: true,
        namespace: 'db.coll2',
        sourceName: 'db.someSource',
        sourcePipeline: [{ $match: { a: 1 } }],
      });

      expect(
        screen.queryByTestId('collection-header-actions-edit-button')
      ).to.not.exist;
      expect(
        screen.queryByTestId('collection-header-actions-return-to-view-button')
      ).to.not.exist;
    });

    it('renders edit view buttons when not in readonly mode', function () {
      renderCollectionHeaderActions({
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
    beforeEach(function () {
      openEditViewWorkspaceStub = sinon.stub();
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
      openCollectionWorkspaceStub = sinon.stub();
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
