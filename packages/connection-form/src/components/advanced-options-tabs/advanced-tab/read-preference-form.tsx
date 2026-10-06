import type { ChangeEvent } from 'react';
import React, { useCallback, useRef } from 'react';
import {
  Description,
  FormFieldContainer,
  Label,
  Link,
  ListEditor,
  RadioBox,
  RadioBoxGroup,
  TextInput,
  css,
  spacing,
} from '@mongodb-js/compass-components';
import type ConnectionStringUrl from 'mongodb-connection-string-url';
import type { MongoClientOptions, ReadPreferenceMode } from 'mongodb';

import type { UpdateConnectionFormField } from '../../../hooks/use-connect-form';
import type { ConnectionFormError } from '../../../utils/validation';
import {
  errorMessageByFieldName,
  errorMessageByFieldNameAndIndex,
} from '../../../utils/validation';
import { supportsReadPreferenceOptions } from '../../../utils/read-preference-handler';

const defaultReadPreference = 'defaultReadPreference';

interface ReadPreference {
  title: string;
  id: ReadPreferenceMode;
}

export const readPreferences: ReadPreference[] = [
  {
    title: 'Primary',
    id: 'primary',
  },
  {
    title: 'Primary Preferred',
    id: 'primaryPreferred',
  },
  {
    title: 'Secondary',
    id: 'secondary',
  },
  {
    title: 'Secondary Preferred',
    id: 'secondaryPreferred',
  },
  {
    title: 'Nearest',
    id: 'nearest',
  },
];

const descriptionStyles = css({
  marginBottom: spacing[200],
});

const listInputStyles = css({
  maxWidth: spacing[1600] * 5,
});

const maxStalenessInputStyles = css({
  maxWidth: spacing[1600] * 3,
});

type ReadPreferenceOptions = {
  tagSets: string[];
  maxStalenessSeconds: string;
};

