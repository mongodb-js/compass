import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Body,
  Button,
  Checkbox,
  Disclaimer,
  ErrorSummary,
  Icon,
  Placeholder,
  Table,
  TableHeader,
  Row,
  Cell,
  TextInput,
  css,
  spacing,
} from '@mongodb-js/compass-components';
import { connect } from 'react-redux';

import { selectFieldsToExport, updateSelectedFields } from '../modules/export';
import type { FieldsToExport } from '../modules/export';
import type { RootExportState } from '../stores/export-store';

const headerContainerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  marginBottom: spacing[3],
  marginTop: spacing[3],
  gap: spacing[2],
});

const tableContainerStyles = css({
  maxHeight: spacing[7] * 3,
  overflow: 'auto',
});

const smallCellContainerStyle = css({
  width: spacing[5],
  margin: '0 auto',
});

const textInputStyles = css({
  padding: `${spacing[1]}px 0`,
  minWidth: spacing[7] * 3,
});

const enterToAddStyles = css({
  display: 'inline-flex',
  alignItems: 'center',
  marginLeft: spacing[2],
});

const placeholderStyles = css({
  margin: spacing[2],
});

const retryButtonContainerStyles = css({
  margin: spacing[2],
  textAlign: 'center',
});

const placeholdersCount = 6;

type ExportSelectFieldsProps = {
  isLoading: boolean;
  errorLoadingFieldsToExport?: string;
  fields: FieldsToExport;
  selectFieldsToExport: () => void; // Used to retry fetching fields when fetching the fields fails.
  updateSelectedFields: (selectedFields: FieldsToExport) => void;
};

