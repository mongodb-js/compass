import React, { useCallback } from 'react';
import { connect } from '../stores/context';
import {
  Icon,
  InteractivePopover,
  css,
  focusRing,
  spacing,
} from '@mongodb-js/compass-components';

import QueryHistory from './query-history';
import {
  useTrackOnChange,
  type TrackFunction,
} from '@mongodb-js/compass-telemetry/provider';
import { fetchSavedQueries } from '../stores/query-bar-reducer';
import { useConnectionInfoRef } from '@mongodb-js/compass-connections/provider';

const openQueryHistoryButtonStyles = css(
  {
    border: 'none',
    backgroundColor: 'transparent',
    display: 'inline-flex',
    alignItems: 'center',
    padding: spacing[2] - 2, // -2px for border.
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
  const connectionInfoRef = useConnectionInfoRef();

  useTrackOnChange(
    (track: TrackFunction) => {
      const connectionInfo = connectionInfoRef.current;
      if (isOpen) {
        track('Query History Opened', {}, connectionInfo);
      } else {
        track('Query History Closed', {}, connectionInfo);
      }
    },
    [isOpen, connectionInfoRef],
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
    <InteractivePopover<HTMLButtonElement>
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
