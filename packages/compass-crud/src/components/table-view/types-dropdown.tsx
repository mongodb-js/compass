import React, { useCallback } from 'react';
import type { TypeCastMap } from 'hadron-type-checker';
import TypeChecker from 'hadron-type-checker';
import {
  Select,
  Option,
  css,
  spacing,
  cx,
} from '@mongodb-js/compass-components';
import type { Element } from 'hadron-document';

const castableTypes = TypeChecker.castableTypes(true);
const selectStyles = css({ minWidth: spacing[3] * 10 });

type TypesDropdownProps = { element: Element };

const TypesDropdown: React.FunctionComponent<TypesDropdownProps> = ({
  element,
}) => {
  const handleTypeChange = useCallback(
    (newType: string) => {
      element.changeType(newType as keyof TypeCastMap);
    },
    [element]
  );

  return (
    <Select
      size="xsmall"
      placeholder={'placeholder'}
      onChange={handleTypeChange}
      allowDeselect={false}
      value={element.currentType}
      readOnly={false}
      // NOTE: Leafygreen doesn't support aria-label and only understand "aria-labelledby" and "label" instead
      aria-labelledby=""
      aria-label="Field type"
      className={cx(selectStyles, 'table-view-cell-editor-types')}
      data-testid="table-view-types-dropdown-select"
    >
      {castableTypes.map((type) => (
        <Option
          key={type}
          value={`${type}`}
          data-testid={`editable-element-type-${type}`}
        >
          {type}
        </Option>
      ))}
    </Select>
  );
};

TypesDropdown.displayName = 'TypesDropdown';

export default TypesDropdown;
