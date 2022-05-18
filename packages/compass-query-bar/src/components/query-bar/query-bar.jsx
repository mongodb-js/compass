import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Dropdown, MenuItem } from 'react-bootstrap';
import { isFunction, pick, isEqual, isString, isArray, map } from 'lodash';
import FontAwesome from 'react-fontawesome';

import QueryOption from '../query-option';
import OptionsToggle from '../options-toggle';
import QUERY_PROPERTIES from '../../constants/query-properties';

import styles from './query-bar.module.less';

/**
 * @type {Record<string, { type: 'document' | 'numeric' | 'boolean', placeholder: string | null, link: string, label?: string }>}
 */
const OPTION_DEFINITION = {
  filter: {
    type: 'document',
    placeholder: "{ field: 'value' }",
    link: 'https://docs.mongodb.com/compass/current/query/filter/',
  },
  project: {
    type: 'document',
    placeholder: '{ field: 0 }',
    link: 'https://docs.mongodb.com/manual/tutorial/project-fields-from-query-results/',
  },
  sort: {
    type: 'document',
    placeholder: "{ field: -1 } or [['field', -1]]",
    link: 'https://docs.mongodb.com/manual/reference/method/cursor.sort/',
  },
  collation: {
    type: 'document',
    placeholder: "{ locale: 'simple' }",
    link: 'https://docs.mongodb.com/master/reference/collation/',
  },
  skip: {
    type: 'numeric',
    placeholder: '0',
    link: 'https://docs.mongodb.com/manual/reference/method/cursor.skip/',
  },
  limit: {
    type: 'numeric',
    placeholder: '0',
    link: 'https://docs.mongodb.com/manual/reference/method/cursor.limit/',
  },
  maxTimeMS: {
    label: 'Max Time MS',
    type: 'numeric',
    placeholder: '60000',
    link: 'https://docs.mongodb.com/manual/reference/method/cursor.maxTimeMS/',
  },
  sample: {
    type: 'boolean',
    placeholder: null,
    link: 'https://docs.mongodb.com/TBD',
  },
};

class QueryBar extends Component {
  static displayName = 'QueryBar';

  static propTypes = {
    store: PropTypes.object.isRequired,
    filter: PropTypes.object,
    project: PropTypes.object,
    sort: PropTypes.object,
    collation: PropTypes.object,
    skip: PropTypes.number,
    limit: PropTypes.number,
    maxTimeMS: PropTypes.number,
    sample: PropTypes.bool,

    valid: PropTypes.bool,
    filterValid: PropTypes.bool,
    projectValid: PropTypes.bool,
    collationValid: PropTypes.bool,
    sortValid: PropTypes.bool,
    skipValid: PropTypes.bool,
    limitValid: PropTypes.bool,

    featureFlag: PropTypes.bool,
    autoPopulated: PropTypes.bool,
    filterString: PropTypes.string,
    projectString: PropTypes.string,
    collationString: PropTypes.string,
    sortString: PropTypes.string,
    skipString: PropTypes.string,
    limitString: PropTypes.string,

    filterPlaceholder: PropTypes.string,
    projectPlaceholder: PropTypes.string,
    collationPlaceholder: PropTypes.string,
    sortPlaceholder: PropTypes.string,
    skipPlaceholder: PropTypes.string,
    limitPlaceholder: PropTypes.string,
    maxTimeMSPlaceholder: PropTypes.string,

    actions: PropTypes.object,
    buttonLabel: PropTypes.string,
    queryState: PropTypes.string,
    serverVersion: PropTypes.string,
    layout: PropTypes.array,
    expanded: PropTypes.bool,
    lastExecutedQuery: PropTypes.object,
    onReset: PropTypes.func,
    onApply: PropTypes.func,
    resultId: PropTypes.number,
    schemaFields: PropTypes.array,
    showQueryHistoryButton: PropTypes.bool,
    showExportToLanguageButton: PropTypes.bool,
  };

  static defaultProps = {
    expanded: false,
    buttonLabel: 'Apply',
    layout: [
      'filter',
      'project',
      ['sort', 'maxTimeMS'],
      ['collation', 'skip', 'limit'],
    ],
    schemaFields: [],
    showQueryHistoryButton: true,
    showExportToLanguageButton: true,
    resultId: 0,
  };

