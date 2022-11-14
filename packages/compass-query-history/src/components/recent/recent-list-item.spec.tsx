import React from 'react';
import { expect } from 'chai';
import sinon from 'sinon';

import { RecentQuery } from '../../models';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import RecentListItem from './recent-list-item';

describe('RecentListItem', function () {
  it('renders the query', function () {
    const model = new RecentQuery({
      _lastExecuted: new Date('2022-11-10'),
      filter: { foo: 'bar' },
      project: { foo: 1 },
      ns: 'db.col',
    });

    const actions = {
      copyQuery: sinon.spy(),
      deleteRecent: sinon.spy(),
      runQuery: sinon.spy(),
      saveFavorite: sinon.spy(),
      showFavorites: sinon.spy(),
    };

    render(<RecentListItem model={model} actions={actions} />);

    const query = screen.getByTestId('recent-query-list-item');
    const hoverItems = screen.getByTestId('query-history-query-hoveritems');
    const copyQuery = screen.getByTestId('query-history-button-copy-query');
    const deleteQuery = screen.getByTestId(
      'query-history-button-delete-recent'
    );

    expect(screen.getByTestId('query-history-query-title')).to.be.displayed;
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

    userEvent.click(deleteQuery);
    expect(actions.deleteRecent.calledWith(model));

    // open the Save form and cancel

    userEvent.click(screen.getByTestId('query-history-button-fav'));
    expect(screen.queryByTestId('query-history-query-title')).to.not.exist;
    userEvent.click(screen.getByTestId('recent-query-save-favorite-cancel'));
    expect(screen.queryByTestId('query-history-query-title')).to.be.displayed;

    // open it again and save

    userEvent.click(screen.getByTestId('query-history-button-fav'));
    const nameField = screen.getByTestId('recent-query-save-favorite-name');
    userEvent.type(nameField, 'My Favorite');
    userEvent.click(screen.getByTestId('recent-query-save-favorite-submit'));
    expect(actions.saveFavorite.calledWith(model, 'My Favorite'));
  });
});
