import React, { useCallback, useState } from 'react';
import {
  Accordion,
  Body,
  Button,
  Checkbox,
  ComboboxOption,
  ComboboxWithCustomOption,
  css,
  cx,
  InlineInfoLink,
  Label,
  Link,
  Radio,
  RadioGroup,
  spacing,
  SpinLoader,
  Subtitle,
  TextInput,
} from '@mongodb-js/compass-components';
import {
  createShardKey,
  type RootState,
  type CreateShardKeyData,
} from '../store/reducer';
import { useAutocompleteFields } from '@mongodb-js/compass-field-store';
import { connect } from 'react-redux';
import { containerStyles } from './common-styles';

const listStyles = css({
  listStyle: 'disc',
  paddingLeft: 'auto',
  marginTop: 0,
});

const shardKeyFormFieldsStyles = css({
  display: 'flex',
  flexDirection: 'row',
  gap: spacing[400],
});

const secondShardKeyStyles = css({
  width: '300px',
});

const hasedIndexOptionsStyles = css({
  marginLeft: spacing[1200], // This aligns it with the radio button text
  marginTop: spacing[400],
});

const advanceOptionsGroupStyles = css({
  paddingLeft: spacing[500], // Avoid visual cutoff
});

const chunksInputStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[100],
});

const nbsp = '\u00a0';

type ShardingAdvancedOption = 'default' | 'unique-index' | 'hashed-index';

function CreateShardKeyDescription() {
  return (
    <div className={containerStyles} data-testid="unsharded-text-description">
      <Subtitle>Configure compound shard key</Subtitle>
      <Body>
        To properly configure Global Writes, your collections must be sharded
        using a compound shard key made up of a ‘location’ field and a second
        field of your choosing.
      </Body>

      <Body>
        All documents in your collection should contain both the ‘location’
        field and your chosen second field.
      </Body>

      <ul className={listStyles}>
        <li>
          <Body>
            The second field should represent a well-distributed and immutable
            value to ensure that data is equally distributed across shards in a
            particular zone.{nbsp}
            <strong>
              Note that the value of this field cannot be an array.
            </strong>
            {nbsp}
            For more information, read our documentation on{' '}
            <Link
              hideExternalIcon
              href="https://www.mongodb.com/docs/manual/core/sharding-shard-key/#choosing-a-shard-key"
            >
              selecting a shard key
            </Link>
            .
          </Body>
        </li>
      </ul>

      <Body weight="medium">
        Once you shard your collection, it cannot be unsharded.
      </Body>
    </div>
  );
}

export type CreateShardKeyFormProps = {
  namespace: string;
  isSubmittingForSharding: boolean;
  isCancellingSharding: boolean;
  onCreateShardKey: (data: CreateShardKeyData) => void;
};

