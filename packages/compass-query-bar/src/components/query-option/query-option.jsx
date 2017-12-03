import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import CodeMirror from 'components/codemirror';
import CM from 'codemirror';
import { InfoSprinkle } from 'hadron-react-components';
import { shell } from 'electron';

import styles from './query-option.less';

// Add the mongodb hint to codemirror
require('codemirror-mongodb/addon/hint/mongodb-hint');

const debug = require('debug')('monngodb-compass:query:component:query-option');

/**
 * Key codes that should not trigger autocomplete.
 *  8: BACKSPACE
 *  13: ENTER
 *  27: ESC
 *  37: Left Arrow
 *  39: Right Arrow
 */
const NO_TRIGGER = [ 8, 13, 27, 37, 39 ];

/**
 * The common autocomplete function.
 *
 * @param {CodeMirror} code - The codemirror instance.
 * @param {Event} evt - The event.
 */
const autocomplete = (code, evt) => {
  if (!code.state.completionActive) {
    if (!NO_TRIGGER.includes(evt.keyCode)) {
      CM.commands.autocomplete(code);
    }
    if (evt.keyCode === 13) {
      // Submit.
    }
  }
};

class QueryOption extends Component {
  static displayName = 'QueryOption';

  static propTypes = {
    placeholder: PropTypes.string,
    label: PropTypes.string.isRequired,
    link: PropTypes.string.isRequired,
    inputType: PropTypes.oneOf(['numeric', 'boolean', 'document']).isRequired,
    value: PropTypes.any,
    autoPopulated: PropTypes.bool,
    hasToggle: PropTypes.bool,
    hasError: PropTypes.bool,
    validationFunc: PropTypes.func,
    onChange: PropTypes.func,
    schemaFields: PropTypes.object
  };

  static defaultProps = {
    placeholder: '',
    value: '',
    hasToggle: false,
    schemaFields: {}
  };

  componentDidMount() {
    const cm = this.refs.codemirror;

    if (cm) {
      /**
       * Set the id on the underlying `<textarea />` used by react-codemirror
       * so the functional tests can read values from it.
       */
      cm.textareaNode.id = `querybar-option-input-${this.props.label}`;
      if (cm.codeMirror) {
        cm.codeMirror.on('keyup', autocomplete);
        cm.codeMirror.on('focus', this.onFocus);
      }
    }

    const queryActions = global.hadronApp.appRegistry.getAction('Query.Actions');
    this.unsubscribeRefresh = queryActions.refreshCodeMirror.listen(this.refresh);
  }

  componentWillUnmount() {
    const cm = this.refs.codemirror;
    this.unsubscribeRefresh();

    if (cm && cm.codeMirror) {
      cm.codeMirror.off('keyup', autocomplete);
    }
  }

  onFocus = (code) => {
    if (this.props.autoPopulated) {
      code.setCursor(1, -1);
    }
  };

  /**
   * Listen for codemirror input change events. Bubble them up to `onChange(evt)`
   * using a `CustomEvent` so autocomplete enabled inputs look just like simple
   * text inputs to the outside world.
   *
   * @param {String} newCode The updated value of the underlying textarea.
   * @param {object} change A codemirror change object.
   * @api private
   *
   * @example
   * ```javascript
   * // If I start typing in a query filter,
   * // then request autocompletion {█},
   * // then select `custom_attributes.app_name` from the popover list,
   * // then `applyChangeFromCodeMirror()` will be called with:
   * var code = "{'custom_attributes.app_name'}"
   * var change = {
   *   origin: 'complete',
   *   text: [
   *    "'custom_attributes.app_name'"
   *   ],
   *   removed: [""]
   * }
   * ```
   */
  applyChangeFromCodeMirror = (newCode, change) => {
    if (change && change.origin === 'complete') {
      debug('Autocomplete used for `%s`', change.text[0]);
      /**
       * TODO (@imlucas) Record autocomplete usage as a metric!
       */
    }

    this.props.onChange({
      target: {
        value: newCode
      }
    });
  };

  refresh = () => {
    const { codemirror } = this.refs;

    if (codemirror) {
      codemirror.codeMirror.refresh();
    }
  };

  _getInnerClassName() {
    const { label, inputType, hasToggle } = this.props;

    return classnames(
      styles.input,
      { [ styles[`input-${label}`] ]: label },
      { [ styles[`input-${inputType}`] ]: inputType },
      { [ styles['has-toggle'] ]: hasToggle }
    );
  }

  _renderCheckboxInput() {
    const { label, value, onChange } = this.props;

    return (
      <input
        id={`querybar-option-input-${label}`}
        data-test-id="query-bar-option-input"
        className={this._getInnerClassName()}
        type="checkbox"
        checked={value}
        onChange={onChange}
      />
    );
  }

  _renderAutoCompleteInput() {
    const options = {
      lineNumbers: false,
      scrollbarStyle: 'null',
      mode: 'javascript',
      autoCloseBrackets: true,
      autoRefresh: true,
      placeholder: this.props.placeholder,
      matchBrackets: true,
      theme: 'mongodb',
      extraKeys: {
        'Ctrl-Space': 'autocomplete',
        '$': 'autocomplete'
      },
      oneliner: true,
      mongodb: {
        fields: this.props.schemaFields,
        fuzzy: false,
        input: this.props.label
      }
    };

    return (
      <CodeMirror
        data-test-id="query-bar-option-input"
        addons={[ 'display/placeholder' ]}
        className={this._getInnerClassName()}
        ref="codemirror"
        value={this.props.value}
        onChange={this.applyChangeFromCodeMirror}
        options={options}
      />
    );
  }

  _renderSimpleInput() {
    return (
      <input
        id={`querybar-option-input-${this.props.label}`}
        data-test-id="query-bar-option-input"
        className={this._getInnerClassName()}
        type="text"
        value={this.props.value}
        onChange={this.props.onChange}
        placeholder={this.props.placeholder}
      />
    );
  }

  render() {
    const { inputType, hasError, link, label } = this.props;
    let input = null;

    if ([ 'filter', 'project', 'sort' ].includes(label)) {
      input = this._renderAutoCompleteInput();
    } else if (this.props.inputType === 'boolean') {
      input = this._renderCheckboxInput();
    } else {
      input = this._renderSimpleInput();
    }

    const _className = classnames(
      styles.component,
      { [ styles[`is-${inputType}-type`] ]: true },
      { [ styles['has-error'] ]: hasError }
    );

    return (
      <div
        className={_className}
        data-test-id="query-bar-option">
        <div
          className={classnames(styles.label)}
          data-test-id="query-bar-option-label">
          <InfoSprinkle
            helpLink={link}
            onClickHandler={shell.openExternal}
          />
          {label}
        </div>
        {input}
      </div>
    );
  }
}

export default QueryOption;
export { QueryOption };
