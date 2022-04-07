import React from 'react';
import PropTypes from 'prop-types';
import { TextInput } from '@mongodb-js/compass-components';

import CollapsibleFieldSet from '../collapsible-field-set/collapsible-field-set';
import FieldSet from '../field-set/field-set';

const HELP_URL_CLUSTERED = 'https://www.mongodb.com/docs/v5.3/core/clustered-collections/';

function ClusteredCollectionFields({
  isCapped,
  isTimeSeries,
  isClustered,
  clusteredIndex,
  onChangeIsClustered,
  onChangeClusteredIndex,
  openLink
}) {
  return (
    <CollapsibleFieldSet
      toggled={isClustered}
      disabled={isTimeSeries || isCapped}
      onToggle={checked => onChangeIsClustered(checked)}
      label="Clustered Collection"
      dataTestId="clustered-collection-fields"
      helpUrl={HELP_URL_CLUSTERED}
      openLink={openLink}
      description="Clustered collections store documents ordered by a user-defined cluster key."
    >
      <FieldSet>
        <TextInput
          value={clusteredIndex.key}
          label="key"
          data-testid="clustered-index-key"
          type="text"
          description="Cluster key must be { _id: 1 } for replicated collections. May be an arbitrary single-field key on completely unreplicated collections. Implicitly replicated collections must use _id if they replicate deletes."
          onChange={(e) => onChangeClusteredIndex('clusteredIndex.key', e.target.value)}
          spellCheck={false}
        />
      </FieldSet>
      <FieldSet>
        <TextInput
          value={clusteredIndex.name}
          label="name"
          data-testid="clustered-index-name"
          type="text"
          description="The clustered index name is optional, otherwise automatically generated."
          onChange={(e) => onChangeClusteredIndex('clusteredIndex.name', e.target.value)}
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
  onChangeClusteredIndex: PropTypes.func.isRequired,
  openLink: PropTypes.func.isRequired
};

export default ClusteredCollectionFields;
