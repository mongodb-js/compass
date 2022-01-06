import React, {ChangeEvent, useEffect} from 'react';
import { css } from '@emotion/css';
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
} from '@mongodb-js/compass-components';
import ConnectionStringUrl from 'mongodb-connection-string-url';

import { editableUrlOptions, UrlOption } from '../../../utils/url-options';
import { UpdateConnectionFormField } from '../../../hooks/use-connect-form';

const optionNameCellStyles = css({
  width: '100%'
});

const optionValueCellStyles = css({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
});

const optionSelectStyles = css({
  width: '100%',
});

const optionInputStyles = css({
  width: `calc(100% - ${spacing[5]}px)`,
});

const addUrlOptionsButtonStyles = css({
  textAlign: 'center',
  marginTop: spacing[3],
  marginBottom: spacing[2],
});

function getUrlOptions(connectionStringUrl: ConnectionStringUrl): UrlOption[] {
  const urlOptions: UrlOption[] = [];
  editableUrlOptions.forEach(({ values }) => {
    values.forEach((name: string) => {
      if (connectionStringUrl.searchParams.has(name)) {
        urlOptions.push({
          name: name as UrlOption['name'],
          value: connectionStringUrl.searchParams.get(name) as string,
        });
      }
    });
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
  const [errorMessge, setErrorMessge] = React.useState('');

  useEffect(() => {
    const newOptions = getUrlOptions(connectionStringUrl);
    setOptions(newOptions);
  }, [connectionStringUrl]);

  const addUrlOption = () => {
    setErrorMessge('');
    // Use case: User clicks on `Add url option` button and then clicked again without completing existing entry.
    // Don't add another option in such case
    if (options.find(({ name }) => !name)) {
      setErrorMessge('Please complete existing option.');
      return;
    }
    const newOptions = [
      ...options,
      {name: undefined, value: undefined},
    ];
    setOptions(newOptions);
  };

  const updateUrlOption = (currentName?: UrlOption['name'], name?: UrlOption['name'], value?: string) => {
    setErrorMessge('');
    const indexOfUpdatedOption = options.findIndex((option) => option.name === currentName);
    const option = {
      name,
      value,
    };
    const newOptions = [...options];
    newOptions[indexOfUpdatedOption] = option;
    setOptions(newOptions);

    if (name && value !== undefined) {
      updateConnectionFormField({
        type: 'update-search-param',
        // If the user is selecting key for the first time, currentName is undefined and we choose the selected value.
        currentKey: currentName ?? name,
        // If the keys are same, then user is changing value. So we set newKey to undefined.
        newKey: currentName === name ? undefined : name,
        value,
      });
    }
  };

  const deleteUrlOption = (name?: UrlOption['name']) => {
    setErrorMessge('');
    const indexOfDeletedOption = options.findIndex((option) => option.name === name);
    const newOptions = [...options];
    newOptions.splice(indexOfDeletedOption, 1);
    setOptions(newOptions);
    if (name) {
      handleFieldChanged(name, '');
    }
  };

  return (
    <>
      {options.length > 0 && (<Table
        data-testid="url-options-table"
        data={options}
        columns={[
          <TableHeader
            key={'name'}
            label="Key"
            style={{width: '50%'}}
          />,
          <TableHeader
            key={'value'}
            label="Value"
            style={{width: '50%'}}
          />,
        ]}
      >
        {({ datum }: { datum: Partial<UrlOption> }) => (
          <Row key={datum.name}>
            <Cell>
              <div className={optionNameCellStyles}>
                <Select
                  placeholder="Select key"
                  name="name"
                  aria-labelledby="Select key"
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
                  className={optionSelectStyles}
                >
                  {editableUrlOptions.map(({ title, values }) => (
                    <OptionGroup key={title} label={title}>
                      {values.map((value) => (
                        <Option key={value} value={value}>
                          {value}
                        </Option>
                      ))}
                    </OptionGroup>
                  ))}
                </Select>
              </div>
            </Cell>
            <Cell>
              <div className={optionValueCellStyles}>
                <TextInput
                  className={optionInputStyles}
                  onChange={((event: ChangeEvent<HTMLInputElement>) => {
                    event.preventDefault();
                    updateUrlOption(
                      datum.name,
                      datum.name,
                      event.target.value
                    );
                  })}
                  spellCheck={false}
                  type={'text'}
                  placeholder={'Value'}
                  aria-labelledby="Enter value"
                  value={datum.value}
                />
                <IconButton
                  aria-label={`Delete option: ${datum.name ?? ''}`}
                  onClick={() => deleteUrlOption(datum.name)}
                >
                  <Icon glyph="Trash" />
                </IconButton>
              </div>
            </Cell>
          </Row>
        )}
      </Table>)}
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
      {errorMessge && <Banner variant={'warning'} dismissible={true} onClose={() => setErrorMessge('')}>{errorMessge}</Banner>}
    </>
  );
}

export default UrlOptionsTable;
