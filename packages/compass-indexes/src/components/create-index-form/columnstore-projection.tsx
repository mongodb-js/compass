import React from 'react';
import { CollapsibleFieldSet } from '@mongodb-js/compass-components';
import { Editor, EditorVariant } from '@mongodb-js/compass-editor';

type ColumnstoreProjection = {
  useColumnstoreProjection: boolean;
  toggleUseColumnstoreProjection: (useColumnstoreProjection: boolean) => void;
  columnstoreProjection?: string;
  columnstoreProjectionChanged: (columnstoreProjection: string) => void;
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
      onToggle={toggleUseColumnstoreProjection}
      label="Columnstore Projection"
      data-testid="create-index-modal-use-columnstore"
      description="Columnstore indexes support queries against unknown or arbitrary fields."
    >
      <Editor
        text={columnstoreProjection}
        data-testid="create-index-modal-use-columnstore-editor"
        variant={EditorVariant.Shell}
        onChangeText={columnstoreProjectionChanged}
        options={{ minLines: 10 }}
        name="create-index-modal-use-columnstore-editor"
      />
    </CollapsibleFieldSet>
  );
};

export default ColumnstoreProjectionCollapsibleFieldSet;
