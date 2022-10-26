import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import TypeChecker from 'hadron-type-checker';
import {Select, Option, css, spacing} from '@mongodb-js/compass-components';

const CASTABLE_TYPES = TypeChecker.castableTypes(true);

const selectStyles = css({ minWidth: spacing[3] * 10 });

const TypesDropdown = ({ element }) => {
  const handleTypeChange = useCallback((newType) => {
    element.changeType(newType);
  }, [element]);

  return (
    <Select
    size='xsmall'
    placeholder={'placeholder'}
    onChange={handleTypeChange}
    allowDeselect={false}
    value={element.currentType}
    aria-label="Field type"
    className={selectStyles}
  >
    {CASTABLE_TYPES.map((type) => (<Option key={type} value={`${type}`}>{type}</Option>))}
  </Select>
  );
}

TypesDropdown.displayName = 'TypesDropdown';

TypesDropdown.propTypes = {
  element: PropTypes.object.isRequired,
};

export default TypesDropdown;