export function CreateShardKeyForm({
  namespace,
  isSubmittingForSharding,
  isCancellingSharding,
  onCreateShardKey,
}: CreateShardKeyFormProps) {
  const [isAdvancedOptionsOpen, setIsAdvancedOptionsOpen] = useState(false);
  const [selectedAdvancedOption, setSelectedAdvancedOption] =
    useState<ShardingAdvancedOption>('default');
  const fields = useAutocompleteFields(namespace);

  const [secondShardKey, setSecondShardKey] = useState<string | null>(null);
  const [numInitialChunks, setNumInitialChunks] = useState<
    string | undefined
  >();
  const [isPreSplitData, setIsPreSplitData] = useState(false);

  const onSubmit = useCallback(() => {
    if (!secondShardKey) {
      return;
    }
    const isCustomShardKeyHashed = selectedAdvancedOption === 'hashed-index';
    const presplitHashedZones = isCustomShardKeyHashed && isPreSplitData;

    const data: CreateShardKeyData = {
      customShardKey: secondShardKey,
      isShardKeyUnique: selectedAdvancedOption === 'unique-index',
      isCustomShardKeyHashed,
      presplitHashedZones,
      numInitialChunks:
        presplitHashedZones && numInitialChunks
          ? Number(numInitialChunks)
          : null,
    };

    onCreateShardKey(data);
  }, [
    isPreSplitData,
    numInitialChunks,
    secondShardKey,
    selectedAdvancedOption,
    onCreateShardKey,
  ]);

  return (
    <>
      <CreateShardKeyDescription />
      <div className={containerStyles} data-testid="shard-collection-form">
        <div className={shardKeyFormFieldsStyles}>
          <div>
            <Label htmlFor="first-shard-key">
              First shard key field
              <InlineInfoLink
                aria-label="Connection String Documentation"
                data-testid="connectionStringDocsButton"
                href="https://docs.mongodb.com/manual/core/sharding-shard-key"
              />
            </Label>
            <TextInput
              id="first-shard-key"
              aria-labelledby="First shard key field"
              placeholder="location"
              disabled
            />
          </div>
          <div>
            <Label htmlFor="second-shard-key">
              Second shard key field
              <InlineInfoLink
                aria-label="Connection String Documentation"
                data-testid="connectionStringDocsButton"
                href="https://docs.mongodb.com/manual/core/zone-sharding/#shard-key"
              />
            </Label>
            <ComboboxWithCustomOption
              id="second-shard-key"
              data-testid="second-shard-key"
              aria-label="Second shard key field"
              placeholder="Second shard key field"
              size="default"
              clearable={false}
              overflow="scroll-x"
              onChange={setSecondShardKey}
              options={fields.map(({ value }) => ({ value }))}
              className={secondShardKeyStyles}
              value={secondShardKey}
              searchEmptyMessage="No fields found. Please enter a valid field name."
              renderOption={(option, index, isCustom) => {
                return (
                  <ComboboxOption
                    key={`field-option-${index}`}
                    value={option.value}
                    displayName={
                      isCustom ? `Field: "${option.value}"` : option.value
                    }
                  />
                );
              }}
            />
          </div>
        </div>
        <Accordion
          data-testid="advanced-shard-key-configuration"
          text="Advanced Shard Key Configuration"
          open={isAdvancedOptionsOpen}
          setOpen={setIsAdvancedOptionsOpen}
          className={css({ paddingLeft: spacing[400] })}
        >
          <RadioGroup
            className={advanceOptionsGroupStyles}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setSelectedAdvancedOption(
                event.target.value as ShardingAdvancedOption
              );
            }}
          >
            <Radio
              value="default"
              checked={selectedAdvancedOption === 'default'}
            >
              Default
            </Radio>
            <Radio
              id="unique-index"
              data-testid="unique-index"
              value="unique-index"
              checked={selectedAdvancedOption === 'unique-index'}
            >
              <div>
                <Label htmlFor="unique-index">
                  Use unique index as the shard key
                </Label>
                <Body>
                  Enforce a uniqueness constraint on the shard key of this
                  Global Collection.{' '}
                  <Link href="https://docs.atlas.mongodb.com/data-explorer/global-writes/#optional-expand-advanced-shard-key-configuration-section-to-specify-how-to-shard-the-collection">
                    Learn more
                  </Link>
                </Body>
              </div>
            </Radio>
            <Radio
              id="hashed-index"
              data-testid="hashed-index"
              value="hashed-index"
              checked={selectedAdvancedOption === 'hashed-index'}
            >
              <div>
                <Label htmlFor="hashed-index">
                  Use hashed index as the shard key
                </Label>
                <Body>
                  Improve even distribution of the sharded data by hashing the
                  second field of the shard key.{' '}
                  <Link href="https://docs.atlas.mongodb.com/data-explorer/global-writes/#optional-expand-advanced-shard-key-configuration-section-to-specify-how-to-shard-the-collection">
                    Learn more
                  </Link>
                </Body>
              </div>
            </Radio>
          </RadioGroup>
          {selectedAdvancedOption === 'hashed-index' && (
            <div className={cx(containerStyles, hasedIndexOptionsStyles)}>
              <Checkbox
                data-testid="presplit-data-checkbox"
                onChange={() => setIsPreSplitData(!isPreSplitData)}
                label="Pre-split data for even distribution."
                checked={isPreSplitData}
              />
              <div className={chunksInputStyles}>
                <TextInput
                  data-testid="chunks-per-shard-input"
                  id="chunks-per-shard"
                  aria-labelledby="Chunks per shard"
                  disabled={!isPreSplitData}
                  type="number"
                  placeholder="Chunks"
                  min={0}
                  value={numInitialChunks}
                  onChange={(event) => setNumInitialChunks(event.target.value)}
                />
                <Body>chunks per shard.</Body>
              </div>
            </div>
          )}
        </Accordion>
        <div>
          <Button
            data-testid="shard-collection-button"
            onClick={onSubmit}
            disabled={
              !secondShardKey || isSubmittingForSharding || isCancellingSharding
            }
            variant="primary"
            isLoading={isSubmittingForSharding}
            loadingIndicator={<SpinLoader />}
          >
            Shard Collection
          </Button>
        </div>
      </div>
    </>
  );
}

export default connect(
  (state: RootState) => ({
    namespace: state.namespace,
    isSubmittingForSharding: state.userActionInProgress === 'submitForSharding',
    isCancellingSharding: state.userActionInProgress === 'cancelSharding',
  }),
  {
    onCreateShardKey: createShardKey,
  }
)(CreateShardKeyForm);
