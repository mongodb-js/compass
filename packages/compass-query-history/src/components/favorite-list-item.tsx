import React from 'react';
import { connect } from 'react-redux';
import { IconButton, Icon } from '@mongodb-js/compass-components';

import type { RootState } from '../modules/query-history';
import { Query } from './query';
import type {
  FavoriteQueryAttributes,
  FavoriteQueryModelType,
} from '../models/favorite-query';
import { copyQueryToClipboard } from '../utils/copy-query-to-clipboard';
import { deleteFavorite, runFavoriteQuery } from '../modules/favorite-queries';

type FavoriteListItemProps = {
  model: FavoriteQueryModelType;
  deleteFavorite: (queryModel: FavoriteQueryModelType) => void;
  runFavoriteQuery: (attributes: FavoriteQueryAttributes) => void;
};

export function FavoriteListItem({
  model,
  deleteFavorite,
  runFavoriteQuery,
}: FavoriteListItemProps) {
  const attributes = model.getAttributes({ props: true });

  Object.keys(attributes)
    .filter((key) => key.charAt(0) === '_')
    .forEach((key) => delete attributes[key as keyof typeof attributes]);

  return (
    <Query
      title={model._name}
      attributes={attributes}
      runQuery={() => runFavoriteQuery(attributes)}
      data-testid="favorite-query-list-item"
    >
      <IconButton
        data-testid="query-history-button-copy-query"
        aria-label="Copy Query to Clipboard"
        title="Copy Query to Clipboard"
        onClick={() => copyQueryToClipboard(model)}
      >
        <Icon glyph="Copy" />
      </IconButton>
      <IconButton
        data-testid="query-history-button-delete-fav"
        aria-label="Delete Query from Favorites List"
        title="Delete Query from Favorites List"
        onClick={() => deleteFavorite(model)}
      >
        <Icon glyph="Trash" />
      </IconButton>
    </Query>
  );
}

export default connect(
  ({ queryHistory: { ns } }: RootState) => {
    return {
      namespace: ns,
    };
  },
  {
    deleteFavorite,
    runFavoriteQuery,
  }
)(FavoriteListItem);
