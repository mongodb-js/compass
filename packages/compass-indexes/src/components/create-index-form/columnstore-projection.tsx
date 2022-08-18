import React from 'react';
import {
  Editor,
  EditorVariant,
  CollapsibleFieldSet,
} from '@mongodb-js/compass-components';

type ColumnstoreProjection = {
  hasColumnstoreProjection: boolean;
  toggleHasColumnstoreProjection: (hasColumnstoreProjection: boolean) => any;
  columnstoreProjection?: string;
  columnstoreProjectionChanged: (columnstoreProjection: string) => any;
};

const ColumnstoreProjectionCollapsibleFieldSet = ({
  hasColumnstoreProjection,
  toggleHasColumnstoreProjection,
  columnstoreProjection,
  columnstoreProjectionChanged,
}: ColumnstoreProjection) => {
  return (
    <CollapsibleFieldSet
      toggled={hasColumnstoreProjection}
      onToggle={(checked: boolean) => toggleHasColumnstoreProjection(checked)}
      label="Columnstore Projection"
      dataTestId="create-index-modal-has-columnstore-checkbox"
      description="Columnstore indexes support queries against unknown or arbitrary fields."
    >
      <Editor
        text={columnstoreProjection}
        variant={EditorVariant.Shell}
        onChangeText={columnstoreProjectionChanged}
        options={{ minLines: 10 }}
        name="create-index-modal-has-columnstore-editor"
      />
    </CollapsibleFieldSet>
  );
};

export default ColumnstoreProjectionCollapsibleFieldSet;
