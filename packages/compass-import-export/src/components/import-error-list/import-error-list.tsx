import React, { useMemo, useState, useCallback } from 'react';
import { Button, css, Icon, spacing } from '@mongodb-js/compass-components';

import ErrorBox from '../error-box';
import formatNumber from '../../utils/format-number.js';

const containerStyles = css({
  marginTop: spacing[1],
});

const errorListStyles = css({
  margin: 0,
  padding: 0,
  listStyle: 'none',
});

const errorListItemStyles = css({
  ':not(:first-child)': {
    marginTop: spacing[2],
  },
});

const showMoreErrorsButtonStyles = css({
  marginTop: spacing[2],
});

const SHOW_MORE_STEP = 10;

const DEFAULT_VISIBLE_ERRORS_COUNT = 3;

function ImportErrorList({ errors }: { errors: Error[] }) {
  const [visibleErrorsCount, setVisibleErrorsCount] = useState(
    DEFAULT_VISIBLE_ERRORS_COUNT
  );

  const normalizedErrorMessages = useMemo(() => {
    // BulkWrite and WriteErrors can have identical messages, we want to leave
    // only unique errors for display. We also reversing to show recent errors
    // higher in the list
    return [...new Set(errors.map((err) => err.message))].reverse();
  }, [errors]);

  const showMoreCount = useMemo(() => {
    return formatNumber(
      Math.min(
        SHOW_MORE_STEP,
        normalizedErrorMessages.length - visibleErrorsCount
      )
    );
  }, [normalizedErrorMessages.length, visibleErrorsCount]);
  const hasMoreErrorsToShow = useMemo(
    () => normalizedErrorMessages.length - visibleErrorsCount > 0,
    [normalizedErrorMessages.length, visibleErrorsCount]
  );

  const increaseVisibleErrorsCount = useCallback(() => {
    setVisibleErrorsCount((currCount) => currCount + SHOW_MORE_STEP);
  }, []);

  if (normalizedErrorMessages.length === 0) {
    return (
      <div className={containerStyles}>
        <ErrorBox
          dataTestId="import-error-box"
          message={normalizedErrorMessages[0]}
        />
      </div>
    );
  }

  return (
    <div className={containerStyles}>
      <ul className={errorListStyles}>
        {normalizedErrorMessages.slice(0, visibleErrorsCount).map((message) => (
          <li key={message} className={errorListItemStyles}>
            <ErrorBox dataTestId="import-error-box" message={message} />
          </li>
        ))}
      </ul>
      {hasMoreErrorsToShow && (
        <Button
          type="button"
          className={showMoreErrorsButtonStyles}
          size="xsmall"
          onClick={increaseVisibleErrorsCount}
          leftGlyph={<Icon glyph="ArrowDown" />}
        >
          Show {showMoreCount} more errors
        </Button>
      )}
    </div>
  );
}

export { ImportErrorList };
