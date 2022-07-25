import { expect } from 'chai';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';

import CollectionHeaderActions from '../collection-header-actions';

describe('CollectionHeaderActions [Component]', function () {
  context('when the collection is not readonly', function () {
    beforeEach(function () {
      render(
        <CollectionHeaderActions
          isReadonly={false}
          onEditViewClicked={() => {}}
          onReturnToViewClicked={() => {}}
          sourceName="db.coll"
        />
      );
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

  context('when the collection is readonly', function () {
    beforeEach(function () {
      render(
        <CollectionHeaderActions
          isReadonly={true}
          onEditViewClicked={() => {}}
          onReturnToViewClicked={() => {}}
          sourceName="orig.coll"
        />
      );
    });

    afterEach(cleanup);

    it('renders the source collection', function () {
      const label = screen.getByTestId('collection-view-on');
      expect(label).to.have.text('view on: orig.coll');
      expect(label).to.be.visible;
    });
  });

  context('when the collection is readonly but not a view', function () {
    beforeEach(function () {
      render(
        <CollectionHeaderActions
          isReadonly={true}
          onEditViewClicked={() => {}}
          onReturnToViewClicked={() => {}}
        />
      );
    });

    afterEach(cleanup);

    it('does not render view information', function () {
      expect(screen.queryByTestId('collection-badge-view')).to.not.exist;
    });
  });

  context('when the collection is a view', function () {
    beforeEach(function () {
      render(
        <CollectionHeaderActions
          isReadonly={true}
          onEditViewClicked={() => {}}
          onReturnToViewClicked={() => {}}
          sourceName="db.someSource"
        />
      );
    });

    afterEach(cleanup);

    it('shows a button to edit the view pipeline', function () {
      expect(
        screen.getByTestId('collection-header-actions-edit-button')
      ).to.exist;
    });
  });

  context('when the collection is editing a view', function () {
    beforeEach(function () {
      render(
        <CollectionHeaderActions
          isReadonly={false}
          onEditViewClicked={() => {}}
          onReturnToViewClicked={() => {}}
          editViewName="db.editing"
        />
      );
    });

    afterEach(cleanup);

    it('shows a button to return to the view', function () {
      expect(
        screen.getByTestId('collection-header-actions-return-to-view-button')
      ).to.exist;
    });
  });
});
