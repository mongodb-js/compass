import React from 'react';
import {
  Editor,
  EditorVariant,
  CollapsibleFieldSet,
} from '@mongodb-js/compass-components';

type CustomCollation = {
  isCustomCollation: boolean;
  toggleIsCustomCollation: (isCustomCollation: boolean) => any;
  collationString?: string;
  collationStringChanged: (collationString: string) => any;
};

const CustomCollationCollapsibleFieldSet = ({
  isCustomCollation,
  toggleIsCustomCollation,
  collationString,
  collationStringChanged,
}: CustomCollation) => {
  return (
    <CollapsibleFieldSet
      toggled={isCustomCollation}
      onToggle={(checked: boolean) => toggleIsCustomCollation(checked)}
      label="Use Custom Collation"
      dataTestId="create-index-modal-is-custom-collation-checkbox"
      description="Collation allows users to specify language-specific rules for string comparison, such as rules for lettercase and accent marks."
    >
      <Editor
        text={collationString}
        data-testid="create-index-modal-is-custom-collation-editor"
        variant={EditorVariant.Shell}
        onChangeText={collationStringChanged}
        options={{ minLines: 10 }}
        name="create-index-modal-is-custom-collation-editor"
      />
    </CollapsibleFieldSet>
  );
};

export default CustomCollationCollapsibleFieldSet;
