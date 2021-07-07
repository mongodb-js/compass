import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import TextInput from '@leafygreen-ui/text-input';
import { Select, Option, Size as SelectSize } from '@leafygreen-ui/select';

import FieldSet from '../field-set/field-set';
import CollapsibleFieldSet from '../collapsible-field-set/collapsible-field-set';

import styles from './time-series-fields.less';

const TIME_FIELD_INPUT_DESCRIPTION = 'Specify which field should be used ' +
  'as timeField for the time-series collection. ' +
  'This field must have a BSON type date.';

const META_FIELD_INPUT_DESCRIPTION = 'The metaField is the designated field ' +
  'for metadata.';

const EXPIRE_AFTER_SECONDS_DESCRIPTION = 'The expireAfterSeconds field enables ' +
  'automatic deletion of documents older than the specified number of seconds.';

const GRANULARITY_DESCRIPTION = 'The granularity field allows specifying a ' +
  'coarser granularity so measurements over a longer time span can be ' +
  'more efficiently stored and queried.';

const GRANULARITY_OPTIONS = [
  'seconds',
  'minutes',
  'hours'
];

function TimeSeriesFields({
  isTimeSeries,
  onChangeIsTimeSeries,
  onChangeTimeSeriesField,
  timeSeries,
  expireAfterSeconds
}) {
  const {
    granularity,
    metaField,
    timeField
  } = timeSeries;

  const onInputChange = useCallback(
    (e) => {
      const { name, value } = e.currentTarget;
      onChangeTimeSeriesField(name, value);
    },
    [onChangeTimeSeriesField]
  );

  return (
    <CollapsibleFieldSet
      onToggle={checked => onChangeIsTimeSeries(checked)}
      toggled={isTimeSeries}
      label="Time-Series"
      description="Time-series collections efficiently store sequences of measurements over a period of time."
    >
      <FieldSet>
        <TextInput
          value={timeField}
          label="timeField"
          name="timeSeries.timeField"
          description={TIME_FIELD_INPUT_DESCRIPTION}
          required
          onChange={onInputChange}
        />
      </FieldSet>

      <FieldSet>
        <TextInput
          label="metaField"
          name="timeSeries.metaField"
          description={META_FIELD_INPUT_DESCRIPTION}
          optional
          value={metaField}
          onChange={onInputChange}
        />
      </FieldSet>

      <FieldSet>
        <Select
          className={styles['options-select-dropdown']}
          label="granularity"
          name="timeSeries.granularity"
          placeholder="Select a value [optional]"
          description={GRANULARITY_DESCRIPTION}
          onChange={(val) => onChangeTimeSeriesField('timeSeries.granularity', val)}
          usePortal={false}
          allowDeselect={false}
          value={granularity}
        >
          {GRANULARITY_OPTIONS.map((granularityOption) => (
            <Option
              key={granularityOption}
              value={granularityOption}
            >
              {granularityOption}
            </Option>
          ))}
        </Select>
      </FieldSet>

      <FieldSet>
        <TextInput
          value={expireAfterSeconds}
          label="expireAfterSeconds"
          name="expireAfterSeconds"
          description={EXPIRE_AFTER_SECONDS_DESCRIPTION}
          optional
          type="number"
          onChange={onInputChange}
        />
      </FieldSet>
    </CollapsibleFieldSet>
  );
}

TimeSeriesFields.propTypes = {
  isTimeSeries: PropTypes.bool.isRequired,
  onChangeIsTimeSeries: PropTypes.func.isRequired,
  onChangeTimeSeriesField: PropTypes.func.isRequired,
  timeSeries: PropTypes.object.isRequired,
  expireAfterSeconds: PropTypes.string.isRequired
};

export default TimeSeriesFields;
