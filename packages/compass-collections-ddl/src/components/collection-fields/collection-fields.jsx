import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import _ from 'lodash';

import Checkbox from '@leafygreen-ui/checkbox';
import TextInput from '@leafygreen-ui/text-input';

import CollationFields from './collation-fields';

const TIME_FIELD_INPUT_DESCRIPTION = 'Specify which field should be used ' +
  'as timeField for the time-series collection.';

const META_FIELD_INPUT_DESCRIPTION = 'The designated field ' +
  'for metadata.';

const EXPIRE_AFTER_SECONDS_DESCRIPTION = 'Enables ' +
  'automatic deletion of documents older than the specified number of seconds.';

import hasTimeSeriesSupport from './has-time-series-support';

export default class CollectionFields extends PureComponent {
  static propTypes = {
    onChange: PropTypes.func,
    withDatabase: PropTypes.bool,
    serverVersion: PropTypes.string
  }

  constructor() {
    super();
    this.state = {
      fields: {}
    };
  }

  setField(fieldName, value) {
    const fields = _.cloneDeep(this.state.fields);
    _.set(fields, fieldName, Object.is(value, NaN) ? undefined : value);
    this.setState({ fields }, () => {
      this.triggerOnChange();
    });
  }

  asNumber(value) {
    return `${value}` ? +value : undefined;
  }

  triggerOnChange() {
    if (!this.props.onChange) {
      return;
    }

    this.props.onChange({
      database: this.state.fields.databaseName,
      collection: this.state.fields.collectionName,
      options: this.buildOptions()
    });
  }

  buildOptions() {
    const state = this.state;
    const cappedOptions = state.isCapped ? {
      capped: true,
      size: state.fields.cappedSize ? state.fields.cappedSize : undefined
    } : {};

    const collationOptions = state.isCustomCollation ? {
      collation: state.fields.collation
    } : {};

    const timeSeriesOptions = state.isTimeSeries ? {
      timeseries: state.fields.timeSeries
    } : {};

    return {
      ...collationOptions,
      ...cappedOptions,
      ...timeSeriesOptions
    };
  }

  renderDatabaseNameGroup() {
    return (<div className="form-group">
      <TextInput
        id="create-database-name"
        autoFocus
        required
        label="Database Name"
        onChange={(e) => this.setField('databaseName', e.target.value)}
      />
    </div>);
  }

  renderCollectionNameGroup() {
    return (<div className="form-group">
      <TextInput
        id="create-collection-name"
        autoFocus={!this.props.withDatabase}
        required
        label="Collection Name"
        onChange={(e) => this.setField('collectionName', e.target.value)}
      />
    </div>);
  }

  renderCappedFields() {
    return (<TextInput
      label="size"
      type="number"
      description="Maximum size in bytes for the capped collection."
      onChange={(e) => this.setField('cappedSize', this.asNumber(e.target.value))} />);
  }

  renderCappedGroup() {
    return (
      <div className="form-group">
        <Checkbox
          onChange={event => {
            this.setState({isCapped: event.target.checked});
          }}
          label="Capped Collection"
          checked={this.state.isCapped}
          bold={false}
        />

        {!this.state.isCapped ? '' : this.renderCappedFields()}
      </div>
    );
  }

  renderCollationFields() {
    return (<CollationFields collation={this.state.fields.collation || {}} changeCollationOption={
      (field, value) => this.setField(`collation.${field}`, value)
    } />);
  }

  renderCollationGroup() {
    return (<div className="form-group">
      <Checkbox
        onChange={event => {
          this.setState({isCustomCollation: event.target.checked});
        }}
        label="Use Custom Collation"
        checked={this.state.isCustomCollation}
        bold={false}
      />

      {!this.state.isCustomCollation ? '' : this.renderCollationFields()}
    </div>);
  }

  renderTimeSeriesFields() {
    return (<div><div className="form-group">
      <TextInput
        label="timeField"
        description={TIME_FIELD_INPUT_DESCRIPTION}
        required
        onChange={
          (e) => this.setField('timeseries.timeField', e.target.value)
        }
      />
    </div>

    <div className="form-group">
      <TextInput
        label="metaField"
        description={META_FIELD_INPUT_DESCRIPTION}
        optional
        onChange={(e) => this.setField('timeseries.metaField', e.target.value)}
      />
    </div>

    <div className="form-group">
      <TextInput
        label="expireAfterSeconds"
        description={EXPIRE_AFTER_SECONDS_DESCRIPTION}
        optional
        type="number"
        onChange={
          (e) => this.setField('timeseries.expireAfterSeconds', this.asNumber(e.target.value))
        }
      />
    </div></div>);
  }

  renderTimeSeriesGroup() {
    if (!hasTimeSeriesSupport(this.props.serverVersion)) {
      return;
    }

    return (<div className="form-group">
      <Checkbox
        onChange={event => {
          this.setState({isTimeSeries: event.target.checked});
        }}
        label="Time-Series"
        checked={this.state.isTimeSeries}
        bold={false}
      />

      {!this.state.isTimeSeries ? '' : this.renderTimeSeriesFields()}
    </div>);
  }

  render() {
    return (<div>
      {this.props.withDatabase ? this.renderDatabaseNameGroup() : ''}
      {this.renderCollectionNameGroup()}
      {this.renderCappedGroup()}
      {this.renderCollationGroup()}
      {this.renderTimeSeriesGroup()}
    </div>);
  }
}
