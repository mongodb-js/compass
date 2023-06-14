import React, { useCallback, useMemo } from 'react';
import { isString } from 'lodash';
import { hasDistinctValue } from 'mongodb-query-util';
import {
  Body,
  css,
  cx,
  spacing,
  palette,
  useDarkMode,
} from '@mongodb-js/compass-components';
import type AppRegistry from 'hadron-app-registry';

import constants from '../constants/schema';

const { DECIMAL_128, DOUBLE, LONG, INT_32 } = constants;

const valueBubbleValueStyles = css({
  backgroundColor: palette.gray.light2,
  border: '1px solid transparent',
  color: palette.gray.dark3,
  padding: `${spacing[1] / 2} ${spacing[1]}`,
  borderRadius: spacing[1],
  '&:hover': {
    cursor: 'pointer',
  },
});

const valueBubbleDarkModeValueStyles = css({
  backgroundColor: palette.gray.dark2,
  color: palette.gray.light3,
});

const valueBubbleValueSelectedStyles = css({
  backgroundColor: palette.yellow.base,
  color: palette.gray.dark3,
});

/**
 * Converts the passed in value into a string, supports the 4 numeric
 * BSON types as well.
 */
function extractStringValue(value: any): string {
  if (value?._bsontype) {
    if ([DECIMAL_128, LONG].includes(value._bsontype)) {
      return value.toString();
    }
    if ([DOUBLE, INT_32].includes(value._bsontype)) {
      return String(value.value);
    }
  }
  if (isString(value)) {
    return value;
  }
  return String(value);
}

type ValueBubbleProps = {
  localAppRegistry: AppRegistry;
  fieldName: string;
  queryValue: any;
  value: any;
};

function ValueBubble({
  localAppRegistry,
  fieldName,
  queryValue,
  value,
}: ValueBubbleProps) {
  const darkMode = useDarkMode();

  const onBubbleClicked = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      localAppRegistry.emit('query-bar-change-filter', {
        type: e.shiftKey ? 'toggleDistinctValue' : 'setValue',
        payload: {
          field: fieldName,
          value,
          unsetIfSet: true,
        },
      });
    },
    [fieldName, localAppRegistry, value]
  );

  const extractedStringValue = useMemo(
    () => extractStringValue(value),
    [value]
  );
  const isValueInQuery: boolean = useMemo(
    () => hasDistinctValue(queryValue, value),
    [queryValue, value]
  );

  return (
    <li className="bubble">
      <Body>
        <button
          type="button"
          aria-label={`${
            isValueInQuery ? 'Remove' : 'Add'
          } ${extractedStringValue} ${isValueInQuery ? 'from' : 'to'} query`}
          className={cx(
            valueBubbleValueStyles,
            darkMode && valueBubbleDarkModeValueStyles,
            isValueInQuery && valueBubbleValueSelectedStyles
          )}
          onClick={onBubbleClicked}
        >
          {extractedStringValue}
        </button>
      </Body>
    </li>
  );
}

export { ValueBubble };
