import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import {
  Select,
  Option,
  SelectSize,
  FormFieldContainer,
} from '@mongodb-js/compass-components';
import { css } from '@mongodb-js/compass-components';

const optionsSelectDropdownStyles = css({
  zIndex: 1,
  'button:focus, button:focus-within': {
    zIndex: 20,
  },
});

import COLLATION_OPTIONS from '../../constants/collation';

function CollationOptions(values) {
  const unifiedValues = values.map((elem) => ({
    value: typeof elem === 'object' ? elem.value : elem,
    label: typeof elem === 'object' ? elem.label : elem,
  }));
  const options = _.sortBy(unifiedValues, 'value');

  return options.map(({ value, label }) => {
    return (
      <Option key={label} value={`${value}`}>
        {label}
      </Option>
    );
  });
}

function getCollationValue(value) {
  // We convert the value to a string for the option value.
  // Here we reset it to its original type.
  if (!Object.is(+value, NaN)) {
    return +value;
  }
  if (value === 'false') {
    return false;
  }
  if (value === 'true') {
    return true;
  }

  return value;
}

/**
 * A component with collation field input optionss.
 * This is used in creating collections,
 * creating databases, and creating indexes.
 *
 * @returns {React.ReactNode} The rendered component.
 */
function CollationFields({ collation, changeCollationOption }) {
  return COLLATION_OPTIONS.map((element) => {
    return (
      <FormFieldContainer key={element.field}>
        <Select
          id={`collation-field-${element.field}`}
          className={optionsSelectDropdownStyles}
          label={element.field}
          name={element.field}
          placeholder={`Select a value${element.required ? '' : ' [optional]'}`}
          onChange={(val) =>
            changeCollationOption(element.field, getCollationValue(val))
          }
          usePortal={false}
          size={SelectSize.Small}
          allowDeselect={false}
          value={
            _.isNil(collation[element.field])
              ? ''
              : String(collation[element.field])
          }
        >
          {CollationOptions(element.values)}
        </Select>
      </FormFieldContainer>
    );
  });
}

CollationFields.propTypes = {
  collation: PropTypes.object.isRequired,
  changeCollationOption: PropTypes.func.isRequired,
};

export default CollationFields;
