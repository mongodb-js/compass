const React = require('react');
const CodeMirror = require('react-codemirror');
const PropTypes = require('prop-types');
const CM = require('codemirror');
require('codemirror-mongodb/addon/hint/mongodb-hint');

const { InfoSprinkle } = require('hadron-react-components');
const { shell } = require('electron');

const debug = require('debug')('monngodb-compass:query:component:query-option');

/**
 * Key codes that should not trigger autocomplete.
 *  8: BACKSPACE
 *  27: ESC
 *  37: Left Arrow
 *  39: Right Arrow
 */
const NO_TRIGGER = [ 8, 27, 37, 39 ];

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
  }
}

class QueryOption extends React.Component {
  componentDidMount() {
    const cm = this.refs.codemirror;
    if (cm) {
      /**
       * Set the id on the underlying `<textarea />` used by react-codemirror
       * so the functional tests can read values from it.
       */
      cm.textareaNode.id =`querybar-option-input-${this.props.label}`;
      if (cm.codeMirror) {
        cm.codeMirror.on('keyup', autocomplete);
      }
    }
    const queryActions = global.hadronApp.appRegistry.getAction('Query.Actions');
    this.unsubscribeRefresh = queryActions.refreshCodeMirror.listen(this.refresh.bind(this));
  }

  componentWillUnmount() {
    this.unsubscribeRefresh();

    const cm = this.refs.codemirror;
    if (cm && cm.codeMirror) {
      cm.codeMirror.off('keyup', autocomplete);
    }
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
  }

  refresh() {
    if (this.refs.codemirror) {
      this.refs.codemirror.codeMirror.refresh();
    }
  }

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
        addons={[ 'display/placeholder' ]}
        className={this._getInnerClassName()}
        ref="codemirror"
        value={this.props.value}
        onChange={this.applyChangeFromCodeMirror.bind(this)}
        options={options}
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
    if ([ 'filter', 'project', 'sort' ].includes(this.props.label)) {
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
