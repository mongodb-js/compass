import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import TextInput from '@leafygreen-ui/text-input';

import styles from './time-series.less';

const TIME_FIELD_INPUT_DESCRIPTION = 'Specify which field should be used ' +
  'as timeField for the time-series collection. ' +
  'This field must have a BSON type date.';

const META_FIELD_INPUT_DESCRIPTION = 'The metaField is the designated field ' +
  'for metadata.';

const EXPIRE_AFTER_SECONDS_DESCRIPTION = 'The expireAfterSeconds field enables ' +
  'automatic deletion of documents older than the specified number of seconds.';

class Collation extends PureComponent {
  static displayName = 'TimeSeriesComponent';

  static propTypes = {
    timeSeries: PropTypes.object.isRequired,
    changeTimeSeriesOption: PropTypes.func.isRequired
  }

  onChangeTimeSeriesOption(field, value) {
    this.props.changeTimeSeriesOption(field, value.value);
  }

  render() {
    return (
      <div className={styles['time-series']}>
        <div className="form-group">
          <TextInput
            label="timeField"
            description={TIME_FIELD_INPUT_DESCRIPTION}
            onChange={event => {
              this.props.changeTimeSeriesOption('timeField', event.target.value);
            }}
            value={this.props.timeSeries.timeField}
          />
        </div>

        <div className="form-group">
          <TextInput
            label="metaField"
            description={META_FIELD_INPUT_DESCRIPTION}
            optional
            onChange={event => {
              this.props.changeTimeSeriesOption('metaField', event.target.value);
            }}
            value={this.props.timeSeries.metaField}
          />
        </div>

        <div className="form-group">
          <TextInput
            label="expireAfterSeconds"
            description={EXPIRE_AFTER_SECONDS_DESCRIPTION}
            optional
            type="number"
            onChange={event => {
              this.props.changeTimeSeriesOption(
                'expireAfterSeconds',
                event.target.value ?
                  +event.target.value : null
              );
            }}
            value={this.props.timeSeries.expireAfterSeconds}
          />
        </div>
      </div>
    );
  }
}

export default Collation;
