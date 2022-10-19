import type { ChangeEvent } from 'react';
import React, { useCallback, useEffect } from 'react';
import {
  TextInput,
  Select,
  Option,
  OptionGroup,
  css,
  spacing,
  ListEditor,
} from '@mongodb-js/compass-components';
import type ConnectionStringUrl from 'mongodb-connection-string-url';
import type { MongoClientOptions } from 'mongodb';

import type { UrlOption } from '../../../utils/url-options';
import { editableUrlOptions } from '../../../utils/url-options';
import type { UpdateConnectionFormField } from '../../../hooks/use-connect-form';

const optionInputContainerStyles = css({
  display: 'flex',
  gap: spacing[2],
  alignItems: 'center',
});

const optionSelectStyles = css({
  display: 'inline-block',
  flexGrow: 1,
});

const valueInputStyles = css({
  display: 'inline-block',
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

function UrlOptionsListEditor({
  updateConnectionFormField,
  connectionStringUrl,
}: {
  updateConnectionFormField: UpdateConnectionFormField;
  connectionStringUrl: ConnectionStringUrl;
}): React.ReactElement {
  const [options, setOptions] = React.useState<Partial<UrlOption>[]>([]);
  useEffect(() => {
    const newOptions = appendEmptyOption(getUrlOptions(connectionStringUrl));
    setOptions(newOptions);
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

  const onRemoveUrlOption = useCallback(
    (index: number) => {
      const optionName = options[index].name;

      if (!optionName) {
        return;
      }

      const newOptions = [...options];
      newOptions.splice(index - 1, 1);

      updateConnectionFormField({
        type: 'delete-search-param',
        key: optionName,
      });
    },
    [options, updateConnectionFormField]
  );

  return (
    <ListEditor
      items={options}
      renderItem={(uriOption: Partial<UrlOption>, index: number) => (
        <div
          className={optionInputContainerStyles}
          data-testid={`url-option-entry-${index}`}
        >
          <Select
            id="select-key"
            className={optionSelectStyles}
            placeholder="Select key"
            name="select-url-options-key-name"
            aria-labelledby={
              uriOption.name ? `${uriOption.name} select` : 'new option select'
            }
            onChange={(name, event): void => {
              event.preventDefault();
              updateUrlOption(
                uriOption.name,
                name as UrlOption['name'],
                uriOption.value
              );
            }}
            allowDeselect={false}
            value={uriOption.name ?? ''}
          >
            {editableUrlOptions.map(({ title, values }) => (
              <OptionGroup key={title} label={title}>
                {values.map((value) => (
                  <Option
                    key={value}
                    value={value}
                    // Disable if this option already exists in the search params.
                    disabled={
                      connectionStringUrl.searchParams.has(value) &&
                      uriOption.name !== value
                    }
                  >
                    {value}
                  </Option>
                ))}
              </OptionGroup>
            ))}
          </Select>
          <TextInput
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              event.preventDefault();
              updateUrlOption(
                uriOption.name,
                uriOption.name,
                event.target.value
              );
            }}
            data-testid={
              uriOption.name
                ? `${uriOption.name}-input-field`
                : 'new-option-input-field'
            }
            spellCheck={false}
            type={'text'}
            placeholder={'Value'}
            aria-labelledby="Enter value"
            value={uriOption.value}
            className={valueInputStyles}
          />
        </div>
      )}
      // As this state is dependent on the connection string parameters, we always show an
      // extra, unnamed/empty url option for users to use.
      disableAddButton={() => true}
      onAddItem={() => {
        /* no-op - the add item button is never shown. */
      }}
      disableRemoveButton={(item: Partial<UrlOption>) => !item.name}
      onRemoveItem={onRemoveUrlOption}
      removeButtonTestId="connection-url-options-remove-button"
    />
  );
}

export default UrlOptionsListEditor;
