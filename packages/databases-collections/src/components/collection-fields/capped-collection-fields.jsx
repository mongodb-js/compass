import React from 'react';
import PropTypes from 'prop-types';
import { TextInput } from '@mongodb-js/compass-components';

import CollapsibleFieldSet from '../collapsible-field-set/collapsible-field-set';
import FieldSet from '../field-set/field-set';

const HELP_URL_CAPPED = 'https://docs.mongodb.com/manual/core/capped-collections/';

function CappedCollectionFields({
  cappedSize,
  isCapped,
  isClustered,
  isTimeSeries,
  isFLE2,
  onChangeCappedSize,
  onChangeIsCapped
}) {
  return (
    <CollapsibleFieldSet
      toggled={isCapped}
      disabled={isTimeSeries || isClustered || isFLE2}
      onToggle={checked => onChangeIsCapped(checked)}
      label="Capped Collection"
      dataTestId="capped-collection-fields"
      helpUrl={HELP_URL_CAPPED}
      description="Fixed-size collections that support high-throughput operations that insert and retrieve documents based on insertion order."
    >
      <FieldSet>
        <TextInput
          value={cappedSize}
          label="size"
          data-testid="capped-size"
          type="number"
          description="Maximum size in bytes for the capped collection."
          onChange={(e) => onChangeCappedSize(e.target.value)}
          spellCheck={false}
        />
      </FieldSet>
    </CollapsibleFieldSet>
  );
}

CappedCollectionFields.propTypes = {
  cappedSize: PropTypes.string.isRequired,
  isCapped: PropTypes.bool.isRequired,
  isTimeSeries: PropTypes.bool.isRequired,
  isClustered: PropTypes.bool.isRequired,
  isFLE2: PropTypes.bool.isRequired,
  onChangeCappedSize: PropTypes.func.isRequired,
  onChangeIsCapped: PropTypes.func.isRequired
};

export default CappedCollectionFields;
