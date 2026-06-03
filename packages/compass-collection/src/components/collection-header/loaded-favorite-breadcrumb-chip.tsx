import React, { useCallback, useRef, useState } from 'react';
import {
  Chip,
  Icon,
  TextInput,
  css,
  palette,
  spacing,
} from '@mongodb-js/compass-components';

import type { LoadedFavoriteInfo } from './use-loaded-favorite';

/**
 * Chip rendered next to the collection-header breadcrumbs when a
 * saved favorite is loaded in the query bar. Visually mirrors the
 * "you are here" pattern of the breadcrumb trail — but as a real
 * `<Chip>` rather than a plain text segment, because:
 *
 *   1. The favorite icon + chip styling communicates "this is the
 *      saved query identity," which a plain breadcrumb word doesn't.
 *   2. The user expects the favorite name to be editable in place
 *      (renaming a saved query without leaving the workspace). LG's
 *      `Breadcrumbs` items can't host a text input — they're either
 *      `<Link>` or `<Body>`. A standalone chip can.
 *
 * Identity-only — no navigation. Click the name to enter rename mode,
 * Enter / blur commits, Escape cancels. Empty / unchanged names are
 * treated as cancels.
 *
 * Renders nothing when `name` is null. The header's render path is
 * still cheap in that case — the hook short-circuits and this
 * component bails before any styling work.
 */

const chevronStyles = css({
  flexShrink: 0,
});

const wrapperStyles = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: spacing[100],
  // The collection-header is a `justify-content: space-between` flex
  // row with an aggressive layout (badges, signals, action buttons
  // pinned to the right via marginLeft:auto). Without an explicit
  // `flexShrink: 0` here, this chip would be the first thing the
  // browser collapses when space gets tight — and the user just
  // wouldn't see their saved-query name at all on narrower windows.
  flexShrink: 0,
});

const nameStyles = css({
  // The name is a button: clicking enters rename mode. The pointer
  // cursor (hand) advertises that — the I-beam would suggest typing,
  // which is wrong for a static label.
  cursor: 'pointer',
  borderBottom: '1px dashed transparent',
  '&:hover': {
    borderBottomColor: palette.gray.base,
  },
});

const dirtyDotStyles = css({
  display: 'inline-block',
  width: 8,
  height: 8,
  borderRadius: '50%',
  marginLeft: spacing[100],
  backgroundColor: palette.yellow.base,
});

const inputWrapperStyles = css({
  // Keep the editor close to the rendered name's size — without this,
  // LG TextInput would balloon to fill whatever flex container it
  // lands in, pushing the rest of the header around.
  minWidth: 200,
});

export type LoadedFavoriteBreadcrumbChipProps = LoadedFavoriteInfo;

export const LoadedFavoriteBreadcrumbChip: React.FunctionComponent<
  LoadedFavoriteBreadcrumbChipProps
> = ({ name, isDirty, rename }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState('');
  // Suppresses a second commit when blur fires after the user already
  // settled the edit with Enter / Escape.
  const settledRef = useRef(false);

  const startEdit = useCallback(() => {
    if (!name) return;
    setDraftName(name);
    settledRef.current = false;
    setIsEditing(true);
  }, [name]);

  const cancelEdit = useCallback(() => {
    settledRef.current = true;
    setIsEditing(false);
  }, []);

  const commitEdit = useCallback(() => {
    if (settledRef.current) return;
    settledRef.current = true;
    const trimmed = draftName.trim();
    if (!trimmed || trimmed === name || !rename) {
      setIsEditing(false);
      return;
    }
    void rename(trimmed).finally(() => setIsEditing(false));
  }, [draftName, name, rename]);

  if (!name) return null;

  return (
    <div
      className={wrapperStyles}
      data-testid="collection-header-loaded-favorite-chip"
      data-dirty={isDirty ? 'true' : 'false'}
    >
      <Icon
        glyph="ChevronRight"
        size="small"
        color={palette.gray.light1}
        className={chevronStyles}
      />
      {isEditing ? (
        <span className={inputWrapperStyles}>
          <TextInput
            aria-label="Rename saved favorite"
            sizeVariant="small"
            value={draftName}
            // Inline-edit affordance: the user just clicked the name
            // to start editing — focusing the replacement input is
            // the entire point. Without it the click does nothing
            // visible.
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            onChange={(event) => setDraftName(event.target.value)}
            onBlur={commitEdit}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                commitEdit();
              } else if (event.key === 'Escape') {
                event.preventDefault();
                cancelEdit();
              }
            }}
            data-testid="collection-header-loaded-favorite-rename-input"
          />
        </span>
      ) : (
        <Chip
          variant="blue"
          glyph={<Icon glyph="Favorite" />}
          // Default LG behavior truncates labels beyond a small
          // character limit and shows ellipses. Saved-query names
          // can be longer than that — we'd rather let the chip grow
          // a bit than mask the identity behind "Trips to s…".
          chipTruncationLocation="none"
          label={
            <span
              role="button"
              tabIndex={0}
              className={nameStyles}
              onClick={startEdit}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  startEdit();
                }
              }}
              data-testid="collection-header-loaded-favorite-name"
            >
              {name}
              {isDirty && (
                <span
                  aria-label="Unsaved changes"
                  className={dirtyDotStyles}
                  data-testid="collection-header-loaded-favorite-dirty-dot"
                />
              )}
            </span>
          }
        />
      )}
    </div>
  );
};
