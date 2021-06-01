/* eslint-disable react/no-multi-comp */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import Checkbox from '@leafygreen-ui/checkbox';
import TextInput from '@leafygreen-ui/text-input';
import { Select, Option } from '@leafygreen-ui/select';

import COLLATION_OPTIONS from './collation-options';
import hasTimeSeriesSupport from './has-time-series-support';

const TIME_FIELD_INPUT_DESCRIPTION = 'Specify which field should be used ' +
  'as timeField for the time-series collection.';

const META_FIELD_INPUT_DESCRIPTION = 'The designated field ' +
  'for metadata.';

const EXPIRE_AFTER_SECONDS_DESCRIPTION = 'Enables ' +
  'automatic deletion of documents older than the specified number of seconds.';

class FieldSet extends PureComponent {
  static propTypes = {
    children: PropTypes.node
  }

  render() {
    return <fieldset className="form-group">{this.props.children}</fieldset>;
  }
}

class CollapsibleFieldset extends PureComponent {
  static propTypes = {
    children: PropTypes.node,
    label: PropTypes.string.isRequired,
    description: PropTypes.oneOfType([
      PropTypes.element,
      PropTypes.string
    ]),
    onToggle: PropTypes.func.isRequired,
    toggled: PropTypes.bool
  }

  render() {
    return (<FieldSet>
      <div className={this.props.toggled ? 'form-group' : ''}>
        <Checkbox
          onChange={event => {
            this.props.onToggle(event.target.checked);
          }}
          label={this.props.label}
          checked={this.props.toggled}
          bold={false}
        />
        {!this.props.description ? '' : this.props.description}
      </div>
      {!this.props.toggled ? '' : this.props.children}
    </FieldSet>);
  }
}

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

  renderDatabaseNameField() {
    return (<FieldSet>
      <TextInput
        autoFocus
        required
        label="Database Name"
        onChange={(e) => this.setField('databaseName', e.target.value)}
      />
    </FieldSet>);
  }

  renderCollectionNameField() {
    return (<FieldSet>
      <TextInput
        autoFocus={!this.props.withDatabase}
        required
        label="Collection Name"
        onChange={(e) => this.setField('collectionName', e.target.value)}
      />
    </FieldSet>);
  }

  renderCappedCollectionFields() {
    return (<CollapsibleFieldset
      toggled={this.state.isCapped}
      onToggle={checked => { this.setState({isCapped: checked}); }}
      label="Capped Collection"
      description="Capped Collection Fixed-size collections that support high-throughput operations that insert and retrieve documents based on insertion order."
    >
      <TextInput
        label="size"
        type="number"
        description="Maximum size in bytes for the capped collection."
        onChange={(e) => this.setField('cappedSize', this.asNumber(e.target.value))} />
    </CollapsibleFieldset>);
  }

  renderCollationOptions(values) {
    const unifiedValues = values.map((elem) => ({
      value: (typeof elem === 'object') ? elem.value : elem,
      label: (typeof elem === 'object') ? elem.label : elem
    }));
    const options = _.sortBy(unifiedValues, 'value');

    return options.map(({value, label}) => {
      return <Option key={label} value={`${value}`}>{label}</Option>;
    });
  }

  renderCollationFields() {
    const options = COLLATION_OPTIONS.map((element) => {
      return (
        <FieldSet key={element.field}>
          <Select
            // value={this.props.collation[element.field]}
            label={element.field}
            name={element.field}
            placeholder={'Select a value'}
            // options={this.getDropdownFieldsSelect(element.values)}
            // onChange={this.onChangeCollationOption.bind(this, element.field)}
            // className={classnames(styles['collation-select'])}
            // clearable={false}
          >
            {this.renderCollationOptions(element.values)}
          </Select>
        </FieldSet>
      );
    });

    return (
      <CollapsibleFieldset
        onToggle={checked => {
          this.setState({isCustomCollation: checked});
        }}
        label="Use Custom Collation"
        toggled={this.state.isCustomCollation}
        description="Use Custom Collation Collation allows users to specify language-specific rules for string comparison, such as rules for lettercase and accent marks."
      >{options}</CollapsibleFieldset>
    );
  }

  renderTimeSeriesFields() {
    if (!hasTimeSeriesSupport(this.props.serverVersion)) {
      return;
    }

    return (<CollapsibleFieldset
      onToggle={checked => {
        this.setState({isTimeSeries: checked});
      }}
      toggled={this.state.isTimeSeries}
      label="Time-Series"
      description="Time-series collections efficiently store sequences of measurements over a period of time."
    >
      <FieldSet>
        <TextInput
          label="timeField"
          description={TIME_FIELD_INPUT_DESCRIPTION}
          required
          onChange={
            (e) => this.setField('timeseries.timeField', e.target.value)
          }
        />
      </FieldSet>

      <FieldSet>
        <TextInput
          label="metaField"
          description={META_FIELD_INPUT_DESCRIPTION}
          optional
          onChange={(e) => this.setField('timeseries.metaField', e.target.value)}
        />
      </FieldSet>

      <FieldSet>
        <TextInput
          label="expireAfterSeconds"
          description={EXPIRE_AFTER_SECONDS_DESCRIPTION}
          optional
          type="number"
          onChange={
            (e) => this.setField('timeseries.expireAfterSeconds', this.asNumber(e.target.value))
          }
        />
      </FieldSet>

    </CollapsibleFieldset>);
  }


  render() {
    return (<div>
      {this.props.withDatabase ? this.renderDatabaseNameField() : ''}
      {this.renderCollectionNameField()}
      {this.renderCappedCollectionFields()}
      {this.renderCollationFields()}
      {this.renderTimeSeriesFields()}
    </div>);
  }
}
