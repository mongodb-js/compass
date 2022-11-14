import React from 'react';

import { IconButton, Icon } from '@mongodb-js/compass-components';
import { Query } from '../query/query';
import type { QueryAttributes } from '../query/query';

type FavoriteModel = {
  _lastExecuted: {
    toString: () => string;
  };
  _name: string;
  getAttributes: (arg0: { props: true }) => QueryAttributes;
};

type FavoriteListItemProps = {
  model: FavoriteModel;
  actions: {
    copyQuery: (model: FavoriteModel) => void;
    deleteFavorite: (model: FavoriteModel) => void;
    runQuery: (attributes: QueryAttributes) => void;
  };
};

export default function FavoriteListItem({
  model,
  actions,
}: FavoriteListItemProps) {
  const copyQuery = () => {
    actions.copyQuery(model);
  };

  const deleteFavorite = () => {
    actions.deleteFavorite(model);
  };

  const attributes = model.getAttributes({ props: true });

  Object.keys(attributes)
    .filter((key) => key.charAt(0) === '_')
    .forEach((key) => delete attributes[key]);

  const runQuery = () => {
    actions.runQuery(attributes);
  };

  return (
    <Query
      title={model._name}
      attributes={attributes}
      runQuery={runQuery}
      data-testid="favorite-query-list-item"
    >
      <IconButton
        data-testid="query-history-button-copy-query"
        aria-label="Copy Query to Clipboard"
        title="Copy Query to Clipboard"
        onClick={copyQuery}
      >
        <Icon glyph="Copy" />
      </IconButton>
      <IconButton
        data-testid="query-history-button-delete-fav"
        aria-label="Delete Query from Favorites List"
        title="Delete Query from Favorites List"
        onClick={deleteFavorite}
      >
        <Icon glyph="Trash" />
      </IconButton>
    </Query>
  );
}