  state = {
    hasFocus: false,
  };

  onChange(label, evt) {
    const type = OPTION_DEFINITION[label].type;
    const { actions } = this.props;

    if (['numeric', 'document'].includes(type)) {
      return actions.typeQueryString(label, evt.target.value);
    }
    if (type === 'boolean') {
      // there is only one boolean toggle: sample
      return actions.toggleSample(evt.target.checked);
    }
  }

  onApplyButtonClicked = (evt) => {
    // No evt when pressing enter from ACE.
    if (evt) {
      evt.preventDefault();
      evt.stopPropagation();
    }

    const { actions, valid, featureFlag, onApply } = this.props;

    if (valid || featureFlag) {
      actions.apply();

      if (isFunction(onApply)) {
        onApply();
      }
    }
  };

  onResetButtonClicked = () => {
    const { actions, onReset } = this.props;
    actions.reset();

    if (isFunction(onReset)) {
      onReset();
    }
  };

  getQueryOption(
    label,
    autoPopulated,
    hasToggle,
    hasError,
    id,
    value,
    placeholder,
    option
  ) {
    return (
      <QueryOption
        label={label}
        autoPopulated={autoPopulated}
        serverVersion={this.props.serverVersion}
        hasToggle={hasToggle}
        hasError={hasError}
        key={`query-option-${id}`}
        value={value}
        actions={this.props.actions}
        placeholder={placeholder}
        link={OPTION_DEFINITION[option].link}
        inputType={OPTION_DEFINITION[option].type}
        onChange={this.onChange.bind(this, option)}
        onApply={this.onApplyButtonClicked}
        schemaFields={this.props.schemaFields}
      />
    );
  }

  _onFocus = () => {
    this.setState({ hasFocus: true });
  };

  _onBlur = () => {
    this.setState({ hasFocus: false });
  };

  _showToggle() {
    return this.props.layout.length > 1;
  }

  _queryHasChanges() {
    const query = pick(this.props, QUERY_PROPERTIES);
    return !isEqual(query, this.props.lastExecutedQuery);
  }

  /**
   * renders the options toggle button in the top right corner, if the layout
   * is multi-line.
   *
   * @returns {Component|null}  the toggle component or null.
   */
  renderToggle() {
    const { expanded, actions } = this.props;

    return this._showToggle() ? (
      <OptionsToggle expanded={expanded} actions={actions} />
    ) : null;
  }

  /**
   * renders a single query option, either as its own row, or as part of a
   * option group.
   *
   * @param {String} option       the option name to render
   * @param {Number} id           the option number
   * @param {Boolean} hasToggle   this option contains the expand toggle
   *
   * @return {Component}          the option component
   */
  renderOption(option, id, hasToggle) {
    const { filterValid, featureFlag, autoPopulated } = this.props;

    // for filter only, also validate feature flag directives
    const hasError =
      option === 'filter'
        ? !(filterValid || featureFlag)
        : !this.props[`${option}Valid`];

    // checkbox options use the value directly, text inputs use the
    // `<option>String` prop.
    const value =
      OPTION_DEFINITION[option].type === 'boolean'
        ? this.props[option]
        : this.props[`${option}String`];

    const label = OPTION_DEFINITION[option].label || option;
    const placeholder =
      this.props[`${option}Placeholder`] ||
      OPTION_DEFINITION[option].placeholder;

    const queryOption = this.getQueryOption(
      label,
      autoPopulated,
      hasToggle,
      hasError,
      id,
      value,
      placeholder,
      option
    );

    if (hasToggle) {
      return (
        <div
          className={styles['query-option-toggle-row']}
          key={`query-option-${id}`}
        >
          {queryOption}
          {this.renderToggle()}
        </div>
      );
    }

    return queryOption;
  }

  /**
   * renders a group of several query options, that are placed horizontally
   * in the same row.
   *
   * @param {Array} group   The group array, e.g. ['sort', 'skip', 'limit']
   * @param {Number} id     The group number
   *
   * @returns {Component}   The group component
   */
  renderOptionGroup(group, id) {
    const options = map(group, (option, i) => {
      return this.renderOption(option, i, false);
    });

    return (
      <div
        className={classnames(styles['option-group'])}
        key={`option-group-${id}`}
      >
        {options}
      </div>
    );
  }

