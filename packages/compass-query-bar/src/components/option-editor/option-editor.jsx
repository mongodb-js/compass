import React, { Component } from 'react';
import PropTypes from 'prop-types';
import AceEditor from 'react-ace';
import ace from 'brace';
import { QueryAutoCompleter } from 'mongodb-ace-autocompleter';
import Actions from 'actions';

import 'brace/ext/language_tools';
import 'mongodb-ace-mode';
import 'mongodb-ace-theme-query';

/**
 * Options for the ACE editor.
 */
const OPTIONS = {
  enableLiveAutocompletion: true,
  tabSize: 2,
  useSoftTabs: true,
  fontSize: 11,
  minLines: 1,
  maxLines: 1,
  highlightActiveLine: false,
  showGutter: false,
  useWorker: false
};

class OptionEditor extends Component {
  static displayName = 'OptionEditor';

  static propTypes = {
    label: PropTypes.string.isRequired,
    serverVersion: PropTypes.string.isRequired,
    autoPopulated: PropTypes.bool.isRequired,
    actions: PropTypes.object.isRequired,
    value: PropTypes.any,
    onChange: PropTypes.func,
    onApply: PropTypes.func,
    schemaFields: PropTypes.array
  };

  static defaultProps = {
    label: '',
    value: '',
    serverVersion: '3.6.0',
    autoPopulated: false,
    schemaFields: []
  };

  /**
   * Set up the autocompleters once on initialization.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    const tools = ace.acequire('ace/ext/language_tools');
    const textCompleter = tools.textCompleter;
    this.completer = new QueryAutoCompleter(props.serverVersion, textCompleter, props.schemaFields);
    tools.setCompleters([ this.completer ]);
  }

  /**
   * Subscribe on mount.
   */
  componentDidMount() {
    this.unsub = Actions.refreshEditor.listen(() => {
      this.editor.setValue(this.props.value);
      this.editor.clearSelection();
    });

    this.unsubFields = global.hadronApp.appRegistry.getStore('Field.Store').listen((fields) => {
      this.completer.update(this.processFields(fields.fields));
    });
  }

  /**
   * @param {Object} nextProps - The next properties.
   *
   * @returns {Boolean} If the component should update.
   */
  shouldComponentUpdate(nextProps) {
    return nextProps.autoPopulated || nextProps.serverVersion !== this.props.serverVersion;
  }

  /**
   * Unsubscribe listeners.
   */
  componentWillUnmount() {
    this.unsub();
    this.unsubFields();
  }

  /**
   * Handle the changing of the query text.
   *
   * @param {String} newCode - The new query.
   */
  onChangeQuery = (newCode) => {
    this.props.onChange({
      target: {
        value: newCode
      }
    });
  };

  /**
   * Handles converting the field list to an ACE friendly format.
   *
   * @param {Object} fields - The fields.
   *
   * @returns {Array} The field list.
   */
  processFields = (fields) => {
    return Object.keys(fields).map((key) => {
      const field = (key.indexOf('.') > -1 || key.indexOf(' ') > -1) ? `"${key}"` : key;
      return {
        name: key,
        value: field,
        score: 1,
        meta: 'field',
        version: '0.0.0'
      };
    });
  };

  /**
   * Render the editor.
   *
   * @returns {Component} The component.
   */
  render() {
    return (
      <AceEditor
        mode="mongodb"
        theme="mongodb-query"
        width="100%"
        value={this.props.value}
        onChange={this.onChangeQuery}
        editorProps={{ $blockScrolling: Infinity }}
        name={`query-bar-option-input-${this.props.label}`}
        setOptions={OPTIONS}
        onLoad={(editor) => {
          this.editor = editor;
          this.editor.setBehavioursEnabled(true);
          this.editor.commands.addCommand({
            name: 'executeQuery',
            bindKey: {
              win: 'Enter', mac: 'Enter'
            },
            exec: () => {
              this.props.onApply();
            }
          });
        }} />
    );
  }
}

export default OptionEditor;
