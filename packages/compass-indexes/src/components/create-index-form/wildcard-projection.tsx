import React from 'react';
import {
  Editor,
  EditorVariant,
  CollapsibleFieldSet,
} from '@mongodb-js/compass-components';

type WildcardProjection = {
  useWildcardProjection: boolean;
  toggleUseWildcardProjection: (useWildcardProjection: boolean) => any;
  wildcardProjection?: string;
  wildcardProjectionChanged: (wildcardProjection: string) => any;
};

const WildcardProjectionCollapsibleFieldSet = ({
  useWildcardProjection,
  toggleUseWildcardProjection,
  wildcardProjection,
  wildcardProjectionChanged,
}: WildcardProjection) => {
  return (
    <CollapsibleFieldSet
      toggled={useWildcardProjection}
      onToggle={(checked: boolean) => toggleUseWildcardProjection(checked)}
      label="Wildcard Projection"
      dataTestId="create-index-modal-use-wildcard-checkbox"
      description="Wildcard indexes support queries against unknown or arbitrary fields."
    >
      <Editor
        text={wildcardProjection}
        variant={EditorVariant.Shell}
        onChangeText={wildcardProjectionChanged}
        options={{ minLines: 10 }}
        name="create-index-modal-use-wildcard-editor"
      />
    </CollapsibleFieldSet>
  );
};

export default WildcardProjectionCollapsibleFieldSet;
