import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { QueryAutoCompleter } from 'mongodb-ace-autocompleter';
import {
  Editor,
  EditorVariant,
  EditorTextCompleter,
} from '@mongodb-js/compass-components';

import styles from './option-editor.module.less';

class LegacyOptionEditor extends Component {
  static displayName = 'OptionEditor';

  static propTypes = {
    label: PropTypes.string.isRequired,
    serverVersion: PropTypes.string.isRequired,
    autoPopulated: PropTypes.bool.isRequired,
    refreshEditorAction: PropTypes.func.isRequired,
    value: PropTypes.any,
    onChange: PropTypes.func,
    onApply: PropTypes.func,
    placeholder: PropTypes.string,
    schemaFields: PropTypes.array,
  };

  static defaultProps = {
    label: '',
    value: '',
    serverVersion: '3.6.0',
    autoPopulated: false,
    schemaFields: [],
  };

  /**
   * Set up the autocompleters once on initialization.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.completer = new QueryAutoCompleter(
      props.serverVersion,
      EditorTextCompleter,
      props.schemaFields
    );
    this.boundOnFieldsChanged = this.onFieldsChanged.bind(this);
  }

  /**
   * Subscribe on mount.
   */
  componentDidMount() {
    this.unsub = this.props.refreshEditorAction.listen(() => {
      this.editor.setValue(this.props.value);
      this.editor.clearSelection();
    });
  }

  /**
   * @param {Object} nextProps - The next properties.
   *
   * @returns {Boolean} If the component should update.
   */
  shouldComponentUpdate(nextProps) {
    this.boundOnFieldsChanged(nextProps.schemaFields);
    return (
      nextProps.autoPopulated ||
      nextProps.serverVersion !== this.props.serverVersion
    );
  }

  /**
   * Unsubscribe listeners.
   */
  componentWillUnmount() {
    this.unsub();
  }

  onFieldsChanged(fields) {
    this.completer.update(fields);
  }

  /**
   * Handle the changing of the query text.
   *
   * @param {String} newCode - The new query.
   */
  onChangeQuery = (newCode) => {
    this.props.onChange({
      target: {
        value: newCode,
      },
    });
  };

  /**
   * Render the editor.
   *
   * @returns {Component} The component.
   */
  render() {
    return (
      <Editor
        variant={EditorVariant.Shell}
        className={styles['option-editor']}
        theme="mongodb-query"
        text={this.props.value}
        onChangeText={this.onChangeQuery}
        options={{
          useSoftTabs: true,
          minLines: 1,
          maxLines: 10,
          highlightActiveLine: false,
          showPrintMargin: false,
          showGutter: false,
        }}
        id={`query-bar-option-input-${this.props.label}`}
        completer={this.completer}
        placeholder={this.props.placeholder}
        onLoad={(editor) => {
          this.editor = editor;
          this.editor.setBehavioursEnabled(true);
          this.editor.commands.addCommand({
            name: 'executeQuery',
            bindKey: {
              win: 'Enter',
              mac: 'Enter',
            },
            exec: () => {
              this.props.onApply();
            },
          });
        }}
      />
    );
  }
}

export default LegacyOptionEditor;
