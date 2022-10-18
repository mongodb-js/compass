import React from 'react';
import { CollapsibleFieldSet } from '@mongodb-js/compass-components';
import { Editor, EditorVariant } from '@mongodb-js/compass-editor';

type CustomCollation = {
  useCustomCollation: boolean;
  toggleUseCustomCollation: (useCustomCollation: boolean) => void;
  collationString?: string;
  collationStringChanged: (collationString: string) => void;
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
      onToggle={toggleUseCustomCollation}
      label="Use Custom Collation"
      data-testid="create-index-modal-use-custom-collation"
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
