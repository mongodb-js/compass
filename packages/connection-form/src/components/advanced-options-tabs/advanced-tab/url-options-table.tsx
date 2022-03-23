import type { ChangeEvent } from 'react';
import React, { useEffect } from 'react';
import {
  Table,
  TableHeader,
  Row,
  Cell,
  IconButton,
  Icon,
  TextInput,
  Select,
  Option,
  OptionGroup,
  css,
  spacing,
} from '@mongodb-js/compass-components';
import type ConnectionStringUrl from 'mongodb-connection-string-url';
import type { MongoClientOptions } from 'mongodb';

import type { UrlOption } from '../../../utils/url-options';
import { editableUrlOptions } from '../../../utils/url-options';
import type { UpdateConnectionFormField } from '../../../hooks/use-connect-form';

const optionSelectStyles = css({
  width: spacing[5] * 9,
});

const optionNameCellStyles = css({
  width: spacing[5] * 9,
});

const optionValueCellContentStyles = css({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'flex-start',
  alignItems: 'center',
});

const valueInputStyles = css({
  width: spacing[7],
});

const deleteOptionButtonStyle = css({
  marginLeft: spacing[2],
});

function appendEmptyOption(
  urlOptions: Partial<UrlOption>[]
): Partial<UrlOption>[] {
  if (!urlOptions.length || urlOptions[urlOptions.length - 1].name) {
    return [...urlOptions, { name: undefined, value: undefined }];
  }

  return urlOptions;
}

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
  useEffect(() => {
    const options = appendEmptyOption(getUrlOptions(connectionStringUrl));
    setOptions(options);
  }, [connectionStringUrl]);

  const updateUrlOption = (
    currentName?: UrlOption['name'],
    name?: UrlOption['name'],
    value?: string
  ) => {
    const indexOfUpdatedOption = options.findIndex(
      (option) => option.name === currentName
    );
    const option = {
      name,
      value,
    };
    const newOptions = [...options];
    newOptions[indexOfUpdatedOption] = option;

    setOptions(appendEmptyOption(newOptions));

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
    if (!name) {
      return;
    }

    const indexOfDeletedOption = options.findIndex(
      (option) => option.name === name
    );
    const newOptions = [...options];
    newOptions.splice(indexOfDeletedOption, 1);

    setOptions(appendEmptyOption(newOptions));

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
            <Cell className={optionNameCellStyles}>
              <Select
                id="select-key"
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
              <div className={optionValueCellContentStyles}>
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
                  className={valueInputStyles}
                />
                {datum.name ? (
                  <IconButton
                    data-testid={
                      datum.name
                        ? `${datum.name}-delete-button`
                        : 'new-option-delete-button'
                    }
                    aria-label={`Delete option: ${datum.name ?? ''}`}
                    onClick={() => deleteUrlOption(datum.name)}
                    className={deleteOptionButtonStyle}
                    type="button"
                  >
                    <Icon glyph="X" />
                  </IconButton>
                ) : (
                  ''
                )}
              </div>
            </Cell>
          </Row>
        )}
      </Table>
    </>
  );
}

export default UrlOptionsTable;
