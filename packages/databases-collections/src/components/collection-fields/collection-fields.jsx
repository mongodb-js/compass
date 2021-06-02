/* eslint-disable react/no-multi-comp */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import Checkbox from '@leafygreen-ui/checkbox';
import TextInput from '@leafygreen-ui/text-input';
import { Select, Option, Size } from '@leafygreen-ui/select';
import IconButton from '@leafygreen-ui/icon-button';
import Icon from '@leafygreen-ui/icon';

import COLLATION_OPTIONS from '../../constants/collation';
import hasTimeSeriesSupport from './has-time-series-support';
import styles from './collection-fields.less';

const HELP_URL_CAPPED = 'https://docs.mongodb.com/manual/core/capped-collections/';
const HELP_URL_COLLATION = 'https://docs.mongodb.com/master/reference/collation/';

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
    return (
      <fieldset className={styles['form-group']}>
        {this.props.children}
      </fieldset>
    );
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
    helpUrl: PropTypes.string,
    onToggle: PropTypes.func.isRequired,
    toggled: PropTypes.bool,
    openLink: PropTypes.func
  }

  render() {
    return (
      <FieldSet>
        <Checkbox
          onChange={event => {
            this.props.onToggle(event.target.checked);
          }}
          label={this.props.label}
          checked={this.props.toggled}
          bold={false}
        />
        {!this.props.description ? '' : this.props.description}
        {!!this.props.helpUrl && (
          <IconButton
            className={styles['info-btn']}
            aria-label="Time-series collections documentation"
            onClick={() => this.props.openLink(this.props.helpUrl)}
          >
            <Icon
              glyph="InfoWithCircle"
              size="small"
            />
          </IconButton>
        )}
        {!this.props.toggled ? '' : this.props.children}
      </FieldSet>
    );
  }
}

export default class CollectionFields extends PureComponent {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    withDatabase: PropTypes.bool,
    serverVersion: PropTypes.string,
    openLink: PropTypes.func.isRequired
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
      this.props.onChange({
        database: this.state.fields.databaseName,
        collection: this.state.fields.collectionName,
        options: this.buildOptions()
      });
    });
  }

  setCollationField(fieldName, value) {
    // We convert the value to a string for the option value.
    // Here we reset it to its original type.
    if (!Object.is(this.asNumber(value), NaN)) {
      this.setField(`collation.${fieldName}`, this.asNumber(value));
      return;
    }
    if (value === 'false') {
      this.setField(`collation.${fieldName}`, false);
      return;
    }
    if (value === 'true') {
      this.setField(`collation.${fieldName}`, true);
      return;
    }

    this.setField(`collation.${fieldName}`, value);
  }

  asNumber(value) {
    return `${value}` ? +value : undefined;
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
      helpUrl={HELP_URL_CAPPED}
      openLink={this.props.openLink}
      description="Fixed-size collections that support high-throughput operations that insert and retrieve documents based on insertion order."
    >
      <TextInput
        label="size"
        type="number"
        description="Maximum size in bytes for the capped collection."
        onChange={(e) => this.setField('cappedSize', this.asNumber(e.target.value))}
      />
    </CollapsibleFieldset>);
  }

  renderCollationOptions(values) {
    const unifiedValues = values.map((elem) => ({
      value: (typeof elem === 'object') ? elem.value : elem,
      label: (typeof elem === 'object') ? elem.label : elem
    }));
    const options = _.sortBy(unifiedValues, 'value');

    return options.map(({value, label}) => {
      return (<Option
        key={label}
        value={`${value}`}
      >
        {label}
      </Option>);
    });
  }

  renderCollationFields() {
    const options = COLLATION_OPTIONS.map((element) => {
      return (
        <FieldSet key={element.field}>
          <Select
            className={styles['options-select-dropdown']}
            label={element.field}
            name={element.field}
            placeholder={`Select a value${
              element.required ? '' : ' [optional]'
            }`}
            onChange={(val) => this.setCollationField(element.field, val)}
            usePortal={false}
            size={Size.Small}
            allowDeselect={false}
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
        description="Collation allows users to specify language-specific rules for string comparison, such as rules for lettercase and accent marks."
        helpUrl={HELP_URL_COLLATION}
        openLink={this.props.openLink}
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
    return (<>
      {this.props.withDatabase ? this.renderDatabaseNameField() : ''}
      {this.renderCollectionNameField()}
      {this.renderCappedCollectionFields()}
      {this.renderCollationFields()}
      {this.renderTimeSeriesFields()}
    </>);
  }
}
