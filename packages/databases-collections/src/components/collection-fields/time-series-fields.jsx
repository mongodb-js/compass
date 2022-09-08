import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { Select, Option, TextInput } from '@mongodb-js/compass-components';
import { css } from '@mongodb-js/compass-components';

import FieldSet from '../field-set/field-set';
import CollapsibleFieldSet from '../collapsible-field-set/collapsible-field-set';

const optionsSelectDropdownStyles = css({
  zIndex: 1,
  'button:focus, button:focus-within': {
    zIndex: 20
  }
});

const TIME_FIELD_INPUT_DESCRIPTION = 'Specify which field should be used ' +
  'as timeField for the time-series collection. ' +
  'This field must have a BSON type date.';

const HELP_URL_TIME_FIELD = 'https://www.mongodb.com/docs/manual/core/timeseries-collections/';

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
  isCapped,
  isTimeSeries,
  isClustered,
  isFLE2,
  onChangeIsTimeSeries,
  onChangeField,
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
      onChangeField(name, value);
    },
    [onChangeField]
  );

  return (
    <CollapsibleFieldSet
      disabled={isCapped || isClustered || isFLE2}
      onToggle={checked => onChangeIsTimeSeries(checked)}
      toggled={isTimeSeries}
      label="Time-Series"
      dataTestId="time-series-fields"
      helpUrl={HELP_URL_TIME_FIELD}
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
          spellCheck={false}
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
          spellCheck={false}
        />
      </FieldSet>

      <FieldSet>
        <Select
          id="timeSeries-granularity"
          className={optionsSelectDropdownStyles}
          label="granularity"
          name="timeSeries.granularity"
          placeholder="Select a value [optional]"
          description={GRANULARITY_DESCRIPTION}
          onChange={(val) => onChangeField('timeSeries.granularity', val)}
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
          spellCheck={false}
        />
      </FieldSet>
    </CollapsibleFieldSet>
  );
}

TimeSeriesFields.propTypes = {
  isCapped: PropTypes.bool.isRequired,
  isTimeSeries: PropTypes.bool.isRequired,
  isClustered: PropTypes.bool.isRequired,
  isFLE2: PropTypes.bool.isRequired,
  onChangeIsTimeSeries: PropTypes.func.isRequired,
  onChangeField: PropTypes.func.isRequired,
  timeSeries: PropTypes.object.isRequired,
  expireAfterSeconds: PropTypes.string.isRequired
};

export default TimeSeriesFields;
