import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  FormFieldContainer,
  Select,
  Option,
  TextInput,
  useTranslation,
} from '@mongodb-js/compass-components';
import { css, CollapsibleFieldSet } from '@mongodb-js/compass-components';

const optionsSelectDropdownStyles = css({
  zIndex: 1,
  'button:focus, button:focus-within': {
    zIndex: 20,
  },
});

const HELP_URL_TIME_FIELD =
  'https://www.mongodb.com/docs/manual/core/timeseries-collections/';

const GRANULARITY_OPTIONS = ['seconds', 'minutes', 'hours'];

function TimeSeriesFields({
  isTimeSeries,
  isClustered,
  isFLE2,
  onChangeIsTimeSeries,
  onChangeField,
  timeSeries,
  expireAfterSeconds,
  supportsFlexibleBucketConfiguration,
}) {
  const t = useTranslation();
  const {
    granularity,
    metaField,
    timeField,
    bucketMaxSpanSeconds,
    bucketRoundingSeconds,
  } = timeSeries;

  const onInputChange = useCallback(
    (e) => {
      const { name, value } = e.currentTarget;
      onChangeField(name, value);
    },
    [onChangeField]
  );

  return (
    <CollapsibleFieldSet
      disabled={isClustered || isFLE2}
      onToggle={(checked) => onChangeIsTimeSeries(checked)}
      toggled={isTimeSeries}
      label={t('databasesCollections.fields.timeSeries', 'Time-Series')}
      data-testid="time-series-fields"
      helpUrl={HELP_URL_TIME_FIELD}
      description={t(
        'databasesCollections.fields.timeSeriesDescription',
        'Time-series collections efficiently store sequences of measurements over a period of time.'
      )}
    >
      <FormFieldContainer>
        <TextInput
          value={timeField}
          label="timeField"
          name="timeSeries.timeField"
          description={t(
            'databasesCollections.fields.timeFieldDescription',
            'Specify which field should be used as timeField for the time-series collection. This field must have a BSON type date.'
          )}
          required
          onChange={onInputChange}
          spellCheck={false}
        />
      </FormFieldContainer>

      <FormFieldContainer>
        <TextInput
          label="metaField"
          name="timeSeries.metaField"
          description={t(
            'databasesCollections.fields.metaFieldDescription',
            'The metaField is the designated field for metadata.'
          )}
          optional
          value={metaField}
          onChange={onInputChange}
          spellCheck={false}
        />
      </FormFieldContainer>

      <FormFieldContainer>
        <Select
          id="timeSeries-granularity"
          className={optionsSelectDropdownStyles}
          label="granularity"
          name="timeSeries.granularity"
          placeholder={t(
            'databasesCollections.fields.selectValueOptional',
            'Select a value [optional]'
          )}
          description={t(
            'databasesCollections.fields.granularityDescription',
            'The granularity field allows specifying a coarser granularity so measurements over a longer time span can be more efficiently stored and queried.'
          )}
          onChange={(val) => onChangeField('timeSeries.granularity', val)}
          allowDeselect={true}
          value={granularity}
          disabled={!!(bucketMaxSpanSeconds || bucketRoundingSeconds)}
        >
          {GRANULARITY_OPTIONS.map((granularityOption) => (
            <Option key={granularityOption} value={granularityOption}>
              {granularityOption}
            </Option>
          ))}
        </Select>
      </FormFieldContainer>

      {supportsFlexibleBucketConfiguration && (
        <>
          <FormFieldContainer>
            <TextInput
              value={bucketMaxSpanSeconds}
              label="bucketMaxSpanSeconds"
              name="timeSeries.bucketMaxSpanSeconds"
              description={t(
                'databasesCollections.fields.bucketMaxSpanDescription',
                'The maximum time span between measurements in a bucket.'
              )}
              optional
              type="number"
              onChange={onInputChange}
              spellCheck={false}
              disabled={!!granularity}
            />
          </FormFieldContainer>

          <FormFieldContainer>
            <TextInput
              value={bucketRoundingSeconds}
              label="bucketRoundingSeconds"
              name="timeSeries.bucketRoundingSeconds"
              description={t(
                'databasesCollections.fields.bucketRoundingDescription',
                'The time interval that determines the starting timestamp for a new bucket.'
              )}
              optional
              type="number"
              onChange={onInputChange}
              spellCheck={false}
              disabled={!!granularity}
            />
          </FormFieldContainer>
        </>
      )}

      <FormFieldContainer>
        <TextInput
          value={expireAfterSeconds}
          label="expireAfterSeconds"
          name="expireAfterSeconds"
          description={t(
            'databasesCollections.fields.timeSeriesExpireAfterSeconds',
            'The expireAfterSeconds field enables automatic deletion of documents older than the specified number of seconds.'
          )}
          optional
          type="number"
          onChange={onInputChange}
          spellCheck={false}
        />
      </FormFieldContainer>
    </CollapsibleFieldSet>
  );
}

TimeSeriesFields.propTypes = {
  isTimeSeries: PropTypes.bool.isRequired,
  isClustered: PropTypes.bool.isRequired,
  isFLE2: PropTypes.bool.isRequired,
  onChangeIsTimeSeries: PropTypes.func.isRequired,
  onChangeField: PropTypes.func.isRequired,
  timeSeries: PropTypes.object.isRequired,
  expireAfterSeconds: PropTypes.string.isRequired,
  supportsFlexibleBucketConfiguration: PropTypes.bool.isRequired,
};

export default TimeSeriesFields;
