import React from 'react';
import PropTypes from 'prop-types';
import TextInput from '@leafygreen-ui/text-input';

import CollapsibleFieldSet from '../collapsible-field-set/collapsible-field-set';

const HELP_URL_CAPPED = 'https://docs.mongodb.com/manual/core/capped-collections/';

function CappedCollectionFields({
  isCapped,
  onChangeCappedSize,
  onChangeIsCapped,
  openLink
}) {
  return (
    <CollapsibleFieldSet
      toggled={isCapped}
      onToggle={checked => onChangeIsCapped(checked)}
      label="Capped Collection"
      helpUrl={HELP_URL_CAPPED}
      openLink={openLink}
      description="Fixed-size collections that support high-throughput operations that insert and retrieve documents based on insertion order."
    >
      <TextInput
        label="size"
        type="number"
        description="Maximum size in bytes for the capped collection."
        onChange={(e) => onChangeCappedSize(e.target.value)}
      />
    </CollapsibleFieldSet>
  );
}

CappedCollectionFields.propTypes = {
  isCapped: PropTypes.bool.isRequired,
  onChangeCappedSize: PropTypes.func.isRequired,
  onChangeIsCapped: PropTypes.func.isRequired,
  openLink: PropTypes.func.isRequired
};

export default CappedCollectionFields;