function ExportSelectFields({
  errorLoadingFieldsToExport,
  isLoading,
  fields,
  selectFieldsToExport,
  updateSelectedFields,
}: ExportSelectFieldsProps) {
  const newFieldRef = useRef<HTMLInputElement | null>(null);

  // Track the fields length so we know when to auto-focus
  // the add field input when a new field is added.
  const lastRenderedFieldsLength = useRef(0);
  const [autoScrollNewFieldInput, setAutoScrollNewFieldInput] = useState(false);

  const fieldKeys = useMemo(() => Object.keys(fields), [fields]);

  const isEveryFieldChecked = useMemo(() => {
    return Object.keys(fields).every((f) => fields[f]);
  }, [fields]);

  const onAddNewFieldButtonClicked = useCallback(() => {
    if (newFieldRef.current) {
      newFieldRef.current.scrollIntoView();
      newFieldRef.current.focus();
    }
  }, []);

  const handleFieldCheckboxChange = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      const newFields = Object.assign({}, fields);
      newFields[`${evt.target.name}`].selected =
        !newFields[`${evt.target.name}`];
      updateSelectedFields(newFields);
    },
    [updateSelectedFields, fields]
  );

  const handleHeaderCheckboxChange = useCallback(() => {
    const newFields = Object.assign({}, fields);

    if (isEveryFieldChecked) {
      Object.keys(newFields).map((f) => (newFields[f].selected = false));
    } else {
      Object.keys(newFields).map((f) => (newFields[f].selected = true));
    }

    updateSelectedFields(newFields);
  }, [isEveryFieldChecked, updateSelectedFields, fields]);

  const handleAddFieldSubmit = useCallback(
    (evt) => {
      if (evt.key === 'Enter') {
        const obj = {
          [evt.target.value]: {
            selected: true,
            fieldPath: evt.target.value.split('.'),
          },
        };

        // Assign current entry to the end of the fields list.
        const newFields = Object.assign({}, fields, obj);

        // TODO: This forces a re-render of the whole component/table.
        // We probably want a targetted way to do that.
        updateSelectedFields(newFields);
      }
    },
    [updateSelectedFields, fields]
  );

  const loadingPlaceholderItems = useMemo(() => {
    return Array.from({ length: placeholdersCount }, (_, idx) => ({
      isLoadingPlaceholder: true,
      checked: false,
      field: `loading-placeholder-${idx}`,
      index: idx,
      component: (
        <Row>
          <Cell>
            <Placeholder
              className={placeholderStyles}
              style={{
                // Fade to transparent as we go down.
                opacity: (placeholdersCount - idx) / placeholdersCount,
              }}
              key={idx}
              minChar={30}
              maxChar={40}
            />
          </Cell>
        </Row>
      ) as JSX.Element | null,
    }));
  }, []);

  useEffect(() => {
    if (!autoScrollNewFieldInput) {
      return;
    }

    if (newFieldRef.current) {
      // Focus and scroll to the add new field input.
      newFieldRef.current.scrollIntoView();
      newFieldRef.current.focus();
    }

    setAutoScrollNewFieldInput(false);
  }, [autoScrollNewFieldInput]);

  useEffect(() => {
    if (
      lastRenderedFieldsLength.current !== 0 &&
      fieldKeys.length > lastRenderedFieldsLength.current
    ) {
      setAutoScrollNewFieldInput(true);
    }

    lastRenderedFieldsLength.current = fieldKeys.length;
  }, [fieldKeys]);

  return (
    <>
      <div className={headerContainerStyles}>
        <Body weight="medium">Select Fields</Body>
        <Body>
          The fields displayed are from a sample of documents in the collection.
          To ensure all fields are exported, add missing field names.
        </Body>
        <div>
          <Button
            variant="primary"
            leftGlyph={<Icon glyph="Plus" />}
            size="xsmall"
            disabled={isLoading}
            onClick={onAddNewFieldButtonClicked}
          >
            Add new field
          </Button>
        </div>
      </div>

      <div className={tableContainerStyles}>
        <Table
          data={
            isLoading
              ? loadingPlaceholderItems
              : fieldKeys.map((field, index) => ({
                  isLoadingPlaceholder: false,
                  component: null,
                  checked: !!fields[field],
                  field,
                  index,
                }))
          }
          columns={[
            <TableHeader
              className={smallCellContainerStyle}
              key="checkbox"
              label={
                <Checkbox
                  aria-label={
                    isEveryFieldChecked
                      ? 'Deselect all fields'
                      : 'Select all fields'
                  }
                  title={
                    isEveryFieldChecked
                      ? 'Deselect all fields'
                      : 'Select all fields'
                  }
                  checked={isEveryFieldChecked}
                  onChange={handleHeaderCheckboxChange}
                />
              }
            />,
            <TableHeader key="field-name" label="Field Name" />,
          ]}
        >
          {({ datum: field }) => (
            <>
              {field.isLoadingPlaceholder ? (
                field.component
              ) : (
                <Row>
                  <Cell className={smallCellContainerStyle}>
                    <div>
                      <Checkbox
                        title={`${field.checked ? 'Exclude' : 'Include'} ${
                          field.field
                        } in exported collection`}
                        aria-label={`${field.checked ? 'Exclude' : 'Include'} ${
                          field.field
                        } in exported collection`}
                        checked={field.checked}
                        name={field.field}
                        onChange={handleFieldCheckboxChange}
                      />
                    </div>
                  </Cell>
                  <Cell>
                    <Body>{field.field}</Body>
                  </Cell>
                </Row>
              )}
              {field.index === fieldKeys.length - 1 &&
                !field.isLoadingPlaceholder && (
                  <Row key=".__add-new-field">
                    <Cell className={smallCellContainerStyle}>
                      <div />
                    </Cell>
                    <Cell>
                      <TextInput
                        // NOTE: LeafyGreen gives an error with only aria-label for a text input.
                        // aria-labelledby=""
                        aria-label="Enter a field to include in the export"
                        type="text"
                        className={textInputStyles}
                        ref={newFieldRef}
                        placeholder="Add field"
                        onKeyDown={handleAddFieldSubmit}
                        sizeVariant="small"
                      />
                      <div className={enterToAddStyles}>
                        <Disclaimer>
                          Press &quot;Enter&quot; to add field
                        </Disclaimer>
                      </div>
                    </Cell>
                  </Row>
                )}
            </>
          )}
        </Table>
      </div>
      {!!errorLoadingFieldsToExport && (
        <div className={retryButtonContainerStyles}>
          <ErrorSummary
            errors={`Unable to load fields to export: ${errorLoadingFieldsToExport}`}
            onAction={selectFieldsToExport}
            actionText="Retry"
          />
        </div>
      )}
    </>
  );
}

const ConnectedExportSelectFields = connect(
  (state: RootExportState) => ({
    errorLoadingFieldsToExport: state.export.errorLoadingFieldsToExport,
    fields: state.export.fieldsToExport,
    isLoading: !!state.export.fieldsToExportAbortController,
  }),
  {
    selectFieldsToExport,
    updateSelectedFields: updateSelectedFields,
  }
)(ExportSelectFields);

export { ConnectedExportSelectFields as ExportSelectFields };
