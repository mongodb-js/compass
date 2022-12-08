import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  CollapsibleFieldSet,
  TextInput,
  FormFieldContainer,
} from '@mongodb-js/compass-components';

const HELP_URL_CLUSTERED =
  'https://www.mongodb.com/docs/manual/core/clustered-collections/';

const EXPIRE_AFTER_SECONDS_DESCRIPTION =
  'The expireAfterSeconds field enables ' +
  'automatic deletion of documents older than the specified number of seconds. ' +
  'The _id field must be a date or an array that contains date values.';

function ClusteredCollectionFields({
  isCapped,
  isTimeSeries,
  isClustered,
  clusteredIndex,
  onChangeIsClustered,
  onChangeField,
  expireAfterSeconds,
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
      onToggle={(checked) => onChangeIsClustered(checked)}
      label="Clustered Collection"
      data-testid="clustered-collection-fields"
      helpUrl={HELP_URL_CLUSTERED}
      description="Clustered collections store documents ordered by a user-defined cluster key."
    >
      <FormFieldContainer>
        <TextInput
          name="clusteredIndex.name"
          value={clusteredIndex.name}
          label="name"
          data-testid="clustered-index-name"
          type="text"
          description="The clustered index name is optional, otherwise automatically generated."
          optional
          onChange={onInputChange}
          spellCheck={false}
        />
      </FormFieldContainer>

      <FormFieldContainer>
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
      </FormFieldContainer>
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
