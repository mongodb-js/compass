import React, { useMemo, useState } from 'react';
import {
  Body,
  Label,
  TextInput,
  css,
  palette,
  spacing,
} from '@mongodb-js/compass-components';
import { useAutocompleteFields } from '@mongodb-js/compass-field-store';
import { DraggableField } from './draggable-field';

const sidebarStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[200],
  minWidth: '220px',
  maxWidth: '260px',
  flexShrink: 0,
  borderRight: `1px solid ${palette.gray.light2}`,
  paddingRight: spacing[200],
});

const listStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[100],
  maxHeight: '360px',
  overflowY: 'auto',
});

const emptyStyles = css({
  color: palette.gray.base,
  fontStyle: 'italic',
  padding: spacing[200],
});

type Props = {
  namespace: string;
  onAddField: (path: string, type: string) => void;
};

export function FieldsSidebar({ namespace, onAddField }: Props) {
  const fields = useAutocompleteFields(namespace);
  const [filter, setFilter] = useState('');

  const visible = useMemo(() => {
    const lower = filter.trim().toLowerCase();
    if (!lower) return fields;
    return fields.filter((f) => f.value.toLowerCase().includes(lower));
  }, [fields, filter]);

  return (
    <div className={sidebarStyles} data-testid="visual-query-builder-fields">
      <Label htmlFor="visual-query-builder-fields-filter">Fields</Label>
      <TextInput
        id="visual-query-builder-fields-filter"
        aria-label="Filter fields"
        placeholder="Filter fields…"
        sizeVariant="small"
        value={filter}
        onChange={(evt) => setFilter(evt.target.value)}
      />
      {fields.length === 0 ? (
        <Body className={emptyStyles}>
          No fields sampled yet. Run a query to populate the schema.
        </Body>
      ) : (
        <div className={listStyles}>
          {visible.map((field) => (
            <DraggableField
              key={field.value}
              path={field.value}
              type={field.description ?? ''}
              onDoubleClick={() =>
                onAddField(field.value, field.description ?? '')
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
