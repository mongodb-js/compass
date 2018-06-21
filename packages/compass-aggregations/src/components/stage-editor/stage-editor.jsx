import React, { Component } from 'react';
import PropTypes from 'prop-types';
import AceEditor from 'react-ace';
import ace from 'brace';
import classnames from 'classnames';
import debounce from 'lodash.debounce';
import { StageAutoCompleter } from 'mongodb-ace-autocompleter';

import styles from './stage-editor.less';

import 'brace/ext/language_tools';
import 'mongodb-ace-mode';
import 'mongodb-ace-theme';

/**
 * Options for the ACE editor.
 */
const OPTIONS = {
  enableLiveAutocompletion: true,
  tabSize: 2,
  fontSize: 11,
  minLines: 5,
  maxLines: Infinity,
  showGutter: true,
  useWorker: false
};

/**
 * Edit a single stage in the aggregation pipeline.
 */
class StageEditor extends Component {
  static displayName = 'StageEditorComponent';

  static propTypes = {
    stage: PropTypes.object.isRequired,
    runStage: PropTypes.func.isRequired,
    index: PropTypes.number.isRequired,
    serverVersion: PropTypes.string.isRequired,
    fields: PropTypes.array.isRequired,
    stageChanged: PropTypes.func.isRequired,
    setIsModified: PropTypes.func.isRequired
  }

  /**
   * Set up the autocompleters once on initialization.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    const tools = ace.acequire('ace/ext/language_tools');
    const textCompleter = tools.textCompleter;
    this.completer = new StageAutoCompleter(
      this.props.serverVersion,
      textCompleter,
      this.props.fields,
      this.props.stage.stageOperator
    );
    tools.setCompleters([ this.completer ]);
    this.debounceRun = debounce(this.onRunStage, 750);
  }

  /**
   * On update if the stage operator is changed insert the snippet and focus on the editor.
   *
   * @param {Object} prevProps - The previous properties.
   */
  componentDidUpdate(prevProps) {
    console.log('### StageEditor.componentDidUpdate', this.props);
    this.completer.update(this.props.fields, this.props.stage.stageOperator);
    this.completer.version = this.props.serverVersion;
    console.log('### Completer', this.completer);
    if (this.props.stage.stageOperator !== prevProps.stage.stageOperator && this.editor) {
      this.editor.setValue('');
      this.editor.insertSnippet(this.props.stage.snippet || '');
      this.editor.focus();
    }
  }

  /**
   * Need to decorate the change event with the stage index before
   * dispatching.
   *
   * @param {String} value - The value of the stage.
   */
  onStageChange = (value) => {
    this.props.stageChanged(value, this.props.index);
    this.props.setIsModified(true);

    if (
      this.props.stage.fromStageOperators === false &&
      this.props.stage.isValid
    ) {
      this.debounceRun();
    }
  }

  /**
   * Need to decorate the change event with the stage index before
   * dispatching.
   */
  onRunStage = () => {
    if (this.props.stage.isValid) {
      this.props.runStage(this.props.index);
    }
  }

  /**
   * Render the error.
   *
   * @returns {React.Component} The component.
   */
  renderError() {
    if (this.props.stage.error) {
      return (
        <div className={classnames(styles['stage-editor-errormsg'])}>
          {this.props.stage.error}
        </div>
      );
    }
  }

  renderSyntaxError() {
    if (!this.props.stage.isValid) {
      return (
        <div className={classnames(styles['stage-editor-syntax-error'])}>
          {this.props.stage.syntaxError}
        </div>
      );
    }
  }

  /**
   * Render the stage editor component.
   *
   * @returns {Component} The component.
   */
  render() {
    return (
      <div>
        <div className={classnames(styles['stage-editor'])}>
          <AceEditor
            mode="mongodb"
            theme="mongodb"
            width="100%"
            readOnly={this.props.stage.stageOperator === null}
            value={this.props.stage.stage}
            onChange={this.onStageChange}
            editorProps={{ $blockScrolling: Infinity }}
            name={`aggregations-stage-editor-${this.props.index}`}
            setOptions={OPTIONS}
            onLoad={(editor) => {
              this.editor = editor;
            }}
          />
        </div>
        {this.renderSyntaxError()}
        {this.renderError()}
      </div>
    );
  }
}

export default StageEditor;
