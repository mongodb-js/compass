import React from 'react';
import {
  Editor,
  EditorVariant,
  CollapsibleFieldSet,
} from '@mongodb-js/compass-components';

type CustomCollation = {
  useCustomCollation: boolean;
  toggleUseCustomCollation: (useCustomCollation: boolean) => any;
  collationString?: string;
  collationStringChanged: (collationString: string) => any;
};

const CustomCollationCollapsibleFieldSet = ({
  useCustomCollation,
  toggleUseCustomCollation,
  collationString,
  collationStringChanged,
}: CustomCollation) => {
  return (
    <CollapsibleFieldSet
      toggled={useCustomCollation}
      onToggle={(checked: boolean) => toggleUseCustomCollation(checked)}
      label="Use Custom Collation"
      dataTestId="create-index-modal-use-custom-collation-checkbox"
      description="Collation allows users to specify language-specific rules for string comparison, such as rules for lettercase and accent marks."
    >
      <Editor
        text={collationString}
        data-testid="create-index-modal-use-custom-collation-editor"
        variant={EditorVariant.Shell}
        onChangeText={collationStringChanged}
        options={{ minLines: 10 }}
        name="create-index-modal-use-custom-collation-editor"
      />
    </CollapsibleFieldSet>
  );
};

export default CustomCollationCollapsibleFieldSet;
