import React, { ChangeEvent, useEffect, useCallback } from 'react';
import {
  spacing,
  Table,
  TableHeader,
  Row,
  Cell,
  Button,
  IconButton,
  Icon,
  TextInput,
  Select,
  Option,
  OptionGroup,
  Banner,
  css,
} from '@mongodb-js/compass-components';
import ConnectionStringUrl from 'mongodb-connection-string-url';
import type { MongoClientOptions } from 'mongodb';

import { editableUrlOptions, UrlOption } from '../../../utils/url-options';
import { UpdateConnectionFormField } from '../../../hooks/use-connect-form';

const optionSelectStyles = css({
  width: 300,
});

const optionValueCellStyles = css({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
});

const addUrlOptionsButtonStyles = css({
  textAlign: 'center',
  marginTop: spacing[3],
  marginBottom: spacing[2],
});

function getUrlOptions(connectionStringUrl: ConnectionStringUrl): UrlOption[] {
  let opts: string[] = [];
  const urlOptions: UrlOption[] = [];
  const searchParams =
    connectionStringUrl.typedSearchParams<MongoClientOptions>();

  editableUrlOptions.forEach(({ values }) => (opts = opts.concat(values)));
  searchParams.forEach((value, name) => {
    if (opts.includes(name)) {
      urlOptions.push({
        value: value,
        name: name as UrlOption['name'],
      });
    }
  });
  return urlOptions;
}

function UrlOptionsTable({
  updateConnectionFormField,
  connectionStringUrl,
}: {
  updateConnectionFormField: UpdateConnectionFormField;
  connectionStringUrl: ConnectionStringUrl;
}): React.ReactElement {
  const [options, setOptions] = React.useState<Partial<UrlOption>[]>([]);
  const [errorMessage, setErrorMessage] = React.useState('');

  // To fix UI issue that removes empty option(name -> undefined) when user
  // removes an existing option (name -> defined) [because of the state update]
  const [containsEmptyOption, setContainsEmptyOption] = React.useState(false);

  useEffect(() => {
    const options: Partial<UrlOption>[] = getUrlOptions(connectionStringUrl);
    if (!options.length || containsEmptyOption) {
      options.push({ name: undefined, value: undefined });
    }
    setOptions(options);
  }, [connectionStringUrl, containsEmptyOption]);

  const addUrlOption = useCallback(() => {
    setErrorMessage('');
    // Use case: User clicks on `Add url option` button and then clicked again without completing existing entry.
    // Don't add another option in such case
    if (options.find(({ name }) => !name)) {
      setErrorMessage('Please complete existing option.');
      return;
    }
    const newOptions = [...options, { name: undefined, value: undefined }];
    setOptions(newOptions);
    setContainsEmptyOption(true);
  }, [options]);

  const updateUrlOption = (
    currentName?: UrlOption['name'],
    name?: UrlOption['name'],
    value?: string
  ) => {
    setErrorMessage('');
    const indexOfUpdatedOption = options.findIndex(
      (option) => option.name === currentName
    );
    const option = {
      name,
      value,
    };
    const newOptions = [...options];
    newOptions[indexOfUpdatedOption] = option;
    setOptions(newOptions);

    if (name) {
      updateConnectionFormField({
        type: 'update-search-param',
        // If the user is selecting key for the first time, currentName is undefined and we choose the selected value.
        currentKey: currentName ?? name,
        // If the keys are same, then user is changing value. So we set newKey to undefined.
        newKey: currentName === name ? undefined : name,
        value: value ?? '',
      });
    }
  };

  const deleteUrlOption = (name?: UrlOption['name']) => {
    setErrorMessage('');
    const indexOfDeletedOption = options.findIndex(
      (option) => option.name === name
    );
    const newOptions = [...options];
    newOptions.splice(indexOfDeletedOption, 1);
    if (newOptions.length === 0) {
      newOptions.push({ name: undefined, value: undefined });
    }
    setOptions(newOptions);

    if (!name) {
      return;
    }

    if (newOptions.filter((x) => !x.name).length > 0) {
      setContainsEmptyOption(true);
    }

    updateConnectionFormField({
      type: 'delete-search-param',
      key: name,
    });
  };

  return (
    <>
      <Table
        data-testid="url-options-table"
        data={options}
        columns={[
          <TableHeader key={'name'} label="Key" />,
          <TableHeader key={'value'} label="Value" />,
        ]}
      >
        {({ datum }: { datum: Partial<UrlOption> }) => (
          <Row
            key={datum.name}
            data-testid={
              datum.name ? `${datum.name}-table-row` : 'new-option-table-row'
            }
          >
            <Cell>
              <Select
                className={optionSelectStyles}
                placeholder="Select key"
                name="name"
                aria-labelledby={
                  datum.name ? `${datum.name} select` : 'new option select'
                }
                onChange={(name, event): void => {
                  event.preventDefault();
                  updateUrlOption(
                    datum.name,
                    name as UrlOption['name'],
                    datum.value
                  );
                }}
                allowDeselect={false}
                value={datum.name ?? ''}
              >
                {editableUrlOptions.map(({ title, values }) => (
                  <OptionGroup key={title} label={title}>
                    {values.map((value) => (
                      <Option
                        key={value}
                        value={value}
                        // Disable if this option already exists in search params
                        disabled={
                          connectionStringUrl.searchParams.has(value) &&
                          datum.name !== value
                        }
                      >
                        {value}
                      </Option>
                    ))}
                  </OptionGroup>
                ))}
              </Select>
            </Cell>
            <Cell>
              <div className={optionValueCellStyles}>
                <TextInput
                  onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    event.preventDefault();
                    updateUrlOption(datum.name, datum.name, event.target.value);
                  }}
                  data-testid={
                    datum.name
                      ? `${datum.name}-input-field`
                      : 'new-option-input-field'
                  }
                  spellCheck={false}
                  type={'text'}
                  placeholder={'Value'}
                  aria-labelledby="Enter value"
                  value={datum.value}
                />
                <IconButton
                  data-testid={
                    datum.name
                      ? `${datum.name}-delete-button`
                      : 'new-option-delete-button'
                  }
                  aria-label={`Delete option: ${datum.name ?? ''}`}
                  onClick={() => deleteUrlOption(datum.name)}
                >
                  <Icon glyph="X" />
                </IconButton>
              </div>
            </Cell>
          </Row>
        )}
      </Table>
      <div className={addUrlOptionsButtonStyles}>
        <Button
          data-testid="add-url-options-button"
          onClick={() => addUrlOption()}
          variant={'primaryOutline'}
          size={'xsmall'}
        >
          Add url option
        </Button>
      </div>
      {errorMessage && (
        <Banner variant={'warning'} onClose={() => setErrorMessage('')}>
          {errorMessage}
        </Banner>
      )}
    </>
  );
}

export default UrlOptionsTable;
