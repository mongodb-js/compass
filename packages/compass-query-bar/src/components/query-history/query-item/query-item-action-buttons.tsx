import {
  Icon,
  IconButton,
  useTranslation,
} from '@mongodb-js/compass-components';
import React from 'react';

type ActionButtonProps = {
  onClick: () => void;
};

const justDelegateClick =
  (onClick: () => void) => (event: React.MouseEvent) => {
    event.stopPropagation();
    onClick();
  };

export const FavoriteActionButton = ({ onClick }: ActionButtonProps) => {
  const t = useTranslation();
  const label = t('queryBar.history.favoriteQuery', 'Favorite Query');
  return (
    <IconButton
      data-testid="query-history-button-fav"
      aria-label={label}
      title={label}
      onClick={justDelegateClick(onClick)}
    >
      <Icon glyph="Favorite" />
    </IconButton>
  );
};

export const CopyActionButton = ({ onClick }: ActionButtonProps) => {
  const t = useTranslation();
  const label = t('queryBar.history.copyQuery', 'Copy Query to Clipboard');
  return (
    <IconButton
      data-testid="query-history-button-copy-query"
      aria-label={label}
      title={label}
      onClick={justDelegateClick(onClick)}
    >
      <Icon glyph="Copy" />
    </IconButton>
  );
};

export const DeleteActionButton = ({ onClick }: ActionButtonProps) => {
  const t = useTranslation();
  const label = t('queryBar.history.deleteQuery', 'Delete Query from List');
  return (
    <IconButton
      data-testid="query-history-button-delete-recent"
      aria-label={label}
      title={label}
      onClick={justDelegateClick(onClick)}
    >
      <Icon glyph="Trash" />
    </IconButton>
  );
};

export const OpenBulkUpdateActionButton = ({ onClick }: ActionButtonProps) => {
  const t = useTranslation();
  const label = t('queryBar.history.openInModal', 'Open in Modal');
  return (
    <IconButton
      data-testid="query-opens-in-modal-button"
      aria-label={label}
      title={label}
      onClick={justDelegateClick(onClick)}
    >
      <Icon glyph="OpenNewTab" />
    </IconButton>
  );
};
