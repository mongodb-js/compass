import { Icon, IconButton, css } from '@mongodb-js/compass-components';
import React from 'react';

type ActionButtonProps = {
  onClick?: () => void;
  visible?: boolean;
};

const VISIBLE_DISPLAY = 'inline';
const INVISIBLE_DISPLAY = 'none';

const exhaustIfInteractive =
  (onClick: (() => void) | undefined) => (event: React.MouseEvent) => {
    if (onClick) {
      event.stopPropagation();
      onClick?.();
    }
  };

export const FavoriteActionButton = ({
  onClick,
  visible,
}: ActionButtonProps) => {
  return (
    <IconButton
      className={css({
        display: visible ? VISIBLE_DISPLAY : INVISIBLE_DISPLAY,
      })}
      data-testid="query-history-button-fav"
      aria-label="Favorite Query"
      title="Favorite Query"
      onClick={exhaustIfInteractive(onClick)}
    >
      <Icon glyph="Favorite" />
    </IconButton>
  );
};

export const CopyActionButton = ({ onClick, visible }: ActionButtonProps) => {
  return (
    <IconButton
      className={css({
        display: visible ? VISIBLE_DISPLAY : INVISIBLE_DISPLAY,
      })}
      data-testid="query-history-button-copy-query"
      aria-label="Copy Query to Clipboard"
      title="Copy Query to Clipboard"
      onClick={exhaustIfInteractive(onClick)}
    >
      <Icon glyph="Copy" />
    </IconButton>
  );
};

export const DeleteActionButton = ({ onClick, visible }: ActionButtonProps) => {
  return (
    <IconButton
      className={css({
        display: visible ? VISIBLE_DISPLAY : INVISIBLE_DISPLAY,
      })}
      data-testid="query-history-button-delete-recent"
      aria-label="Delete Query from List"
      title="Delete Query from List"
      onClick={exhaustIfInteractive(onClick)}
    >
      <Icon glyph="Trash" />
    </IconButton>
  );
};

export const OpensInModal = ({ onClick, visible }: ActionButtonProps) => {
  return (
    <IconButton
      className={css({
        display: visible ? VISIBLE_DISPLAY : INVISIBLE_DISPLAY,
      })}
      data-testid="query-opens-in-modal-button"
      aria-label="Open in Modal"
      title="Open in Modal"
      onClick={exhaustIfInteractive(onClick)}
    >
      <Icon glyph="OpenNewTab" />
    </IconButton>
  );
};
