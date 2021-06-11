import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import TextInput from '@leafygreen-ui/text-input';

import FieldSet from '../field-set/field-set';
import CollapsibleFieldSet from '../collapsible-field-set/collapsible-field-set';

const TIME_FIELD_INPUT_DESCRIPTION = 'Specify which field should be used ' +
  'as timeField for the time-series collection. ' +
  'This field must have a BSON type date.';

const META_FIELD_INPUT_DESCRIPTION = 'The metaField is the designated field ' +
  'for metadata.';

const EXPIRE_AFTER_SECONDS_DESCRIPTION = 'The expireAfterSeconds field enables ' +
  'automatic deletion of documents older than the specified number of seconds.';

function TimeSeriesFields({
  isTimeSeries,
  onChangeIsTimeSeries,
  onChangeTimeSeriesField,
  timeSeries,
  expireAfterSeconds
}) {
  const {
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
