import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { TextInput } from '@mongodb-js/compass-components';

import CollapsibleFieldSet from '../collapsible-field-set/collapsible-field-set';
import FieldSet from '../field-set/field-set';

// TODO: change this link to remove v5.3 once clustered-collections is in current
const HELP_URL_CLUSTERED = 'https://www.mongodb.com/docs/v5.3/core/clustered-collections/';

const EXPIRE_AFTER_SECONDS_DESCRIPTION = 'The expireAfterSeconds field enables ' +
  'automatic deletion of documents older than the specified number of seconds. ' +
  '_id must be a date or an array that contains date values.';

function ClusteredCollectionFields({
  isCapped,
  isTimeSeries,
  isClustered,
  clusteredIndex,
  onChangeIsClustered,
  onChangeField,
  expireAfterSeconds
}) {
  const onInputChange = useCallback(
    (e) => {
      const { name, value } = e.currentTarget;
      onChangeField(name, value);
    },
    [onChangeField]
  );

  return (
    <CollapsibleFieldSet
      toggled={isClustered}
      disabled={isTimeSeries || isCapped}
      onToggle={checked => onChangeIsClustered(checked)}
      label="Clustered Collection"
      dataTestId="clustered-collection-fields"
      helpUrl={HELP_URL_CLUSTERED}
      description="Clustered collections store documents ordered by a user-defined cluster key."
    >
      <FieldSet>
        <TextInput
          name="clustered.name"
          value={clusteredIndex.name}
          label="name"
          data-testid="clustered-index-name"
          type="text"
          description="The clustered index name is optional, otherwise automatically generated."
          onChange={onInputChange}
          spellCheck={false}
        />
      </FieldSet>

      <FieldSet>
        <TextInput
          value={expireAfterSeconds}
          label="expireAfterSeconds"
          name="expireAfterSeconds"
          description={EXPIRE_AFTER_SECONDS_DESCRIPTION}
          optional
          type="number"
          onChange={onInputChange}
          spellCheck={false}
        />
      </FieldSet>
    </CollapsibleFieldSet>
  );
}

ClusteredCollectionFields.propTypes = {
  isCapped: PropTypes.bool.isRequired,
  isTimeSeries: PropTypes.bool.isRequired,
  isClustered: PropTypes.bool.isRequired,
  clusteredIndex: PropTypes.object.isRequired,
  onChangeIsClustered: PropTypes.func.isRequired,
  onChangeField: PropTypes.func.isRequired,
  expireAfterSeconds: PropTypes.string.isRequired,
};

export default ClusteredCollectionFields;
