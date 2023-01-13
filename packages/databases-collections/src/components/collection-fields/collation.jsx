import React from 'react';
import PropTypes from 'prop-types';

import { CollapsibleFieldSet } from '@mongodb-js/compass-components';

import CollationFields from '../collation-fields/collation-fields';

const HELP_URL_COLLATION =
  'https://docs.mongodb.com/master/reference/collation/';

/**
 * The collation component. This is used in creating collections,
 * creating databases, and creating indexes.
 *
 * @returns {React.ReactNode} The rendered component.
 */
function Collation({
  collation,
  isCustomCollation,
  onChangeCollationOption,
  onChangeIsCustomCollation,
}) {
  return (
    <CollapsibleFieldSet
      onToggle={(checked) => {
        onChangeIsCustomCollation(checked);
      }}
      label="Use Custom Collation"
      data-testid="use-custom-collation-fields"
      toggled={isCustomCollation}
      description="Collation allows users to specify language-specific rules for string comparison, such as rules for lettercase and accent marks."
      helpUrl={HELP_URL_COLLATION}
    >
      <CollationFields
        collation={collation}
        changeCollationOption={onChangeCollationOption}
      />
    </CollapsibleFieldSet>
  );
}

Collation.propTypes = {
  collation: PropTypes.object.isRequired,
  isCustomCollation: PropTypes.bool.isRequired,
  onChangeCollationOption: PropTypes.func.isRequired,
  onChangeIsCustomCollation: PropTypes.func.isRequired,
};

export default Collation;
