import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import {
  Icon,
  InteractivePopover,
  css,
  focusRing,
  spacing,
} from '@mongodb-js/compass-components';
import { useTrackOnChange } from '@mongodb-js/compass-logging/provider';

import QueryHistory from './query-history';
import { fetchSavedQueries } from '../stores/query-bar-reducer';

const openQueryHistoryButtonStyles = css(
  {
    border: 'none',
    backgroundColor: 'transparent',
    display: 'inline-flex',
    alignItems: 'center',
    padding: spacing[2] - 2, // -2px for border.
    marginLeft: spacing[1],
    '&:hover': {
      cursor: 'pointer',
    },
  },
  focusRing
);

const queryHistoryPopoverStyles = css({
  // We want the popover to open almost to the shell at the bottom of Compass.
  maxHeight: 'calc(100vh - 270px)',
  marginTop: spacing[1],
  display: 'flex',
});

const QueryHistoryButtonPopover = ({
  onOpenPopover,
}: {
  onOpenPopover: () => void;
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  useTrackOnChange(
    'COMPASS-QUERY-BAR-UI',
    (track) => {
      if (isOpen) {
        track('Query History Opened');
      } else {
        track('Query History Closed');
      }
    },
    [isOpen],
    undefined
  );

  const setOpen = useCallback(
    (newValue: boolean) => {
      if (newValue) {
        onOpenPopover();
      }
      setIsOpen(newValue);
    },
    [onOpenPopover]
  );

  const closePopover = useCallback(() => {
    setIsOpen(false);
  }, [setIsOpen]);

  return (
    <InteractivePopover
      className={queryHistoryPopoverStyles}
      trigger={({ onClick, ref, children }) => (
        <>
          <button
            data-testid="query-history-button"
            onClick={onClick}
            className={openQueryHistoryButtonStyles}
            aria-label="Open query history"
            aria-haspopup="true"
            title="Query History"
            tabIndex={0}
            aria-expanded={isOpen ? true : undefined}
            type="button"
            ref={ref}
          >
            <Icon glyph="Clock" />
            <Icon glyph="CaretDown" />
          </button>
          {children}
        </>
      )}
      open={isOpen}
      setOpen={setOpen}
    >
      <QueryHistory
        onUpdateRecentChoosen={closePopover}
        onUpdateFavoriteChoosen={closePopover}
      />
    </InteractivePopover>
  );
};

export default connect(null, {
  onOpenPopover: fetchSavedQueries,
})(QueryHistoryButtonPopover);
