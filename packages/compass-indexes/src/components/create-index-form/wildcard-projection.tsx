import React from 'react';
import {
  Editor,
  EditorVariant,
  CollapsibleFieldSet,
} from '@mongodb-js/compass-components';

type WildcardProjection = {
  hasWildcardProjection: boolean;
  toggleHasWildcardProjection: (hasWildcardProjection: boolean) => any;
  wildcardProjection?: string;
  wildcardProjectionChanged: (wildcardProjection: string) => any;
};

const WildcardProjectionCollapsibleFieldSet = ({
  hasWildcardProjection,
  toggleHasWildcardProjection,
  wildcardProjection,
  wildcardProjectionChanged,
}: WildcardProjection) => {
  return (
    <CollapsibleFieldSet
      toggled={hasWildcardProjection}
      onToggle={(checked: boolean) => toggleHasWildcardProjection(checked)}
      label="Wildcard Projection"
      dataTestId="create-index-modal-has-wildcard-checkbox"
      description="Wildcard indexes support queries against unknown or arbitrary fields."
    >
      <Editor
        text={wildcardProjection}
        variant={EditorVariant.Shell}
        onChangeText={wildcardProjectionChanged}
        options={{ minLines: 10 }}
        name="create-index-modal-has-wildcard-editor"
      />
    </CollapsibleFieldSet>
  );
};

export default WildcardProjectionCollapsibleFieldSet;
