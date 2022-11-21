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
  Icon,
  Table,
  TableHeader,
  Row,
  Cell,
  TextInput,
  css,
  spacing,
  Checkbox,
  Disclaimer,
} from '@mongodb-js/compass-components';

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

const checkboxContainerStyle = css({
  display: 'flex',
});

const cellContainerStyles = css({
  padding: `${spacing[1]}px ${spacing[2]}px`,
});

const inputCellContainerStyles = css(cellContainerStyles, {
  verticalAlign: 'middle',
});

const smallCellContainerStyle = css(cellContainerStyles, {
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

type ExportSelectFieldsProps = {
  fields: Record<string, boolean>;
  updateSelectedFields: (selectedFields: Record<string, boolean>) => void;
};

function ExportSelectFields({
  fields,
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
      newFields[`${evt.target.name}`] = !newFields[`${evt.target.name}`];
      updateSelectedFields(newFields);
    },
    [updateSelectedFields, fields]
  );

  const handleHeaderCheckboxChange = useCallback(() => {
    const newFields = Object.assign({}, fields);

    if (isEveryFieldChecked) {
      Object.keys(newFields).map((f) => (newFields[f] = false));
    } else {
      Object.keys(newFields).map((f) => (newFields[f] = true));
    }

    updateSelectedFields(newFields);
  }, [isEveryFieldChecked, updateSelectedFields, fields]);

  const handleAddFieldSubmit = useCallback(
    (evt) => {
      if (evt.key === 'Enter') {
        const obj = {
          [evt.target.value]: 1,
        };
        // Assign current entry to the end of the fields list.
        const newFields = Object.assign({}, fields, obj);

        updateSelectedFields(newFields);
      }
    },
    [updateSelectedFields, fields]
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
            onClick={onAddNewFieldButtonClicked}
          >
            Add new field
          </Button>
        </div>
      </div>

      <div className={tableContainerStyles}>
        <Table
          data={fieldKeys.map((field, index) => ({
            checked: !!fields[field],
            field,
            index,
          }))}
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
              <Row key={field.field}>
                <Cell className={smallCellContainerStyle}>
                  <div className={checkboxContainerStyle}>
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
                <Cell className={cellContainerStyles}>
                  <Body>{field.field}</Body>
                </Cell>
              </Row>
              {field.index === fieldKeys.length - 1 && (
                <Row key=".__add-new-field">
                  <Cell className={smallCellContainerStyle}>
                    <div />
                  </Cell>
                  <Cell className={inputCellContainerStyles}>
                    <TextInput
                      // NOTE: Leafygreen gives an error with only aria-label for a text input.
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
      </div>
    </>
  );
}

export { ExportSelectFields };