function ReadPreferenceForm({
  errors,
  connectionStringUrl,
  updateConnectionFormField,
}: {
  errors: ConnectionFormError[];
  connectionStringUrl: ConnectionStringUrl;
  updateConnectionFormField: UpdateConnectionFormField;
}): React.ReactElement {
  const searchParams =
    connectionStringUrl.typedSearchParams<MongoClientOptions>();
  const mode =
    (searchParams.get('readPreference') as ReadPreferenceMode | null) ??
    undefined;
  const tagSets = searchParams.getAll('readPreferenceTags');
  const maxStalenessSeconds = searchParams.get('maxStalenessSeconds') ?? '';
  const showOptions = supportsReadPreferenceOptions(mode);

  // Tag sets and max staleness can't be stored in the connection string while
  // the mode is primary or unset, so we hold on to them here to restore them
  // when the user switches back to a mode that supports them.
  const stashedOptions = useRef<ReadPreferenceOptions>({
    tagSets,
    maxStalenessSeconds,
  });

  const updateReadPreference = useCallback(
    (
      newMode: ReadPreferenceMode | undefined,
      options: ReadPreferenceOptions
    ) => {
      updateConnectionFormField({
        type: 'update-read-preference',
        mode: newMode,
        tagSets: options.tagSets,
        maxStalenessSeconds: options.maxStalenessSeconds,
      });
    },
    [updateConnectionFormField]
  );

  const onModeChange = useCallback(
    ({ target: { value } }: ChangeEvent<HTMLInputElement>) => {
      const newMode =
        value === defaultReadPreference
          ? undefined
          : (value as ReadPreferenceMode);
      if (supportsReadPreferenceOptions(mode)) {
        stashedOptions.current = { tagSets, maxStalenessSeconds };
      }
      updateReadPreference(newMode, stashedOptions.current);
    },
    [mode, tagSets, maxStalenessSeconds, updateReadPreference]
  );

  const tagSetItems = tagSets.length > 0 ? tagSets : [''];

  const updateTagSets = useCallback(
    (newTagSets: string[]) => {
      updateReadPreference(mode, {
        tagSets: newTagSets,
        maxStalenessSeconds,
      });
    },
    [mode, maxStalenessSeconds, updateReadPreference]
  );

  return (
    <>
      <FormFieldContainer>
        <Label htmlFor="read-preferences">Read Preference</Label>
        <Description className={descriptionStyles}>
          Read preference determines which members of a replica set or sharded
          cluster your reads are routed to.&nbsp;
          <Link href="https://www.mongodb.com/docs/manual/core/read-preference/">
            Learn More
          </Link>
        </Description>
        <RadioBoxGroup
          onChange={onModeChange}
          value={mode ?? defaultReadPreference}
          data-testid="read-preferences"
          id="read-preferences"
          size="compact"
        >
          <RadioBox
            id="default-preference-button"
            data-testid="default-preference-button"
            key="defaultReadPreference"
            value={defaultReadPreference}
            checked={!mode}
          >
            Default
          </RadioBox>
          {readPreferences.map(({ title, id }) => {
            return (
              <RadioBox
                id={`${id}-preference-button`}
                data-testid={`${id}-preference-button`}
                checked={mode === id}
                value={id}
                key={id}
              >
                {title}
              </RadioBox>
            );
          })}
        </RadioBoxGroup>
      </FormFieldContainer>
      {showOptions && (
        <>
          <FormFieldContainer>
            <Label
              htmlFor="read-preference-tags-input-0"
              id="read-preference-tags-label"
            >
              Read Preference Tags
            </Label>
            <Description className={descriptionStyles}>
              Tag sets are tried in order until one matches a member. An empty
              tag set matches any eligible member.&nbsp;
              <Link href="https://www.mongodb.com/docs/manual/core/read-preference-tags/">
                Learn More
              </Link>
            </Description>
            <ListEditor
              items={tagSetItems}
              className={listInputStyles}
              renderItem={(tagSet: string, index: number) => {
                const errorMessage = errorMessageByFieldNameAndIndex(
                  errors,
                  'readPreferenceTags',
                  index
                );
                return (
                  <TextInput
                    type="text"
                    spellCheck={false}
                    data-testid="read-preference-tags-input"
                    id={`read-preference-tags-input-${index}`}
                    aria-labelledby="read-preference-tags-label"
                    placeholder="key0:value0,key1:value1"
                    state={errorMessage ? 'error' : undefined}
                    errorMessage={errorMessage}
                    value={tagSet}
                    onChange={({
                      target: { value },
                    }: ChangeEvent<HTMLInputElement>) => {
                      updateTagSets(
                        tagSetItems.map((item, itemIndex) =>
                          itemIndex === index ? value : item
                        )
                      );
                    }}
                  />
                );
              }}
              onAddItem={(indexBefore: number) => {
                updateTagSets([
                  ...tagSetItems.slice(0, indexBefore + 1),
                  '',
                  ...tagSetItems.slice(indexBefore + 1),
                ]);
              }}
              onRemoveItem={(index: number) => {
                updateTagSets(
                  tagSetItems.filter((_, itemIndex) => itemIndex !== index)
                );
              }}
              addButtonTestId="read-preference-tags-add-button"
              removeButtonTestId="read-preference-tags-remove-button"
            />
          </FormFieldContainer>
          <FormFieldContainer>
            <TextInput
              className={maxStalenessInputStyles}
              type="number"
              data-testid="max-staleness-seconds-input"
              label="Max Staleness Seconds"
              description="How far behind the primary a secondary can be and still be read from. Must be at least 90 seconds."
              optional={true}
              min={90}
              value={maxStalenessSeconds}
              state={
                errorMessageByFieldName(errors, 'maxStalenessSeconds')
                  ? 'error'
                  : undefined
              }
              errorMessage={errorMessageByFieldName(
                errors,
                'maxStalenessSeconds'
              )}
              onChange={({
                target: { value },
              }: ChangeEvent<HTMLInputElement>) => {
                updateReadPreference(mode, {
                  tagSets,
                  maxStalenessSeconds: value,
                });
              }}
            />
          </FormFieldContainer>
        </>
      )}
    </>
  );
}

export default ReadPreferenceForm;
