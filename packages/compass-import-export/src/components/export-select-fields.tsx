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
  Label,
} from '@mongodb-js/compass-components';
import { connect } from 'react-redux';

import {
  selectFieldsToExport,
  toggleFieldToExport,
  addFieldToExport,
  toggleExportAllSelectedFields,
  getIdForSchemaPath,
} from '../modules/export';
import type { FieldsToExport } from '../modules/export';
import type { RootExportState } from '../stores/export-store';
import type { SchemaPath } from '../export/gather-fields';

const headerContainerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  marginBottom: spacing[3],
  marginTop: spacing[2],
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
  margin: spacing[1],
});

const retryButtonContainerStyles = css({
  margin: spacing[2],
  textAlign: 'center',
});

const addNewFieldRowStyles = css({
  marginBottom: spacing[5],
});

const loadingPlaceholderCount = 6;
const loadingPlaceholderItems = Array.from({
  length: loadingPlaceholderCount,
}).map((value, index) => index);

function LoadingTable() {
  return (
    <Table
      data={loadingPlaceholderItems}
      columns={[
        <TableHeader
          className={smallCellContainerStyle}
          key="checkbox"
          label={
            <Checkbox
              aria-label="Select all fields"
              disabled
              checked={false}
              onChange={() => {
                /* noop */
              }}
            />
          }
        />,
        <TableHeader key="field-name" label="Field Name" />,
      ]}
    >
      {({ datum: index }) => (
        <Row>
          <Cell>
            <Placeholder
              className={placeholderStyles}
              style={{
                // Fade to transparent as we go down.
                opacity:
                  (loadingPlaceholderCount - index) / loadingPlaceholderCount,
              }}
              key={index}
              minChar={30}
              maxChar={40}
            />
          </Cell>
        </Row>
      )}
    </Table>
  );
}

type ExportSelectFieldsProps = {
  isLoading: boolean;
  errorLoadingFieldsToExport?: string;
  fields: FieldsToExport;
  selectFieldsToExport: () => void; // Used to retry fetching fields when fetching the fields fails.
  addFieldToExport: (path: SchemaPath) => void;
  toggleFieldToExport: (fieldId: string, selected: boolean) => void;
  toggleExportAllSelectedFields: () => void;
};

function ExportSelectFields({
  errorLoadingFieldsToExport,
  isLoading,
  fields,
  addFieldToExport,
  selectFieldsToExport,
  toggleFieldToExport,
  toggleExportAllSelectedFields,
}: ExportSelectFieldsProps) {
  const newFieldRef = useRef<HTMLInputElement | null>(null);

  // Track the fields length so we know when to auto-focus
  // the add field input when a new field is added.
  const lastRenderedFieldsLength = useRef(0);
  const [autoScrollNewFieldInput, setAutoScrollNewFieldInput] = useState(false);

  const fieldKeys = useMemo(() => Object.keys(fields), [fields]);

  const isEveryFieldChecked = useMemo(() => {
    return Object.keys(fields).every((f) => fields[f].selected);
  }, [fields]);

  const onAddNewFieldButtonClicked = useCallback(() => {
    if (newFieldRef.current) {
      newFieldRef.current.scrollIntoView();
      newFieldRef.current.focus();
    }
  }, []);

  const handleFieldCheckboxChange = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      toggleFieldToExport(
        `${evt.target.name}`,
        !fields[`${evt.target.name}`].selected
      );
    },
    [toggleFieldToExport, fields]
  );

  const handleAddFieldSubmit = useCallback(
    (evt) => {
      if (evt.key === 'Enter') {
        addFieldToExport(evt.target.value.split('.') as SchemaPath);
      }
    },
    [addFieldToExport]
  );

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

  const fieldsToRender = useMemo(() => {
    return fieldKeys
      .filter(
        // When a key has a parent that is already checked it will
        // already be included in the projection, so we hide them.
        (fieldKey) => {
          const path: SchemaPath = [];
          for (const fieldName of fields[fieldKey].path) {
            path.push(fieldName);
            const fieldId = getIdForSchemaPath(path);
            if (fields[fieldId]?.selected && fieldId !== fieldKey) {
              return false;
            }
          }
          return true;
        }
      )
      .map((fieldKey, index) => ({
        fieldKey,
        fieldLabel: fields[fieldKey].path.join('.'),
        checked: !!fields[fieldKey].selected,
        index,
      }));
  }, [fields, fieldKeys]);

  return (
    <>
      <div className={headerContainerStyles}>
        <Body weight="medium">Select Fields</Body>
        <Body>
          The fields in the table below are from a <b>sample</b> of documents in
          the collection. Add missing fields you want to export.
        </Body>
        <div>
          <Button
            variant="primary"
            leftGlyph={<Icon glyph="Plus" />}
            data-testid="export-add-new-field-button"
            size="xsmall"
            disabled={isLoading}
            onClick={onAddNewFieldButtonClicked}
          >
            Add new field
          </Button>
        </div>
      </div>

      <div className={tableContainerStyles}>
        {isLoading ? (
          <LoadingTable />
        ) : (
          <Table
            data={fieldsToRender}
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
                    onChange={toggleExportAllSelectedFields}
                  />
                }
              />,
              <TableHeader key="field-name" label="Field Name" />,
            ]}
          >
            {({ datum: field }) => (
              <>
                <Row>
                  <Cell className={smallCellContainerStyle}>
                    <div>
                      <Checkbox
                        aria-label={`${field.checked ? 'Exclude' : 'Include'} ${
                          field.fieldLabel
                        } in exported collection`}
                        aria-labelledby={`export-field-checkbox-${field.fieldKey}-label`}
                        id={`export-field-checkbox-${field.fieldKey}`}
                        checked={field.checked}
                        name={field.fieldKey}
                        onChange={handleFieldCheckboxChange}
                      />
                    </div>
                  </Cell>
                  <Cell>
                    <Label
                      htmlFor={`export-field-checkbox-${field.fieldKey}`}
                      id={`export-field-checkbox-${field.fieldKey}-label`}
                    >
                      {field.fieldLabel}
                    </Label>
                  </Cell>
                </Row>
                {field.index === fieldsToRender.length - 1 && (
                  <Row className={addNewFieldRowStyles} key=".__add-new-field">
                    <Cell className={smallCellContainerStyle}>
                      <div />
                    </Cell>
                    <Cell>
                      <TextInput
                        // NOTE: LeafyGreen gives an error with only aria-label for a text input.
                        aria-labelledby=""
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
        )}
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
    addFieldToExport,
    toggleFieldToExport,
    toggleExportAllSelectedFields,
  }
)(ExportSelectFields);

export {
  ConnectedExportSelectFields as ExportSelectFields,
  ExportSelectFields as UnconnectedExportSelectFields,
};