  /**
   * renders the rows of the querybar component
   *
   * @return {Fragment} array of components, one for each row.
   */
  renderOptionRows() {
    const { layout, expanded } = this.props;

    // for multi-line layouts, the first option must be stand-alone
    if (this._showToggle() && !isString(layout[0])) {
      throw new Error(
        `First item in multi-line layout must be single option, found ${layout[0]}`
      );
    }

    const rows = map(layout, (row, id) => {
      // only the first in multi-line options has the toggle
      const hasToggle = id === 0 && this._showToggle();

      if (isString(row)) {
        return this.renderOption(row, id, hasToggle);
      } else if (isArray(row)) {
        return this.renderOptionGroup(row, id);
      }
      throw new Error('Layout items must be string or array, found ' + row);
    });

    if (expanded) {
      return rows;
    }

    return rows.slice(0, 1);
  }

  /**
   * Render Query Bar input form (just the input fields and buttons).
   *
   * @returns {React.Component} The Query Bar view.
   */
  renderForm = () => {
    const {
      valid,
      featureFlag,
      queryState,
      buttonLabel,
      showQueryHistoryButton,
      showExportToLanguageButton,
    } = this.props;
    const { hasFocus } = this.state;

    const _inputGroupClassName = classnames(
      styles['input-group'],
      { ['has-error']: !valid },
      { ['is-feature-flag']: featureFlag }
    );

    const applyDisabled = !(valid || featureFlag);

    const _queryOptionClassName = classnames(styles['option-container'], {
      [styles['has-focus']]: hasFocus,
    });

    const _applyButtonClassName = classnames(
      'btn',
      'btn-primary',
      'btn-sm',
      styles['apply-button']
    );

    const _resetButtonClassName = classnames(
      'btn',
      'btn-default',
      'btn-sm',
      styles['reset-button'],
      { disabled: queryState !== 'apply' }
    );

    const _queryHistoryClassName = classnames(
      'btn',
      'btn-default',
      'btn-sm',
      styles['query-history-button']
    );

    return (
      <div className={_inputGroupClassName}>
        <div
          onBlur={this._onBlur}
          onFocus={this._onFocus}
          className={_queryOptionClassName}
        >
          {this.renderOptionRows()}
        </div>
        <div className={styles['button-group']}>
          <button
            data-test-id="query-bar-apply-filter-button"
            key="apply-button"
            className={_applyButtonClassName}
            type="button"
            onClick={this.onApplyButtonClicked}
            disabled={applyDisabled}
          >
            {buttonLabel}
          </button>
          <button
            data-test-id="query-bar-reset-filter-button"
            key="reset-button"
            className={_resetButtonClassName}
            type="button"
            onClick={this.onResetButtonClicked}
          >
            Reset
          </button>
          {showQueryHistoryButton && (
            <button
              id="query_history_button"
              key="query-history-button"
              className={_queryHistoryClassName}
              data-test-id="query-history-button"
              type="button"
              onClick={this.props.actions.toggleQueryHistory}
              title="Toggle Query History"
            >
              <FontAwesome
                data-test-id="query-history-button-icon"
                name="history"
              />
            </button>
          )}
        </div>

        {showExportToLanguageButton && (
          <Dropdown pullRight id="query-bar-menu-actions">
            <Dropdown.Toggle noCaret>
              <i className="mms-icon-ellipsis" aria-hidden />
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <MenuItem onClick={this.props.actions.exportToLanguage}>
                Export To Language
              </MenuItem>
            </Dropdown.Menu>
          </Dropdown>
        )}
      </div>
    );
  };

  render() {
    return (
      <div
        className={classnames(styles.component)}
        data-test-id="query-bar"
        data-result-id={this.props.resultId}
      >
        <div className={classnames(styles['input-container'])}>
          {this.renderForm()}
        </div>
      </div>
    );
  }
}

export default QueryBar;
export { QueryBar };
