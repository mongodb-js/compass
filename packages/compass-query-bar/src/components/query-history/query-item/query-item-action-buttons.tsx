import { Icon, IconButton } from '@mongodb-js/compass-components';
import React from 'react';

type ActionButtonProps = {
  onClick: () => void;
};

export const FavoriteActionButton = ({ onClick }: ActionButtonProps) => {
  return (
    <IconButton
      data-testid="query-history-button-fav"
      aria-label="Favorite Query"
      title="Favorite Query"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
    >
      <Icon glyph="Favorite" />
    </IconButton>
  );
};

export const CopyActionButton = ({ onClick }: ActionButtonProps) => {
  return (
    <IconButton
      data-testid="query-history-button-copy-query"
      aria-label="Copy Query to Clipboard"
      title="Copy Query to Clipboard"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
    >
      <Icon glyph="Copy" />
    </IconButton>
  );
};

export const DeleteActionButton = ({ onClick }: ActionButtonProps) => {
  return (
    <IconButton
      data-testid="query-history-button-delete-recent"
      aria-label="Delete Query from List"
      title="Delete Query from List"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
    >
      <Icon glyph="Trash" />
    </IconButton>
  );
};
