import React from 'react';
import { expect } from 'chai';
import sinon from 'sinon';

import { FavoriteQuery } from '../../models';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import FavoriteListItem from './favorite-list-item';

describe('FavoriteListItem', function () {
  it('renders the query', function () {
    const model = new FavoriteQuery({
      filter: { foo: 'bar' },
      project: { foo: 1 },
      ns: 'db.col',
      _name: 'My Favorite',
    });

    const actions = {
      copyQuery: sinon.spy(),
      deleteFavorite: sinon.spy(),
      runQuery: sinon.spy(),
    };

    render(<FavoriteListItem model={model} actions={actions} />);

    const query = screen.getByTestId('favorite-query-list-item');
    const hoverItems = screen.getByTestId('query-history-query-hoveritems');
    const copyQuery = screen.getByTestId('query-history-button-copy-query');
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

    userEvent.click(copyQuery);
    expect(actions.copyQuery.calledWith(model));

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
