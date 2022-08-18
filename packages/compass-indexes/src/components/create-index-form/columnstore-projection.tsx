import React from 'react';
import {
  Editor,
  EditorVariant,
  CollapsibleFieldSet,
} from '@mongodb-js/compass-components';

type ColumnstoreProjection = {
  useColumnstoreProjection: boolean;
  toggleUseColumnstoreProjection: (useColumnstoreProjection: boolean) => any;
  columnstoreProjection?: string;
  columnstoreProjectionChanged: (columnstoreProjection: string) => any;
};

const ColumnstoreProjectionCollapsibleFieldSet = ({
  useColumnstoreProjection,
  toggleUseColumnstoreProjection,
  columnstoreProjection,
  columnstoreProjectionChanged,
}: ColumnstoreProjection) => {
  return (
    <CollapsibleFieldSet
      toggled={useColumnstoreProjection}
      onToggle={(checked: boolean) => toggleUseColumnstoreProjection(checked)}
      label="Columnstore Projection"
      dataTestId="create-index-modal-use-columnstore-checkbox"
      description="Columnstore indexes support queries against unknown or arbitrary fields."
    >
      <Editor
        text={columnstoreProjection}
        variant={EditorVariant.Shell}
        onChangeText={columnstoreProjectionChanged}
        options={{ minLines: 10 }}
        name="create-index-modal-use-columnstore-editor"
      />
    </CollapsibleFieldSet>
  );
};

export default ColumnstoreProjectionCollapsibleFieldSet;
