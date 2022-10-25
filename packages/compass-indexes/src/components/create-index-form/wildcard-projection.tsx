import React from 'react';
import { CollapsibleFieldSet } from '@mongodb-js/compass-components';
import { Editor, EditorVariant } from '@mongodb-js/compass-editor';

type WildcardProjection = {
  useWildcardProjection: boolean;
  toggleUseWildcardProjection: (useWildcardProjection: boolean) => void;
  wildcardProjection?: string;
  wildcardProjectionChanged: (wildcardProjection: string) => void;
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
      onToggle={toggleUseWildcardProjection}
      label="Wildcard Projection"
      data-testid="create-index-modal-use-wildcard"
      description="Wildcard indexes support queries against unknown or arbitrary fields."
    >
      <Editor
        text={wildcardProjection}
        data-testid="create-index-modal-use-wildcard-editor"
        variant={EditorVariant.Shell}
        onChangeText={wildcardProjectionChanged}
        options={{ minLines: 10 }}
        name="create-index-modal-use-wildcard-editor"
      />
    </CollapsibleFieldSet>
  );
};

export default WildcardProjectionCollapsibleFieldSet;
