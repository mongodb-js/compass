import React from 'react';
import { expect } from 'chai';
import sinon from 'sinon';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { FavoriteQuery } from '../models';
import { FavoriteListItem } from './favorite-list-item';

describe('FavoriteListItem', function () {
  it('renders the query', function () {
    const model = new FavoriteQuery({
      filter: { foo: 'bar' },
      project: { foo: 1 },
      ns: 'db.col',
      _name: 'My Favorite',
    });

    const actions = {
      deleteFavorite: sinon.spy(),
      runQuery: sinon.spy(),
    };

    render(
      <FavoriteListItem
        model={model}
        deleteFavorite={actions.deleteFavorite}
        runFavoriteQuery={actions.runQuery}
      />
    );

    const query = screen.getByTestId('favorite-query-list-item');
    const hoverItems = screen.getByTestId('query-history-query-hoveritems');
    // const copyQuery = screen.getByTestId('query-history-button-copy-query');
    const deleteFav = screen.getByTestId('query-history-button-delete-fav');

    expect(screen.getByText('My Favorite')).to.be.displayed;
    expect(screen.queryAllByTestId('query-history-query-label')).to.have.length(
      2
    );
    expect(screen.queryAllByTestId('query-history-query-code')).to.have.length(
      2
    );

    // before hover

    expect(hoverItems).to.not.be.displayed;

    // buttons show on hover

    userEvent.hover(query);
    expect(hoverItems).to.be.displayed;

    // TODO: Copy button test.
    // userEvent.click(copyQuery);
    // expect(actions.copyQuery.calledWith(model));

    userEvent.click(query);
    expect(
      actions.runQuery.calledWith({
        filter: model.filter,
        project: model.project,
        ns: model.ns,
      })
    );

    userEvent.click(deleteFav);
    expect(actions.deleteFavorite.calledWith(model));
  });
});
