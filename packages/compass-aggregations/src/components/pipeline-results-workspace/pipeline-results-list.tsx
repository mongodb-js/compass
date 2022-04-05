import React, { useMemo, useState } from 'react';
import {
  css,
  SegmentedControl,
  SegmentedControlOption,
  Overline,
  Icon,
  spacing
} from '@mongodb-js/compass-components';
import { DocumentListView, DocumentJsonView } from '@mongodb-js/compass-crud';
import { useId } from '@react-aria/utils';
import HadronDocument from 'hadron-document';
import { EJSON } from 'bson';

const viewTypeContainer = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[2],
  flex: 'none',
  marginLeft: 'auto'
});

const ViewTypeSwitch: React.FunctionComponent<{
  value: 'document' | 'json';
  onChange(viewType: 'document' | 'json'): void;
}> = ({ value, onChange }) => {
  const labelId = useId();
  const controlId = useId();
  return (
    <div className={viewTypeContainer}>
      <Overline
        as="label"
        id={labelId}
        htmlFor={controlId}
        aria-label="Show documents as"
      >
        View
      </Overline>
      <SegmentedControl
        id={controlId}
        aria-labelledby={labelId}
        size="small"
        value={value}
        onChange={onChange as (newValue: string) => void}
      >
        <SegmentedControlOption aria-label="Document list" value="document">
          <Icon size="small" glyph="Menu"></Icon>
        </SegmentedControlOption>
        <SegmentedControlOption aria-label="JSON list" value="json">
          <Icon size="small" glyph="CurlyBraces"></Icon>
        </SegmentedControlOption>
      </SegmentedControl>
    </div>
  );
};

const listContainer = css({
  display: 'grid',
  flex: 1,
  gridTemplateRows: '1fr auto',
  gridTemplateColumns: '1fr'
});

const listControls = css({
  display: 'flex',
  // Unintuitive spacing to match the toolbar, if one changes, don't forget to
  // change the other
  paddingLeft: spacing[3] + spacing[1],
  paddingRight: spacing[5] + spacing[1],
  paddingBottom: spacing[3]
});

const list = css({
  flex: 1,
  overflowY: 'scroll',
  width: '100%',
  // Unintuitive spacing to match the toolbar, if one changes, don't forget to
  // change the other
  paddingLeft: spacing[1],
  paddingRight: spacing[2],
  paddingBottom: spacing[3]
});

export const PipelineResultsList: React.FunctionComponent<
  {
    documents: unknown[];
  } & React.HTMLProps<HTMLDivElement>
> = ({ documents, ...rest }) => {
  const [viewType, setViewType] = useState<'document' | 'json'>('document');

  const listProps: React.ComponentProps<typeof DocumentListView> = useMemo(
    () => ({
      docs: documents.map((doc) => new HadronDocument(doc)),
      isEditable: false,
      copyToClipboard(doc) {
        const obj = doc.generateObject();
        const str = EJSON.stringify(
          obj as EJSON.SerializableTypes,
          undefined,
          2
        );
        void navigator.clipboard.writeText(str);
      },
    }),
    [documents]
  );

  return (
    <div {...rest} className={listContainer}>
      <div className={listControls}>
        <ViewTypeSwitch
          value={viewType}
          onChange={setViewType}
        ></ViewTypeSwitch>
      </div>
      <div className={list}>
        {viewType === 'document' ? (
          <DocumentListView {...listProps}></DocumentListView>
        ) : (
          <DocumentJsonView {...listProps}></DocumentJsonView>
        )}
      </div>
    </div>
  );
};
