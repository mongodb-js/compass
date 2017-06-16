const React = require('react');
const CodeMirror = require('react-codemirror');
const PropTypes = require('prop-types');
require('codemirror-mongodb/addon/hint/mongodb-hint');

const { InfoSprinkle } = require('hadron-react-components');
const { shell } = require('electron');

const debug = require('debug')('monngodb-compass:query:component:query-option');

class QueryOption extends React.Component {
  _getOuterClassName() {
    const outerClassList = [
      'querybar-option',
      `querybar-option-is-${this.props.inputType}-type`
    ];

    if (this.props.hasError) {
      outerClassList.push('querybar-option-has-error');
    }
    return outerClassList.join(' ');
  }

  _getInnerClassName() {
    const innerClassList = [
      'querybar-option-input',
      `input-${this.props.label}`
    ];
    if (this.props.hasToggle) {
      innerClassList.push('querybar-option-has-toggle');
    }
    return innerClassList.join(' ');
  }

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
  applyChangeFromCodeMirror(newCode, change) {
    const code = newCode.replace(/\n/g, '');
    if (change) {
      if (change.origin === 'complete') {
        debug('Autocomplete used for `%s`', change.text[0]);
        /**
         * TODO (@imlucas) Record autocomplete usage as a metric!
         */
      }
    }
    /* eslint no-new: 0 */
    this.onChange(new window.CustomEvent('change', {
      bubbles: true,
      detail: {
        target: {
          value: code
        }
      }
    }));
  }

  _renderCheckboxInput() {
    return (
      <input
        id={`querybar-option-input-${this.props.label}`}
        className={this._getInnerClassName()}
        type="checkbox"
        checked={this.props.value}
        onChange={this.props.onChange}
      />
    );
  }

  _renderAutoCompleteInput() {
    const options = {
      lineNumbers: false,
      scrollbarStyle: 'null',
      mode: 'javascript',
      autoCloseBrackets: true,
      matchBrackets: true,
      theme: 'mongodb',
      extraKeys: {
        'Ctrl-Space': 'autocomplete'
      },
      mongodb: {
        fields: this.props.schemaFields
      }
    };
    return (
      <CodeMirror
        id={`querybar-option-input-${this.props.label}`}
        className={this._getInnerClassName()}
        ref="codemirror"
        value={this.props.value}
        onChange={this.applyChangeFromCodeMirror}
        options={options}
        placeholder={this.props.placeholder}
      />
    );
  }

  _renderSimpleInput() {
    return (
      <input
        id={`querybar-option-input-${this.props.label}`}
        className={this._getInnerClassName()}
        type="text"
        value={this.props.value}
        onChange={this.props.onChange}
        placeholder={this.props.placeholder}
      />
    );
  }

  render() {
    let input = null;
    if (this.props.label === 'filter') {
      input = this._renderAutoCompleteInput();
    } else if (this.props.inputType === 'boolean') {
      input = this._renderCheckboxInput();
    } else {
      input = this._renderSimpleInput();
    }

    return (
      <div className={this._getOuterClassName()}>
        <div className="querybar-option-label">
          <InfoSprinkle
            helpLink={this.props.link}
            onClickHandler={shell.openExternal}
          />
          {this.props.label}
        </div>
        {input}
      </div>
    );
  }
}

QueryOption.propTypes = {
  placeholder: PropTypes.string,
  label: PropTypes.string.isRequired,
  link: PropTypes.string.isRequired,
  inputType: PropTypes.oneOf(['numeric', 'boolean', 'document']).isRequired,
  value: PropTypes.any,
  hasToggle: PropTypes.bool,
  hasError: PropTypes.bool,
  validationFunc: PropTypes.func,
  onChange: PropTypes.func,
  schemaFields: PropTypes.object
};

QueryOption.defaultProps = {
  placeholder: '',
  value: '',
  hasToggle: false,
  schemaFields: {}
};

QueryOption.displayName = 'QueryOption';

module.exports = QueryOption;
